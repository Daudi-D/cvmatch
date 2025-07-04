# TalentMatch ATS - Replit Development Guide

## Overview

TalentMatch ATS is a full-stack application that streamlines the recruitment process by using AI to analyze and match candidates against job descriptions. The system allows recruiters to upload job descriptions and candidate resumes, then uses OpenAI's APIs to extract structured information and calculate match scores using semantic embeddings.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration for monorepo structure

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **AI Integration**: OpenAI API for text analysis and embeddings
- **File Processing**: Multer for uploads, with support for PDF, DOCX, and TXT parsing

### Project Structure
```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
└── migrations/       # Database migrations
```

## Key Components

### Data Models
- **Job Descriptions**: Stores job posting information with AI-extracted structured data
- **Candidates**: Stores candidate profiles with parsed resume information
- **Candidate Analysis**: Stores AI-generated match analysis and scores
- **Users**: Basic user management (foundation for future authentication)

### AI Services
- **Text Extraction**: Parses resumes and job descriptions from various file formats
- **Information Extraction**: Uses OpenAI to extract structured data (skills, experience, requirements)
- **Semantic Matching**: Generates embeddings and calculates cosine similarity for match scoring
- **Analysis Generation**: Provides detailed candidate analysis with strengths, weaknesses, and recommendations

### File Processing Pipeline
1. File upload with validation (PDF, DOCX, TXT)
2. Text extraction using appropriate parsers
3. AI-powered information extraction
4. Embedding generation for semantic search
5. Database storage with structured data

## Data Flow

1. **Job Description Upload**: Recruiter uploads JD → File parsing → AI extraction → Embedding generation → Database storage
2. **Candidate Processing**: Bulk CV upload → Individual file processing → AI analysis against active JD → Match scoring → Results storage
3. **Candidate Review**: Dashboard displays ranked candidates → Detailed profile view with AI analysis → Decision tracking

## External Dependencies

- **OpenAI API**: Text analysis, embeddings, and candidate matching
- **Neon Database**: Serverless PostgreSQL hosting
- **File Processing Libraries**:
  - `pdf-parse` for PDF extraction
  - `mammoth` for DOCX processing
- **UI Components**: Radix UI primitives via shadcn/ui

## Deployment Strategy

- **Development**: Vite dev server for frontend, tsx for backend hot reload
- **Production**: Vite build for static frontend, esbuild for backend bundling
- **Database**: Drizzle migrations with push command for schema updates
- **Environment**: Configured for Replit with custom Vite plugins and error overlays

## Changelog

- July 03, 2025. Initial setup
- July 03, 2025. Completed production-ready ATS system with:
  - Job description upload and AI parsing
  - Bulk CV upload with AI analysis
  - Semantic similarity matching using OpenAI embeddings
  - Real-time candidate dashboard with filtering and search
  - Detailed candidate profiles with AI recommendations
  - PostgreSQL database with complete schema
  - Error handling and file validation
- July 03, 2025. Major improvements based on user feedback:
  - Made AI scoring significantly less generous (power scaling applied)
  - Enhanced AI analysis to cross-check job responsibilities against candidate experience
  - Added PDF export functionality with Core Maestro Management branding
  - Removed contact details from PDF exports for recruiter privacy control
  - Fixed UI bugs in candidate profile data loading
  - Fixed Select component validation error for status filtering
  - Resolved PDF generation issues with correct jsPDF import
- July 03, 2025. Post-migration fixes and enhancements:
  - Fixed AI match score summary width constraints to prevent table stretching
  - Enhanced work experience display to convert OpenAI paragraph descriptions to bullet points
  - Fixed PDF export toggle functionality to properly exclude AI analysis when unchecked
  - Improved user experience with better text formatting and layout management
- July 03, 2025. Added CV Optimizer feature:
  - Built comprehensive CV-to-job-description alignment tool with AI analysis
  - Implemented keyword matching, skills alignment, and experience relevance scoring
  - Added ATS vs Email optimization modes for different application methods
  - Created one-click improvement suggestions with AI-powered text enhancement
  - Built interactive comparison interface with downloadable optimized CVs
  - Added new database table for CV optimization tracking and results storage
- July 03, 2025. Migration from Replit Agent to Replit Environment:
  - Successfully migrated TalentMatch ATS from Replit Agent to standard Replit environment
  - Fixed PostgreSQL database connection and schema setup using drizzle-kit push
  - Resolved API request function signature mismatch in queryClient.ts
  - Fixed CV optimization frontend polling issue with proper state management
  - All features now working correctly including job matching, candidate analysis, and CV optimization

## User Preferences

Preferred communication style: Simple, everyday language.