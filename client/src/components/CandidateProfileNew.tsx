import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Download, Mail, CheckCircle, XCircle, Bot, GraduationCap, Briefcase, Tag, FileText, Save, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CandidateWithAnalysis } from "@shared/schema";

interface CandidateProfileProps {
  candidateId: number;
  onClose: () => void;
}

interface PDFOptions {
  includeAnalysis: boolean;
  includeContact: boolean;
  includeNotes: boolean;
}

export default function CandidateProfile({ candidateId, onClose }: CandidateProfileProps) {
  const [interviewNotes, setInterviewNotes] = useState("");
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    includeAnalysis: false,
    includeContact: false,
    includeNotes: true
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: candidate, isLoading } = useQuery<CandidateWithAnalysis>({
    queryKey: ["/api/candidates", candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) throw new Error('Failed to fetch candidate');
      return response.json();
    }
  });

  // Update interview notes when candidate data changes
  useEffect(() => {
    if (candidate?.interviewNotes) {
      setInterviewNotes(candidate.interviewNotes);
    }
  }, [candidate?.interviewNotes]);

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/candidates/${candidateId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ interviewNotes: notes }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId] });
      toast({ title: "Interview notes saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save interview notes", variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/candidates/${candidateId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!candidate) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <p className="text-gray-500">Candidate not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'UN';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const handleDownloadPDF = () => {
    if (showPdfOptions) {
      const params = new URLSearchParams();
      if (pdfOptions.includeAnalysis) params.append('includeAnalysis', 'true');
      if (pdfOptions.includeContact) params.append('includeContact', 'true');
      if (pdfOptions.includeNotes) params.append('includeNotes', 'true');
      
      const link = document.createElement('a');
      link.href = `/api/candidates/${candidateId}/pdf?${params.toString()}`;
      link.download = `${candidate?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'candidate'}_profile.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowPdfOptions(false);
    } else {
      setShowPdfOptions(true);
    }
  };

  const formatWorkExperience = (description: string) => {
    if (!description) return null;
    
    return description.split('\n').map((line: string, lineIndex: number) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <div key={lineIndex} className="flex items-start mb-1">
            <span className="text-primary mr-2 mt-1">•</span>
            <span>{trimmedLine.substring(1).trim()}</span>
          </div>
        );
      }
      return trimmedLine ? <p key={lineIndex} className="mb-1">{trimmedLine}</p> : null;
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-2xl font-semibold text-gray-900">Candidate Profile</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Candidate Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-6">
                  {getInitials(candidate.name || '')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{candidate.name}</h3>
                  <p className="text-blue-100">{candidate.email}</p>
                  <p className="text-blue-100">{candidate.phone}</p>
                  <p className="text-blue-100">{candidate.location}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className={`text-3xl font-bold ${getScoreColor(candidate.analysis?.matchScore || 0)}`}>
                    {candidate.analysis?.matchScore || 0}%
                  </div>
                  <div className="text-sm text-blue-100">AI Match Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          {candidate.analysis && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Bot className="text-primary mr-2 h-5 w-5" />
                  AI Analysis & Recommendations
                </h4>
                <div className="space-y-4">
                  {candidate.analysis.strengths && candidate.analysis.strengths.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Strengths for this Role:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {candidate.analysis.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {candidate.analysis.weaknesses && candidate.analysis.weaknesses.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Areas for Development:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {candidate.analysis.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {candidate.analysis.detailedAnalysis && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Recommendation:</strong> {candidate.analysis.detailedAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Summary */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Professional Summary</h4>
                <p className="text-sm text-gray-700">{candidate.summary || "No summary available"}</p>
              </CardContent>
            </Card>

            {/* Key Skills */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Key Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {skill}
                    </Badge>
                  )) || <p className="text-gray-500 text-sm">No skills data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Experience */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Work Experience
              </h4>
              {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                <div className="space-y-6">
                  {candidate.experience.map((job: any, index: number) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{job.title}</h5>
                          <p className="text-primary font-medium">{job.company}</p>
                          <p className="text-sm text-gray-500">
                            {job.startDate} - {job.endDate} • {job.location}
                          </p>
                        </div>
                        {index === 0 && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Most Recent
                          </Badge>
                        )}
                      </div>
                      {job.description && (
                        <div className="mt-3 text-sm text-gray-700">
                          {formatWorkExperience(job.description)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No work experience data available</p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="mr-2 h-5 w-5" />
                Education & Certifications
              </h4>
              <div className="space-y-4">
                {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 ? (
                  candidate.education.map((edu: any, index: number) => (
                    <div key={index} className="flex items-center">
                      <GraduationCap className="text-primary mr-3 h-5 w-5" />
                      <div>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-gray-600">
                          {edu.institution} • {edu.graduationDate}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No education data available</p>
                )}
                
                {candidate.certifications && candidate.certifications.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Certifications:</h5>
                    {candidate.certifications.map((cert: string, index: number) => (
                      <div key={index} className="flex items-center mb-2">
                        <Tag className="text-primary mr-3 h-4 w-4" />
                        <p className="text-sm">{cert}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interview Notes */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Interview Notes
              </h4>
              <div className="space-y-3">
                <Textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Add interview notes, feedback, or observations about this candidate..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => updateNotesMutation.mutate(interviewNotes)}
                    disabled={updateNotesMutation.isPending}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF Export Options */}
          {showPdfOptions && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  PDF Export Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeAnalysis"
                      checked={pdfOptions.includeAnalysis}
                      onCheckedChange={(checked) => setPdfOptions(prev => ({ ...prev, includeAnalysis: checked as boolean }))}
                    />
                    <label htmlFor="includeAnalysis" className="text-sm font-medium">
                      Include AI Analysis & Recommendations
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeContact"
                      checked={pdfOptions.includeContact}
                      onCheckedChange={(checked) => setPdfOptions(prev => ({ ...prev, includeContact: checked as boolean }))}
                    />
                    <label htmlFor="includeContact" className="text-sm font-medium">
                      Include Contact Information
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeNotes"
                      checked={pdfOptions.includeNotes}
                      onCheckedChange={(checked) => setPdfOptions(prev => ({ ...prev, includeNotes: checked as boolean }))}
                    />
                    <label htmlFor="includeNotes" className="text-sm font-medium">
                      Include Interview Notes
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowPdfOptions(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={showPdfOptions}
              >
                <Download className="mr-2 h-4 w-4" />
                {showPdfOptions ? "Configure PDF" : "Download PDF"}
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="destructive"
                onClick={() => updateStatusMutation.mutate('rejected')}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => updateStatusMutation.mutate('shortlisted')}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Shortlist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}