import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  salaryRange: text("salary_range"),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  fileName: text("file_name"),
  isActive: boolean("is_active").default(false),
  embedding: text("embedding"), // JSON string of embedding vector
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  jobDescriptionId: integer("job_description_id").references(() => jobDescriptions.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  summary: text("summary"),
  skills: text("skills").array(),
  experience: jsonb("experience"), // Array of work experience objects
  education: jsonb("education"), // Array of education objects
  certifications: text("certifications").array(),
  rawText: text("raw_text").notNull(),
  fileName: text("file_name").notNull(),
  embedding: text("embedding"), // JSON string of embedding vector
  status: text("status").default("pending").$type<"pending" | "shortlisted" | "rejected" | "hired">(),
  interviewNotes: text("interview_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidateAnalysis = pgTable("candidate_analysis", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  jobDescriptionId: integer("job_description_id").notNull(),
  matchScore: real("match_score").notNull(), // 0-100
  skillsMatch: real("skills_match").notNull().default(0), // 0-100
  experienceMatch: real("experience_match").notNull().default(0), // 0-100
  educationMatch: real("education_match").notNull().default(0), // 0-100
  industryMatch: real("industry_match").notNull().default(0), // 0-100
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  recommendation: text("recommendation"),
  detailedAnalysis: text("detailed_analysis"),
  isMatch: boolean("is_match").notNull().default(false), // true/false instead of "consider with training"
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidateAnalysisRelations = relations(candidateAnalysis, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateAnalysis.candidateId],
    references: [candidates.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [candidateAnalysis.jobDescriptionId],
    references: [jobDescriptions.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  analyses: many(candidateAnalysis),
}));

export const jobDescriptionsRelations = relations(jobDescriptions, ({ many }) => ({
  analyses: many(candidateAnalysis),
}));

// User uploaded CVs library
export const userCvs = pgTable("user_cvs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  cvText: text("cv_text").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CV Analysis for standalone analysis (not optimization)
export const cvAnalyses = pgTable("cv_analyses", {
  id: serial("id").primaryKey(),
  userCvId: integer("user_cv_id").references(() => userCvs.id),
  analysisType: text("analysis_type").notNull().$type<"ats" | "email">(),
  overallScore: real("overall_score"),
  structureAnalysis: jsonb("structure_analysis"),
  contentAnalysis: jsonb("content_analysis"),
  formattingAnalysis: jsonb("formatting_analysis"),
  recommendations: jsonb("recommendations"),
  templateSuggestion: text("template_suggestion"),
  status: text("status").notNull().default("processing").$type<"processing" | "completed" | "failed">(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cvOptimizations = pgTable("cv_optimizations", {
  id: serial("id").primaryKey(),
  userCvId: integer("user_cv_id").references(() => userCvs.id),
  originalCvText: text("original_cv_text"), // Keep for backward compatibility
  jobDescriptionText: text("job_description_text").notNull(),
  applicationMethod: text("application_method").notNull().$type<"ats" | "email">(),
  optimizedCvText: text("optimized_cv_text"),
  improvementSuggestions: jsonb("improvement_suggestions"), // Array of suggestions with positions
  keywordMatches: jsonb("keyword_matches"), // Keywords analysis
  skillsAlignment: jsonb("skills_alignment"), // Skills matching analysis
  experienceAlignment: jsonb("experience_alignment"), // Experience matching analysis
  overallScore: real("overall_score"), // 0-100 alignment score
  processingSteps: jsonb("processing_steps"), // Track real-time progress
  status: text("status").notNull().default("processing").$type<"processing" | "completed" | "failed">(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateAnalysisSchema = createInsertSchema(candidateAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertUserCvSchema = createInsertSchema(userCvs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCvAnalysisSchema = createInsertSchema(cvAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertCvOptimizationSchema = createInsertSchema(cvOptimizations).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidateAnalysis = z.infer<typeof insertCandidateAnalysisSchema>;
export type CandidateAnalysis = typeof candidateAnalysis.$inferSelect;

export type InsertUserCv = z.infer<typeof insertUserCvSchema>;
export type UserCv = typeof userCvs.$inferSelect;

export type InsertCvAnalysis = z.infer<typeof insertCvAnalysisSchema>;
export type CvAnalysis = typeof cvAnalyses.$inferSelect;

export type InsertCvOptimization = z.infer<typeof insertCvOptimizationSchema>;
export type CvOptimization = typeof cvOptimizations.$inferSelect;

export type CandidateWithAnalysis = Candidate & {
  analysis?: CandidateAnalysis;
};
