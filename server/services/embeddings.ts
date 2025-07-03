import { generateEmbedding } from './openai.js';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function similarityToScore(similarity: number): number {
  // Convert cosine similarity (-1 to 1) to percentage (0 to 100)
  return Math.round(((similarity + 1) / 2) * 100);
}

export async function calculateMatchScore(
  candidateEmbedding: string,
  jobDescriptionEmbedding: string
): Promise<number> {
  try {
    const candidateVector = JSON.parse(candidateEmbedding);
    const jobVector = JSON.parse(jobDescriptionEmbedding);
    
    const similarity = cosineSimilarity(candidateVector, jobVector);
    return similarityToScore(similarity);
  } catch (error) {
    throw new Error(`Failed to calculate match score: ${error.message}`);
  }
}

export async function generateCandidateEmbedding(candidate: {
  name: string;
  summary: string;
  skills: string[];
  experience: any[];
  education: any[];
}): Promise<string> {
  const textForEmbedding = [
    candidate.name,
    candidate.summary,
    candidate.skills.join(' '),
    candidate.experience.map(exp => `${exp.title} at ${exp.company}: ${exp.description}`).join(' '),
    candidate.education.map(edu => `${edu.degree} from ${edu.institution}`).join(' ')
  ].join(' ');

  const embedding = await generateEmbedding(textForEmbedding);
  return JSON.stringify(embedding);
}

export async function generateJobDescriptionEmbedding(jd: {
  title: string;
  description: string;
  requirements: string;
}): Promise<string> {
  const textForEmbedding = [
    jd.title,
    jd.description,
    jd.requirements
  ].join(' ');

  const embedding = await generateEmbedding(textForEmbedding);
  return JSON.stringify(embedding);
}
