import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidateAnalysis = z.infer<typeof insertCandidateAnalysisSchema>;
export type CandidateAnalysis = typeof candidateAnalysis.$inferSelect;

export type CandidateWithAnalysis = Candidate & {
  analysis?: CandidateAnalysis;
};
