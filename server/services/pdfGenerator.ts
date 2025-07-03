import { jsPDF } from 'jspdf';
import type { CandidateWithAnalysis } from '@shared/schema';

export function generateCandidatePDF(
  candidate: CandidateWithAnalysis, 
  options?: { 
    includeAnalysis?: boolean; 
    includeContact?: boolean; 
    includeNotes?: boolean 
  }
): Buffer {
  const doc = new jsPDF();
  
  // Core Maestro Management branding
  doc.setFontSize(20);
  doc.setTextColor(0, 123, 255); // Blue color
  doc.text('Core Maestro Management', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128); // Gray color
  doc.text('Confidential Candidate Profile', 20, 28);
  
  // Add line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, 190, 35);
  
  let yPosition = 50;
  
  // Candidate Name
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(candidate.name || 'Unknown Candidate', 20, yPosition);
  yPosition += 10;

  // Contact Information (conditional)
  if (options?.includeContact) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (candidate.email) {
      doc.text(`Email: ${candidate.email}`, 20, yPosition);
      yPosition += 5;
    }
    if (candidate.phone) {
      doc.text(`Phone: ${candidate.phone}`, 20, yPosition);
      yPosition += 5;
    }
    if (candidate.location) {
      doc.text(`Location: ${candidate.location}`, 20, yPosition);
      yPosition += 5;
    }
  }
  
  yPosition += 5;
  
  // AI Match Score (conditional)
  if (options?.includeAnalysis && candidate.analysis?.matchScore) {
    doc.setFontSize(12);
    doc.setTextColor(0, 123, 255);
    doc.text(`AI Match Score: ${candidate.analysis.matchScore}%`, 20, yPosition);
    yPosition += 10;
  }
  
  // Professional Summary
  if (candidate.summary) {
    yPosition += 5;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Professional Summary', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(candidate.summary, 170);
    doc.text(summaryLines, 20, yPosition);
    yPosition += summaryLines.length * 5 + 10;
  }
  
  // Skills
  if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Skills', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const skillsText = candidate.skills.join(', ');
    const skillsLines = doc.splitTextToSize(skillsText, 170);
    doc.text(skillsLines, 20, yPosition);
    yPosition += skillsLines.length * 5 + 10;
  }
  
  // Work Experience
  if (candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Work Experience', 20, yPosition);
    yPosition += 8;
    
    candidate.experience.forEach((exp: any) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.title || 'Position'} at ${exp.company || 'Company'}`, 20, yPosition);
      yPosition += 6;
      
      if (exp.duration) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(exp.duration, 20, yPosition);
        yPosition += 5;
      }
      
      if (exp.description) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const descLines = doc.splitTextToSize(exp.description, 170);
        doc.text(descLines, 20, yPosition);
        yPosition += descLines.length * 5;
      }
      yPosition += 8;
    });
  }
  
  // Education
  if (candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Education', 20, yPosition);
    yPosition += 8;
    
    candidate.education.forEach((edu: any) => {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}`, 20, yPosition);
      yPosition += 6;
      
      if (edu.year) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(edu.year.toString(), 20, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    });
  }
  
  // AI Analysis
  if (candidate.analysis) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('AI Analysis', 20, yPosition);
    yPosition += 8;
    
    if (candidate.analysis.strengths && candidate.analysis.strengths.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 150, 0);
      doc.text('Strengths:', 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      candidate.analysis.strengths.forEach((strength: string) => {
        doc.text(`• ${strength}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }
    
    if (candidate.analysis.weaknesses && candidate.analysis.weaknesses.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(200, 0, 0);
      doc.text('Areas for Development:', 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      candidate.analysis.weaknesses.forEach((weakness: string) => {
        doc.text(`• ${weakness}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }
    
    if (candidate.analysis.recommendation) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Recommendation:', 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      const recLines = doc.splitTextToSize(candidate.analysis.recommendation, 170);
      doc.text(recLines, 20, yPosition);
      yPosition += recLines.length * 5 + 5;
    }
    
    if (candidate.analysis.detailedAnalysis) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Detailed Analysis:', 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      const analysisLines = doc.splitTextToSize(candidate.analysis.detailedAnalysis, 170);
      doc.text(analysisLines, 20, yPosition);
    }
  }
  
  // Footer with branding
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Core Maestro Management - Confidential', 20, 285);
    doc.text(`Page ${i} of ${pageCount}`, 170, 285);
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}