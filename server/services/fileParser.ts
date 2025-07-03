import * as fs from 'fs';
import mammoth from 'mammoth';

// Dynamic import for pdf-parse to avoid initialization issues
async function getPdfParse(): Promise<any> {
  const pdfParse = await import('pdf-parse');
  return pdfParse.default;
}

export async function parseFile(filePath: string, fileName: string): Promise<string> {
  const extension = fileName.toLowerCase().split('.').pop();
  
  try {
    switch (extension) {
      case 'pdf':
        return await parsePDF(filePath);
      case 'docx':
        return await parseDOCX(filePath);
      case 'txt':
        return await parseTXT(filePath);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parsePDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = await getPdfParse();
  const data = await pdf(dataBuffer);
  return data.text;
}

async function parseDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function parseTXT(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf8');
}

export function validateFileType(fileName: string): boolean {
  const allowedExtensions = ['pdf', 'docx', 'txt'];
  const extension = fileName.toLowerCase().split('.').pop();
  return allowedExtensions.includes(extension || '');
}

export function validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}
