import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Download, Mail, CheckCircle, XCircle, Bot, GraduationCap, Briefcase, Tag } from "lucide-react";
import type { CandidateWithAnalysis } from "@shared/schema";

interface CandidateProfileProps {
  candidateId: number;
  onClose: () => void;
}

export default function CandidateProfile({ candidateId, onClose }: CandidateProfileProps) {
  const { data: candidate, isLoading } = useQuery<CandidateWithAnalysis>({
    queryKey: ["/api/candidates", candidateId],
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
                  {getInitials(candidate.name)}
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
                        {candidate.analysis.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {candidate.analysis.weaknesses && candidate.analysis.weaknesses.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Areas for Development:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {candidate.analysis.weaknesses.map((weakness, index) => (
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
                  {candidate.skills?.map((skill, index) => (
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
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">{job.description}</p>
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
                    {candidate.certifications.map((cert, index) => (
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

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download CV
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button variant="destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button className="bg-success hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Shortlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
