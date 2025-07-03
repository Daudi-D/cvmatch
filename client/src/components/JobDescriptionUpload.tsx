import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function JobDescriptionUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const { data: activeJD, isLoading } = useQuery({
    queryKey: ["/api/job-description/active"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/job-description/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-description/active"] });
      toast({
        title: "Success",
        description: "Job description uploaded and processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOCX, or TXT files only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
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
    <div className="mb-8" id="job-description-section">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Active Job Description</h2>
              <p className="text-gray-600 mt-1">Upload and manage the job description for candidate matching</p>
            </div>
            <Button 
              className="bg-primary text-white hover:bg-blue-700"
              onClick={() => document.getElementById('jd-file-input')?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New JD
            </Button>
          </div>

          {/* Current JD Display */}
          {activeJD && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{activeJD.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {activeJD.company} • {activeJD.location} • {activeJD.salaryRange}
                  </p>
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">Key Requirements:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {activeJD.requirements?.split(',').slice(0, 5).map((req: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {req.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Badge className="bg-success text-white">Active</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Upload New JD Form */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('jd-file-input')?.click()}
          >
            <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {uploadMutation.isPending ? "Processing..." : "Drop your job description here or click to browse"}
            </p>
            <p className="text-sm text-gray-500">Supports PDF, DOCX, TXT files up to 10MB</p>
            <input
              id="jd-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploadMutation.isPending}
            />
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center text-gray-500">
                Loading job description...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
