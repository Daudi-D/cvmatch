import { 
  users, 
  jobDescriptions, 
  candidates, 
  candidateAnalysis,
  cvOptimizations,
  userCvs,
  cvAnalyses,
  type User, 
  type JobDescription,
  type InsertJobDescription,
  type Candidate,
  type InsertCandidate,
  type CandidateAnalysis,
  type InsertCandidateAnalysis,
  type CandidateWithAnalysis,
  type CvOptimization,
  type InsertCvOptimization,
  type UserCv,
  type InsertUserCv,
  type CvAnalysis,
  type InsertCvAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: any): Promise<User>;

  // Job Description methods
  getActiveJobDescription(): Promise<JobDescription | undefined>;
  getAllJobDescriptions(): Promise<JobDescription[]>;
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  createJobDescription(insertJD: InsertJobDescription): Promise<JobDescription>;
  deactivateAllJobDescriptions(): Promise<void>;

  // Candidate methods
  createCandidate(insertCandidate: InsertCandidate): Promise<Candidate>;
  getCandidatesWithAnalysis(filters: {
    jobDescriptionId?: number;
    search?: string;
    minScore?: number;
    maxScore?: number;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{
    candidates: CandidateWithAnalysis[];
    total: number;
    hasMore: boolean;
  }>;
  getCandidateWithAnalysis(candidateId: number): Promise<CandidateWithAnalysis | undefined>;
  updateCandidateStatus(candidateId: number, status: string): Promise<void>;
  updateCandidateNotes(candidateId: number, interviewNotes: string): Promise<void>;

  // Analysis methods
  createCandidateAnalysis(insertAnalysis: InsertCandidateAnalysis): Promise<CandidateAnalysis>;

  // CV Optimization methods
  createCvOptimization(insertOptimization: InsertCvOptimization): Promise<CvOptimization>;
  getCvOptimization(id: number): Promise<CvOptimization | undefined>;
  updateCvOptimization(id: number, updates: Partial<CvOptimization>): Promise<void>;

  // CV Library methods
  getUserCvs(): Promise<UserCv[]>;
  getUserCv(id: number): Promise<UserCv | undefined>;
  createUserCv(insertCv: InsertUserCv): Promise<UserCv>;
  updateUserCv(id: number, updates: Partial<UserCv>): Promise<void>;
  deleteUserCv(id: number): Promise<void>;
  setActiveCv(id: number): Promise<void>;

  // CV Analysis methods
  createCvAnalysis(insertAnalysis: InsertCvAnalysis): Promise<CvAnalysis>;
  getCvAnalysis(id: number): Promise<CvAnalysis | undefined>;
  updateCvAnalysis(id: number, updates: Partial<CvAnalysis>): Promise<void>;

  // Dashboard methods
  getDashboardStats(): Promise<any>;
  getRecentActivity(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getActiveJobDescription(): Promise<JobDescription | undefined> {
    const [activeJD] = await db
      .select()
      .from(jobDescriptions)
      .where(eq(jobDescriptions.isActive, true))
      .orderBy(desc(jobDescriptions.createdAt))
      .limit(1);
    return activeJD || undefined;
  }

  async getAllJobDescriptions(): Promise<JobDescription[]> {
    const jobs = await db
      .select()
      .from(jobDescriptions)
      .orderBy(desc(jobDescriptions.createdAt));
    return jobs;
  }

  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    const [job] = await db
      .select()
      .from(jobDescriptions)
      .where(eq(jobDescriptions.id, id))
      .limit(1);
    return job || undefined;
  }

  async createJobDescription(insertJD: InsertJobDescription): Promise<JobDescription> {
    const [jobDescription] = await db
      .insert(jobDescriptions)
      .values(insertJD)
      .returning();
    return jobDescription;
  }

  async deactivateAllJobDescriptions(): Promise<void> {
    await db
      .update(jobDescriptions)
      .set({ isActive: false })
      .where(eq(jobDescriptions.isActive, true));
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const candidateData = { ...insertCandidate };
    // Ensure status is a valid enum value
    if (candidateData.status && !['pending', 'shortlisted', 'rejected', 'hired'].includes(candidateData.status)) {
      candidateData.status = 'pending';
    }
    
    const [candidate] = await db
      .insert(candidates)
      .values(candidateData as any)
      .returning();
    return candidate;
  }

  async getCandidatesWithAnalysis(filters: {
    jobDescriptionId?: number;
    search?: string;
    minScore?: number;
    maxScore?: number;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{
    candidates: CandidateWithAnalysis[];
    total: number;
    hasMore: boolean;
  }> {
    const { jobDescriptionId, search, minScore, maxScore, status, page, limit } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];
    
    if (jobDescriptionId) {
      conditions.push(eq(candidates.jobDescriptionId, jobDescriptionId));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(candidates.name, `%${search}%`),
          ilike(candidates.email, `%${search}%`),
          sql`array_to_string(${candidates.skills}, ' ') ILIKE ${'%' + search + '%'}`
        )
      );
    }

    if (status) {
      conditions.push(eq(candidates.status, status as any));
    }

    if (minScore !== undefined) {
      conditions.push(gte(candidateAnalysis.matchScore, minScore));
    }

    if (maxScore !== undefined) {
      conditions.push(lte(candidateAnalysis.matchScore, maxScore));
    }

    // Get candidates with analysis
    const candidatesQuery = db
      .select({
        id: candidates.id,
        jobDescriptionId: candidates.jobDescriptionId,
        name: candidates.name,
        email: candidates.email,
        phone: candidates.phone,
        location: candidates.location,
        summary: candidates.summary,
        skills: candidates.skills,
        experience: candidates.experience,
        education: candidates.education,
        certifications: candidates.certifications,
        rawText: candidates.rawText,
        fileName: candidates.fileName,
        embedding: candidates.embedding,
        status: candidates.status,
        createdAt: candidates.createdAt,
        analysis: {
          id: candidateAnalysis.id,
          candidateId: candidateAnalysis.candidateId,
          jobDescriptionId: candidateAnalysis.jobDescriptionId,
          matchScore: candidateAnalysis.matchScore,
          skillsMatch: candidateAnalysis.skillsMatch,
          experienceMatch: candidateAnalysis.experienceMatch,
          educationMatch: candidateAnalysis.educationMatch,
          industryMatch: candidateAnalysis.industryMatch,
          strengths: candidateAnalysis.strengths,
          weaknesses: candidateAnalysis.weaknesses,
          recommendation: candidateAnalysis.recommendation,
          detailedAnalysis: candidateAnalysis.detailedAnalysis,
          isMatch: candidateAnalysis.isMatch,
          createdAt: candidateAnalysis.createdAt,
        }
      })
      .from(candidates)
      .leftJoin(candidateAnalysis, eq(candidates.id, candidateAnalysis.candidateId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(candidateAnalysis.matchScore), desc(candidates.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await candidatesQuery;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(candidates)
      .leftJoin(candidateAnalysis, eq(candidates.id, candidateAnalysis.candidateId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const [{ count: total }] = await countQuery;

    // Transform results to match expected format
    const candidatesWithAnalysis: CandidateWithAnalysis[] = results.map(row => ({
      id: row.id,
      jobDescriptionId: row.jobDescriptionId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      summary: row.summary,
      skills: row.skills,
      experience: row.experience,
      education: row.education,
      certifications: row.certifications,
      rawText: row.rawText,
      fileName: row.fileName,
      embedding: row.embedding,
      status: row.status,
      createdAt: row.createdAt,
      analysis: row.analysis?.id ? row.analysis : undefined,
    }));

    return {
      candidates: candidatesWithAnalysis,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getCandidateWithAnalysis(candidateId: number): Promise<CandidateWithAnalysis | undefined> {
    const result = await db
      .select({
        id: candidates.id,
        jobDescriptionId: candidates.jobDescriptionId,
        name: candidates.name,
        email: candidates.email,
        phone: candidates.phone,
        location: candidates.location,
        summary: candidates.summary,
        skills: candidates.skills,
        experience: candidates.experience,
        education: candidates.education,
        certifications: candidates.certifications,
        rawText: candidates.rawText,
        fileName: candidates.fileName,
        embedding: candidates.embedding,
        status: candidates.status,
        createdAt: candidates.createdAt,
        analysis: {
          id: candidateAnalysis.id,
          candidateId: candidateAnalysis.candidateId,
          jobDescriptionId: candidateAnalysis.jobDescriptionId,
          matchScore: candidateAnalysis.matchScore,
          skillsMatch: candidateAnalysis.skillsMatch,
          experienceMatch: candidateAnalysis.experienceMatch,
          educationMatch: candidateAnalysis.educationMatch,
          industryMatch: candidateAnalysis.industryMatch,
          strengths: candidateAnalysis.strengths,
          weaknesses: candidateAnalysis.weaknesses,
          recommendation: candidateAnalysis.recommendation,
          detailedAnalysis: candidateAnalysis.detailedAnalysis,
          isMatch: candidateAnalysis.isMatch,
          createdAt: candidateAnalysis.createdAt,
        }
      })
      .from(candidates)
      .leftJoin(candidateAnalysis, eq(candidates.id, candidateAnalysis.candidateId))
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      jobDescriptionId: row.jobDescriptionId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      summary: row.summary,
      skills: row.skills,
      experience: row.experience,
      education: row.education,
      certifications: row.certifications,
      rawText: row.rawText,
      fileName: row.fileName,
      embedding: row.embedding,
      status: row.status,
      createdAt: row.createdAt,
      analysis: row.analysis?.id ? row.analysis : undefined,
    };
  }

  async createCandidateAnalysis(insertAnalysis: InsertCandidateAnalysis): Promise<CandidateAnalysis> {
    const [analysis] = await db
      .insert(candidateAnalysis)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateCandidateStatus(candidateId: number, status: string): Promise<void> {
    await db
      .update(candidates)
      .set({ status: status as any })
      .where(eq(candidates.id, candidateId));
  }

  async updateCandidateNotes(candidateId: number, interviewNotes: string): Promise<void> {
    await db
      .update(candidates)
      .set({ interviewNotes })
      .where(eq(candidates.id, candidateId));
  }

  async createCvOptimization(insertOptimization: InsertCvOptimization): Promise<CvOptimization> {
    const [optimization] = await db.insert(cvOptimizations)
      .values(insertOptimization)
      .returning();
    return optimization;
  }

  async getCvOptimization(id: number): Promise<CvOptimization | undefined> {
    const [optimization] = await db.select()
      .from(cvOptimizations)
      .where(eq(cvOptimizations.id, id))
      .limit(1);
    return optimization;
  }

  async updateCvOptimization(id: number, updates: Partial<CvOptimization>): Promise<void> {
    await db.update(cvOptimizations)
      .set(updates)
      .where(eq(cvOptimizations.id, id));
  }

  // CV Library methods
  async getUserCvs(): Promise<UserCv[]> {
    return await db.select()
      .from(userCvs)
      .orderBy(desc(userCvs.updatedAt));
  }

  async getUserCv(id: number): Promise<UserCv | undefined> {
    const [cv] = await db.select()
      .from(userCvs)
      .where(eq(userCvs.id, id))
      .limit(1);
    return cv;
  }

  async createUserCv(insertCv: InsertUserCv): Promise<UserCv> {
    const [cv] = await db.insert(userCvs)
      .values(insertCv)
      .returning();
    return cv;
  }

  async updateUserCv(id: number, updates: Partial<UserCv>): Promise<void> {
    await db.update(userCvs)
      .set(updates)
      .where(eq(userCvs.id, id));
  }

  async deleteUserCv(id: number): Promise<void> {
    await db.delete(userCvs)
      .where(eq(userCvs.id, id));
  }

  async setActiveCv(id: number): Promise<void> {
    // First deactivate all CVs
    await db.update(userCvs)
      .set({ isActive: false });
    
    // Then activate the selected CV
    await db.update(userCvs)
      .set({ isActive: true })
      .where(eq(userCvs.id, id));
  }

  // CV Analysis methods
  async createCvAnalysis(insertAnalysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const [analysis] = await db.insert(cvAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getCvAnalysis(id: number): Promise<CvAnalysis | undefined> {
    const [analysis] = await db.select()
      .from(cvAnalyses)
      .where(eq(cvAnalyses.id, id))
      .limit(1);
    return analysis;
  }

  async updateCvAnalysis(id: number, updates: Partial<CvAnalysis>): Promise<void> {
    await db.update(cvAnalyses)
      .set(updates)
      .where(eq(cvAnalyses.id, id));
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    const totalCvs = await db.select({ count: sql`count(*)` }).from(userCvs);
    const totalAnalyses = await db.select({ count: sql`count(*)` }).from(cvAnalyses);
    const totalOptimizations = await db.select({ count: sql`count(*)` }).from(cvOptimizations);
    
    return {
      totalCvs: Number(totalCvs[0]?.count) || 0,
      newCvsThisWeek: 0, // Could implement date filtering if needed
      totalAnalyses: Number(totalAnalyses[0]?.count) || 0,
      totalOptimizations: Number(totalOptimizations[0]?.count) || 0,
      successRate: 95 // Static for demo
    };
  }

  async getRecentActivity(): Promise<any[]> {
    // Return empty for now - could implement with activity tracking
    return [];
  }
}

export const storage = new DatabaseStorage();