import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Eye, UserCheck, UserX, Download } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CVUpload from "@/components/CVUpload";
import CandidateProfile from "@/components/CandidateProfile";

interface CandidateWithAnalysis {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "pending" | "shortlisted" | "rejected" | "hired";
  analysis?: {
    matchScore: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    industryMatch: number;
    isMatch: boolean;
  };
}

export default function JobCandidatesPage() {
  const [match, params] = useRoute("/jobs/:jobId/candidates");
  const jobId = params?.jobId ? parseInt(params.jobId) : null;
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get job details
  const { data: job } = useQuery({
    queryKey: [`/api/job-description/${jobId}`],
    enabled: !!jobId,
  });

  // Get candidates for this job
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['/api/candidates', { jobDescriptionId: jobId, search: searchTerm, status: statusFilter === 'all' ? '' : statusFilter }],
    enabled: !!jobId,
  });

  // Update candidate status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: number; status: string }) => {
      return apiRequest('PATCH', `/api/candidates/${candidateId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleStatusUpdate = (candidateId: number, status: string) => {
    updateStatusMutation.mutate({ candidateId, status });
  };

  if (!match || !jobId) {
    return <div>Job not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      shortlisted: { variant: "default", className: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive", className: "bg-red-100 text-red-800" },
      hired: { variant: "default", className: "bg-blue-100 text-blue-800" },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMatchBadge = (score: number, isMatch: boolean) => {
    if (isMatch) {
      return <Badge className="bg-green-100 text-green-800">Match</Badge>;
    } else {
      return <Badge variant="secondary">No Match</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{job?.title || 'Job Position'}</h1>
            <p className="text-gray-600">{job?.company} • {job?.location}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setShowUpload(true)} 
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload CVs
          </Button>
          <div className="flex gap-2 flex-1 max-w-2xl">
            <Input
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : candidatesData?.candidates?.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
            <p className="text-gray-600 mb-4">Upload CVs to start matching candidates for this position</p>
            <Button onClick={() => setShowUpload(true)}>Upload CVs</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidatesData?.candidates?.map((candidate: CandidateWithAnalysis) => (
            <Card key={candidate.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <p className="text-sm text-gray-600">{candidate.email} • {candidate.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {candidate.analysis && getMatchBadge(candidate.analysis.matchScore, candidate.analysis.isMatch)}
                    {getStatusBadge(candidate.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {candidate.analysis && (
                  <div className="mb-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div>Overall: {candidate.analysis.matchScore}%</div>
                      <div>Skills: {candidate.analysis.skillsMatch}%</div>
                      <div>Experience: {candidate.analysis.experienceMatch}%</div>
                      <div>Education: {candidate.analysis.educationMatch}%</div>
                      <div>Industry: {candidate.analysis.industryMatch}%</div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCandidate(candidate.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  
                  {candidate.status !== "shortlisted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(candidate.id, "shortlisted")}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      disabled={updateStatusMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4" />
                      Shortlist
                    </Button>
                  )}
                  
                  {candidate.status !== "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(candidate.id, "rejected")}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      disabled={updateStatusMutation.isPending}
                    >
                      <UserX className="h-4 w-4" />
                      Reject
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/candidates/${candidate.id}/pdf`, '_blank')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upload CVs for {job?.title}</h2>
              <Button variant="ghost" onClick={() => setShowUpload(false)}>×</Button>
            </div>
            <CVUpload 
              jobDescriptionId={jobId} 
              onComplete={() => {
                setShowUpload(false);
                queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
              }} 
            />
          </div>
        </div>
      )}

      {selectedCandidate && (
        <CandidateProfile
          candidateId={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}