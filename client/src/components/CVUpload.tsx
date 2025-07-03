import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Files, File, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProcessingFile {
  name: string;
  status: 'processing' | 'complete' | 'error';
  matchScore?: number;
  error?: string;
}

interface CVUploadProps {
  jobDescriptionId?: number;
  onComplete?: () => void;
}

export default function CVUpload({ jobDescriptionId, onComplete }: CVUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      if (jobDescriptionId) {
        formData.append('jobDescriptionId', jobDescriptionId.toString());
      }
      
      // Set processing status for all files
      const fileStatuses: ProcessingFile[] = Array.from(files).map(file => ({
        name: file.name,
        status: 'processing' as const,
      }));
      setProcessingFiles(fileStatuses);

      const response = await apiRequest('/api/candidates/upload', {
        method: 'POST',
        body: formData,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      
      // Update processing status with results
      const updatedFiles: ProcessingFile[] = [];
      
      data.results?.forEach((result: any) => {
        updatedFiles.push({
          name: result.candidate.fileName,
          status: 'complete',
          matchScore: result.analysis.matchScore,
        });
      });

      data.errors?.forEach((error: any) => {
        updatedFiles.push({
          name: error.fileName,
          status: 'error',
          error: error.error,
        });
      });

      setProcessingFiles(updatedFiles);

      toast({
        title: "Upload Complete",
        description: `${data.results?.length || 0} CVs processed successfully${data.errors?.length > 0 ? `, ${data.errors.length} failed` : ''}`,
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

      // Clear processing status after 5 seconds
      setTimeout(() => setProcessingFiles([]), 5000);
    },
    onError: (error) => {
      setProcessingFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: error.message,
      })));
      
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = Array.from(files).filter(file => !allowedTypes.includes(file.type));
    const largeFiles = Array.from(files).filter(file => file.size > 10 * 1024 * 1024);
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Types",
        description: "Please upload PDF or DOCX files only",
        variant: "destructive",
      });
      return;
    }

    if (largeFiles.length > 0) {
      toast({
        title: "Files Too Large",
        description: "All files must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="mb-8" id="cv-upload-section">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Upload CVs</h2>
              <p className="text-gray-600 mt-1">Upload candidate CVs for AI-powered analysis and ranking</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => document.getElementById('cv-file-input-single')?.click()}
                disabled={uploadMutation.isPending}
              >
                <File className="mr-2 h-4 w-4" />
                Single Upload
              </Button>
              <Button 
                className="bg-primary text-white hover:bg-blue-700"
                onClick={() => document.getElementById('cv-file-input-bulk')?.click()}
                disabled={uploadMutation.isPending}
              >
                <Files className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('cv-file-input-bulk')?.click()}
            >
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {uploadMutation.isPending ? "Processing CVs..." : "Drop candidate CVs here or click to browse"}
              </p>
              <p className="text-sm text-gray-500 mb-4">Supports PDF, DOCX files • Multiple selection allowed</p>
              <Button className="bg-primary text-white">Choose Files</Button>
              
              <input
                id="cv-file-input-single"
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={uploadMutation.isPending}
              />
              <input
                id="cv-file-input-bulk"
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={uploadMutation.isPending}
              />
            </div>

            {/* Processing Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Processing Status</h3>
              
              {processingFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <File className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                  <p>No files being processed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center">
                        <File className="text-red-500 mr-3 h-5 w-5" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {file.status === 'processing' && "Parsing content..."}
                            {file.status === 'complete' && "AI Analysis Complete"}
                            {file.status === 'error' && `Error: ${file.error}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {file.status === 'processing' && (
                          <div className="w-6 h-6">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        {file.status === 'complete' && (
                          <>
                            <Badge className="bg-success text-white mr-2">
                              {file.matchScore}% Match
                            </Badge>
                            <CheckCircle className="text-success h-5 w-5" />
                          </>
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="text-error h-5 w-5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
