import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage.js";
import { parseFile, validateFileType, validateFileSize } from "./services/fileParser.js";
import { extractJobDescriptionInfo, extractCandidateInfo, analyzeCandidateMatch } from "./services/openai.js";
import { generateJobDescriptionEmbedding, generateCandidateEmbedding, calculateMatchScore } from "./services/embeddings.js";
import { insertJobDescriptionSchema, insertCandidateSchema, insertCandidateAnalysisSchema } from "@shared/schema.js";
import { generateCandidatePDF } from "./services/pdfGenerator.js";

// Configure multer for file uploads
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get active job description
  app.get("/api/job-description/active", async (req, res) => {
    try {
      const activeJD = await storage.getActiveJobDescription();
      res.json(activeJD);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all job descriptions
  app.get("/api/job-descriptions", async (req, res) => {
    try {
      const jobs = await storage.getAllJobDescriptions();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get specific job description
  app.get("/api/job-description/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobDescription(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job description not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload job description
  app.post("/api/job-description/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!validateFileSize(req.file.size)) {
        return res.status(400).json({ message: "File size exceeds 10MB limit" });
      }

      // Parse the file
      const rawText = await parseFile(req.file.path, req.file.originalname);
      
      // Extract structured information using AI
      const extractedInfo = await extractJobDescriptionInfo(rawText);
      
      // Generate embedding
      const embedding = await generateJobDescriptionEmbedding(extractedInfo);

      // Deactivate current active JD
      await storage.deactivateAllJobDescriptions();
      
      // Save to database
      const jobDescriptionData = {
        ...extractedInfo,
        fileName: req.file.originalname,
        isActive: true,
        embedding,
      };

      const validatedData = insertJobDescriptionSchema.parse(jobDescriptionData);
      const savedJD = await storage.createJobDescription(validatedData);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json(savedJD);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Upload CVs
  app.post("/api/candidates/upload", upload.array('files', 20), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const { jobDescriptionId } = req.body;
      let targetJD;

      if (jobDescriptionId) {
        targetJD = await storage.getJobDescription(parseInt(jobDescriptionId));
        if (!targetJD) {
          return res.status(400).json({ message: "Job description not found" });
        }
      } else {
        targetJD = await storage.getActiveJobDescription();
        if (!targetJD) {
          return res.status(400).json({ message: "No active job description found. Please upload a job description first." });
        }
      }

      const results = [];
      const errors = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          if (!validateFileSize(file.size)) {
            errors.push({ fileName: file.originalname, error: "File size exceeds 10MB limit" });
            fs.unlinkSync(file.path);
            continue;
          }

          // Parse the CV
          const rawText = await parseFile(file.path, file.originalname);
          
          // Extract structured information using AI
          const extractedInfo = await extractCandidateInfo(rawText);
          
          // Generate embedding
          const embedding = await generateCandidateEmbedding(extractedInfo);

          // Save candidate to database
          const candidateData = {
            ...extractedInfo,
            jobDescriptionId: targetJD.id,
            rawText,
            fileName: file.originalname,
            embedding,
          };

          const validatedCandidateData = insertCandidateSchema.parse(candidateData);
          const savedCandidate = await storage.createCandidate(validatedCandidateData);

          // Perform AI analysis against target job description
          const analysis = await analyzeCandidateMatch(
            rawText,
            `${targetJD.description} ${targetJD.requirements}`,
            extractedInfo.name
          );

          // Calculate similarity score using embeddings
          const embeddingScore = await calculateMatchScore(embedding, targetJD.embedding!);
          
          // Use the higher of the two scores for final match score
          const finalMatchScore = Math.max(analysis.matchScore, embeddingScore);

          // Save analysis to database
          const analysisData = {
            candidateId: savedCandidate.id,
            jobDescriptionId: targetJD.id,
            matchScore: finalMatchScore,
            skillsMatch: analysis.skillsMatch,
            experienceMatch: analysis.experienceMatch,
            educationMatch: analysis.educationMatch,
            industryMatch: analysis.industryMatch,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendation: analysis.recommendation,
            detailedAnalysis: analysis.detailedAnalysis,
            isMatch: analysis.isMatch,
          };

          const validatedAnalysisData = insertCandidateAnalysisSchema.parse(analysisData);
          const savedAnalysis = await storage.createCandidateAnalysis(validatedAnalysisData);

          results.push({
            candidate: savedCandidate,
            analysis: savedAnalysis,
          });

          // Clean up uploaded file
          fs.unlinkSync(file.path);

        } catch (error) {
          errors.push({ fileName: file.originalname, error: error.message });
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      res.json({ results, errors });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files as Express.Multer.File[]) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get all candidates with analysis
  app.get("/api/candidates", async (req, res) => {
    try {
      const { jobDescriptionId, search, minScore, maxScore, status, page = 1, limit = 10 } = req.query;
      
      const candidates = await storage.getCandidatesWithAnalysis({
        jobDescriptionId: jobDescriptionId ? parseInt(jobDescriptionId as string) : undefined,
        search: search as string,
        minScore: minScore ? parseInt(minScore as string) : undefined,
        maxScore: maxScore ? parseInt(maxScore as string) : undefined,
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get candidate by ID with analysis
  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      const candidate = await storage.getCandidateWithAnalysis(candidateId);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get processing status (for real-time updates)
  app.get("/api/processing/status", async (req, res) => {
    try {
      // This would be implemented with WebSocket or Server-Sent Events for real-time updates
      // For now, return empty array as processing happens synchronously
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update candidate status
  app.patch("/api/candidates/:id/status", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !['pending', 'shortlisted', 'rejected', 'hired'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be: pending, shortlisted, rejected, or hired" });
      }

      await storage.updateCandidateStatus(candidateId, status);
      res.json({ message: "Status updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // Update interview notes
  app.patch("/api/candidates/:id/notes", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      const { interviewNotes } = req.body;

      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      await storage.updateCandidateNotes(candidateId, interviewNotes);
      res.json({ message: "Interview notes updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // PDF Export endpoint
  app.get("/api/candidates/:id/pdf", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ error: "Invalid candidate ID" });
      }

      const candidate = await storage.getCandidateWithAnalysis(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const options = {
        includeAnalysis: req.query.includeAnalysis === 'true',
        includeContact: req.query.includeContact === 'true',
        includeNotes: req.query.includeNotes === 'true'
      };

      const pdfBuffer = generateCandidatePDF(candidate, options);
      const candidateName = candidate.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'candidate';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${candidateName}_profile.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
