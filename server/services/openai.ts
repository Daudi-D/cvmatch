import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function analyzeCandidateMatch(
  candidateText: string,
  jobDescriptionText: string,
  candidateName: string
): Promise<{
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  detailedAnalysis: string;
}> {
  try {
    const prompt = `
You are an expert HR analyst. Analyze how well this candidate matches the job description.

CANDIDATE PROFILE:
${candidateText}

JOB DESCRIPTION:
${jobDescriptionText}

Analyze the match and provide:
1. A match score from 0-100 based on skills, experience, qualifications, and cultural fit
2. Top 3-5 strengths that make this candidate suitable
3. Top 3-5 weaknesses or missing qualifications
4. A recommendation (hire, consider with training, reject)
5. A detailed 2-3 sentence analysis explaining the overall assessment

Consider:
- Required vs preferred qualifications
- Years of experience
- Industry experience
- Skills match (technical and soft skills)
- Education and certifications
- Career progression
- Cultural fit indicators

Respond with JSON in this exact format:
{
  "matchScore": number,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendation": "string",
  "detailedAnalysis": "string"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert HR analyst specializing in candidate assessment and job matching.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      matchScore: Math.max(0, Math.min(100, result.matchScore)),
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || "",
      detailedAnalysis: result.detailedAnalysis || "",
    };
  } catch (error) {
    throw new Error(`Failed to analyze candidate match: ${error.message}`);
  }
}

export async function extractCandidateInfo(cvText: string): Promise<{
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: any[];
  education: any[];
  certifications: string[];
}> {
  try {
    const prompt = `
Extract structured information from this CV text:

${cvText}

Extract and return JSON with this exact structure:
{
  "name": "Full name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "city, country",
  "summary": "professional summary/objective",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Location",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "description": "Job description and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "Institution name",
      "location": "Location",
      "graduationDate": "Month Year",
      "description": "Additional details if any"
    }
  ],
  "certifications": ["cert1", "cert2", ...]
}

If any field is not found, use empty string for strings, empty array for arrays.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert CV parser. Extract structured information accurately from CV text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      name: result.name || "",
      email: result.email || "",
      phone: result.phone || "",
      location: result.location || "",
      summary: result.summary || "",
      skills: result.skills || [],
      experience: result.experience || [],
      education: result.education || [],
      certifications: result.certifications || [],
    };
  } catch (error) {
    throw new Error(`Failed to extract candidate information: ${error.message}`);
  }
}

export async function extractJobDescriptionInfo(jdText: string): Promise<{
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
}> {
  try {
    const prompt = `
Extract structured information from this job description:

${jdText}

Extract and return JSON with this exact structure:
{
  "title": "Job title",
  "company": "Company name",
  "location": "Location",
  "salaryRange": "Salary range if mentioned",
  "description": "Job description and responsibilities",
  "requirements": "Requirements and qualifications"
}

If any field is not found, use empty string.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert job description parser. Extract structured information accurately.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      title: result.title || "",
      company: result.company || "",
      location: result.location || "",
      salaryRange: result.salaryRange || "",
      description: result.description || "",
      requirements: result.requirements || "",
    };
  } catch (error) {
    throw new Error(`Failed to extract job description information: ${error.message}`);
  }
}
