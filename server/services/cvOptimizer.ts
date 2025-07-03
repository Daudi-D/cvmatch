import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CVAnalysis {
  improvementSuggestions: Array<{
    section: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    position?: { start: number; end: number }; // Character positions for highlighting
  }>;
  keywordMatches: {
    found: string[];
    missing: string[];
    importance: Record<string, 'critical' | 'important' | 'nice-to-have'>;
  };
  skillsAlignment: {
    matched: string[];
    missing: string[];
    suggestions: string[];
  };
  experienceAlignment: {
    relevantExperience: Array<{
      section: string;
      relevance: number; // 0-100
      improvements: string[];
    }>;
    missingExperience: string[];
    suggestions: string[];
  };
  overallScore: number; // 0-100
}

export async function analyzeCVAlignment(
  cvText: string,
  jobDescriptionText: string,
  applicationMethod: 'ats' | 'email'
): Promise<CVAnalysis> {
  const atsGuidance = applicationMethod === 'ats' 
    ? "Focus on ATS optimization: use standard headings, include exact keyword matches, avoid tables/graphics, use standard fonts."
    : "Focus on human readability: prioritize compelling narrative, visual appeal, and relationship building.";

  const prompt = `Analyze this CV against the job description and provide detailed alignment analysis.

APPLICATION METHOD: ${applicationMethod.toUpperCase()}
${atsGuidance}

JOB DESCRIPTION:
${jobDescriptionText}

CV CONTENT:
${cvText}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "improvementSuggestions": [
    {
      "section": "section name",
      "issue": "what's wrong",
      "suggestion": "how to fix it",
      "priority": "high|medium|low"
    }
  ],
  "keywordMatches": {
    "found": ["keyword1", "keyword2"],
    "missing": ["missing_keyword1", "missing_keyword2"],
    "importance": {
      "keyword": "critical|important|nice-to-have"
    }
  },
  "skillsAlignment": {
    "matched": ["skill1", "skill2"],
    "missing": ["missing_skill1"],
    "suggestions": ["how to highlight missing skills"]
  },
  "experienceAlignment": {
    "relevantExperience": [
      {
        "section": "job title or experience",
        "relevance": 85,
        "improvements": ["specific improvement suggestions"]
      }
    ],
    "missingExperience": ["missing experience areas"],
    "suggestions": ["how to address missing experience"]
  },
  "overallScore": 75
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional CV optimization expert. Provide detailed, actionable feedback to help candidates align their CV with job requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as CVAnalysis;
  } catch (error) {
    console.error("CV analysis error:", error);
    throw new Error("Failed to analyze CV alignment");
  }
}

export async function optimizeCV(
  cvText: string,
  jobDescriptionText: string,
  applicationMethod: 'ats' | 'email',
  analysis: CVAnalysis
): Promise<string> {
  const atsGuidance = applicationMethod === 'ats' 
    ? "Optimize for ATS: use standard section headings (Summary, Experience, Skills, Education), include exact keyword matches, avoid special formatting, use bullet points."
    : "Optimize for human review: create compelling narrative, use action verbs, quantify achievements, ensure visual appeal.";

  const prompt = `Based on the analysis, rewrite this CV to better align with the job description.

APPLICATION METHOD: ${applicationMethod.toUpperCase()}
${atsGuidance}

JOB DESCRIPTION:
${jobDescriptionText}

ORIGINAL CV:
${cvText}

ANALYSIS INSIGHTS:
- Missing Keywords: ${analysis.keywordMatches.missing.join(', ')}
- Missing Skills: ${analysis.skillsAlignment.missing.join(', ')}
- Key Improvements Needed: ${analysis.improvementSuggestions.filter(s => s.priority === 'high').map(s => s.suggestion).join('; ')}

Instructions:
1. Maintain all factual information - do not fabricate experience or skills
2. Reframe existing experience to highlight relevant aspects
3. Incorporate missing keywords naturally where applicable to existing experience
4. Restructure content to emphasize job-relevant achievements
5. Use strong action verbs and quantify results where possible
6. Ensure ${applicationMethod === 'ats' ? 'ATS-friendly formatting' : 'human-readable presentation'}

Return the optimized CV text:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional CV writer. Rewrite CVs to maximize job alignment while maintaining truthfulness and professionalism."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content || cvText;
  } catch (error) {
    console.error("CV optimization error:", error);
    throw new Error("Failed to optimize CV");
  }
}

export async function generateSpecificImprovement(
  originalText: string,
  suggestion: string,
  jobDescriptionText: string,
  applicationMethod: 'ats' | 'email'
): Promise<string> {
  const prompt = `Improve this specific section of the CV based on the suggestion provided.

APPLICATION METHOD: ${applicationMethod.toUpperCase()}
JOB DESCRIPTION CONTEXT: ${jobDescriptionText}

ORIGINAL TEXT:
${originalText}

IMPROVEMENT SUGGESTION:
${suggestion}

Rewrite only this section to implement the suggestion while keeping it truthful and professional. Return just the improved text:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional CV editor. Make targeted improvements to CV sections while maintaining accuracy and professionalism."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || originalText;
  } catch (error) {
    console.error("Specific improvement error:", error);
    throw new Error("Failed to generate specific improvement");
  }
}