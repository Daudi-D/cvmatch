import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, UserCheck, Archive } from "lucide-react";
import type { CandidateWithAnalysis } from "@shared/schema";

interface CandidatesDashboardProps {
  onViewCandidate: (candidateId: number) => void;
}

export default function CandidatesDashboard({ onViewCandidate }: CandidatesDashboardProps) {
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["/api/candidates", { search, scoreFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      
      if (search) params.append("search", search);
      
      if (scoreFilter !== "all") {
        switch (scoreFilter) {
          case "90-100":
            params.append("minScore", "90");
            break;
          case "80-89":
            params.append("minScore", "80");
            params.append("maxScore", "89");
            break;
          case "70-79":
            params.append("minScore", "70");
            params.append("maxScore", "79");
            break;
          case "below-70":
            params.append("maxScore", "69");
            break;
        }
      }

      const response = await fetch(`/api/candidates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-success";
    if (score >= 80) return "bg-warning";
    if (score >= 70) return "bg-yellow-500";
    return "bg-error";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-yellow-100 text-yellow-800";
    if (score >= 70) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mb-8" id="candidates-dashboard">
      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Candidates</h2>
                <p className="text-gray-600 mt-1">
                  {candidatesData?.total || 0} candidates for active position
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search candidates..."
                    className="pl-10 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="90-100">90-100%</SelectItem>
                    <SelectItem value="80-89">80-89%</SelectItem>
                    <SelectItem value="70-79">70-79%</SelectItem>
                    <SelectItem value="below-70">Below 70%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading candidates...</p>
            </div>
          ) : candidatesData?.candidates?.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No candidates found. Upload some CVs to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidatesData?.candidates?.map((candidate: CandidateWithAnalysis) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                              {getInitials(candidate.name)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                            <div className="text-sm text-gray-500">{candidate.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 max-w-24">
                            <div 
                              className={`h-2 rounded-full ${getScoreColor(candidate.analysis?.matchScore || 0)}`}
                              style={{ width: `${candidate.analysis?.matchScore || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {candidate.analysis?.matchScore || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {candidate.analysis?.recommendation || "No analysis available"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills?.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills && candidate.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                          <div>
                            <p className="font-medium">{candidate.experience[0].title}</p>
                            <p className="text-gray-500">
                              {candidate.experience[0].company} • 
                              {candidate.experience.length > 1 ? ` ${candidate.experience.length} roles` : ''}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">No experience data</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(candidate.createdAt!)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewCandidate(candidate.id)}
                            className="text-primary hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-success hover:text-green-700">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {candidatesData?.candidates?.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!candidatesData.hasMore}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(page * 10, candidatesData.total)}
                    </span>{" "}
                    of <span className="font-medium">{candidatesData.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!candidatesData.hasMore}
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
