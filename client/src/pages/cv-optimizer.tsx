import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Target, CheckCircle, AlertTriangle, Clock, Bot, Eye, Edit, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CVOptimization {
  id: number;
  originalCvText: string;
  jobDescriptionText: string;
  applicationMethod: 'ats' | 'email';
  optimizedCvText?: string;
  improvementSuggestions?: Array<{
    section: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keywordMatches?: {
    found: string[];
    missing: string[];
    importance: Record<string, string>;
  };
  skillsAlignment?: {
    matched: string[];
    missing: string[];
    suggestions: string[];
  };
  experienceAlignment?: {
    relevantExperience: Array<{
      section: string;
      relevance: number;
      improvements: string[];
    }>;
    missingExperience: string[];
    suggestions: string[];
  };
  overallScore?: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function CVOptimizerPage() {
  const [cvText, setCvText] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [applicationMethod, setApplicationMethod] = useState<'ats' | 'email'>('ats');
  const [optimizationId, setOptimizationId] = useState<number | null>(null);
  const [editingOptimizedCV, setEditingOptimizedCV] = useState(false);
  const [optimizedCVDraft, setOptimizedCVDraft] = useState("");
  const [cvInputMode, setCvInputMode] = useState<'text' | 'file'>('text');
  const [jdInputMode, setJdInputMode] = useState<'text' | 'file'>('text');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File parsing function
  const parseFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse file. Please try a different format.');
    }
  };

  // Handle CV file upload
  const handleCvFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await parseFile(file);
      setCvText(text);
      toast({
        title: "CV Uploaded",
        description: "Your CV has been successfully parsed and loaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload CV",
        variant: "destructive",
      });
    }
  };

  // Handle JD file upload
  const handleJdFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await parseFile(file);
      setJobDescriptionText(text);
      toast({
        title: "Job Description Uploaded",
        description: "The job description has been successfully parsed and loaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload job description",
        variant: "destructive",
      });
    }
  };

  // Submit CV for optimization
  const optimizeMutation = useMutation({
    mutationFn: async (data: { cvText: string; jobDescriptionText: string; applicationMethod: string }) => {
      return apiRequest('/api/cv-optimization', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      setOptimizationId(data.optimizationId);
      toast({
        title: "CV Analysis Started",
        description: "Your CV is being analyzed and optimized. This may take a few moments.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start CV optimization",
        variant: "destructive",
      });
    }
  });

  // Get optimization results
  const { data: optimization, isLoading: isLoadingOptimization } = useQuery({
    queryKey: ['cv-optimization', optimizationId],
    queryFn: async () => {
      if (!optimizationId) return null;
      return apiRequest(`/api/cv-optimization/${optimizationId}`);
    },
    enabled: !!optimizationId,
    refetchInterval: (data) => data?.status === 'processing' ? 2000 : false,
  });

  // Improve specific section
  const improveMutation = useMutation({
    mutationFn: async (data: { originalText: string; suggestion: string }) => {
      return apiRequest(`/api/cv-optimization/${optimizationId}/improve-section`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data, variables) => {
      // Replace the original text with improved text in the optimized CV
      if (optimization?.optimizedCvText) {
        const updatedCV = optimization.optimizedCvText.replace(variables.originalText, data.improvedText);
        setOptimizedCVDraft(updatedCV);
        setEditingOptimizedCV(true);
      }
      toast({
        title: "Section Improved",
        description: "The CV section has been updated with AI improvements.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to improve section",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!cvText.trim() || !jobDescriptionText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both your CV and the job description.",
        variant: "destructive",
      });
      return;
    }

    optimizeMutation.mutate({
      cvText,
      jobDescriptionText,
      applicationMethod
    });
  };

  const handleDownloadCV = () => {
    const cvContent = editingOptimizedCV ? optimizedCVDraft : optimization?.optimizedCvText;
    if (!cvContent) return;

    const blob = new Blob([cvContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized_cv_${applicationMethod}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CV Optimizer</h1>
        <p className="text-gray-600 mt-2">
          Align your CV with job descriptions to become the best candidate for the role
        </p>
      </div>

      {!optimizationId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your CV
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={cvInputMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCvInputMode('text')}
                  >
                    Text
                  </Button>
                  <Button
                    variant={cvInputMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCvInputMode('file')}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cvInputMode === 'text' ? (
                <Textarea
                  placeholder="Paste your current CV content here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleCvFileUpload}
                      className="hidden"
                      id="cv-file-upload"
                    />
                    <label htmlFor="cv-file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload your CV</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT files (max 10MB)</p>
                    </label>
                  </div>
                  {cvText && (
                    <div className="bg-gray-50 p-4 rounded-lg max-h-[200px] overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-2">Uploaded CV Preview:</p>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">{cvText.substring(0, 500)}...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Job Description
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={jdInputMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setJdInputMode('text')}
                  >
                    Text
                  </Button>
                  <Button
                    variant={jdInputMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setJdInputMode('file')}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jdInputMode === 'text' ? (
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleJdFileUpload}
                      className="hidden"
                      id="jd-file-upload"
                    />
                    <label htmlFor="jd-file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload job description</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT files (max 10MB)</p>
                    </label>
                  </div>
                  {jobDescriptionText && (
                    <div className="bg-gray-50 p-4 rounded-lg max-h-[200px] overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-2">Uploaded Job Description Preview:</p>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">{jobDescriptionText.substring(0, 500)}...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Application Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={applicationMethod} onValueChange={(value: 'ats' | 'email') => setApplicationMethod(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select application method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ats">ATS (Applicant Tracking System)</SelectItem>
                    <SelectItem value="email">Email/Human Review</SelectItem>
                  </SelectContent>
                </Select>
                
                <Alert>
                  <AlertDescription>
                    {applicationMethod === 'ats' 
                      ? "ATS optimization focuses on keyword matching, standard formatting, and machine readability."
                      : "Email optimization focuses on compelling narrative, visual appeal, and human engagement."
                    }
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleSubmit} 
                  disabled={optimizeMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {optimizeMutation.isPending ? "Analyzing..." : "Optimize My CV"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(optimization?.status || 'processing')}
                  <div>
                    <h3 className="font-semibold">CV Optimization Status</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {optimization?.status === 'processing' && "Analyzing your CV..."}
                      {optimization?.status === 'completed' && "Analysis complete!"}
                      {optimization?.status === 'failed' && "Analysis failed"}
                    </p>
                  </div>
                </div>
                {optimization?.overallScore && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{optimization.overallScore}%</div>
                    <div className="text-sm text-gray-600">Alignment Score</div>
                  </div>
                )}
              </div>
              
              {optimization?.status === 'processing' && (
                <Progress value={50} className="mt-4" />
              )}
            </CardContent>
          </Card>

          {optimization?.status === 'completed' && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="optimized">Optimized CV</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Keywords Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Found ({optimization.keywordMatches?.found.length || 0})</h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.keywordMatches?.found.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Missing ({optimization.keywordMatches?.missing.length || 0})</h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.keywordMatches?.missing.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Matched ({optimization.skillsAlignment?.matched.length || 0})</h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.skillsAlignment?.matched.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Missing ({optimization.skillsAlignment?.missing.length || 0})</h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.skillsAlignment?.missing.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {optimization.experienceAlignment?.relevantExperience.map((exp, index) => (
                          <div key={index} className="border-l-4 border-primary pl-3">
                            <div className="font-medium text-sm">{exp.section}</div>
                            <div className="text-xs text-gray-600">{exp.relevance}% relevant</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                {optimization.improvementSuggestions?.map((suggestion, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <h4 className="font-medium">{suggestion.section}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.issue}</p>
                          <p className="text-sm">{suggestion.suggestion}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => improveMutation.mutate({
                            originalText: suggestion.section,
                            suggestion: suggestion.suggestion
                          })}
                          disabled={improveMutation.isPending}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          Apply Fix
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Original CV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">{optimization.originalCvText}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Optimized CV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">{optimization.optimizedCvText}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="optimized" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Your Optimized CV</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOptimizedCV(!editingOptimizedCV);
                            if (!editingOptimizedCV) {
                              setOptimizedCVDraft(optimization.optimizedCvText || '');
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {editingOptimizedCV ? 'View Mode' : 'Edit Mode'}
                        </Button>
                        <Button onClick={handleDownloadCV}>
                          <Download className="h-4 w-4 mr-1" />
                          Download CV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingOptimizedCV ? (
                      <Textarea
                        value={optimizedCVDraft}
                        onChange={(e) => setOptimizedCVDraft(e.target.value)}
                        className="min-h-[500px] font-mono text-sm"
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg min-h-[500px] overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">{optimization.optimizedCvText}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {optimization?.status === 'failed' && (
            <Card>
              <CardContent className="p-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The CV optimization failed. Please try again or contact support if the issue persists.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => setOptimizationId(null)} 
                  className="mt-4"
                  variant="outline"
                >
                  Start Over
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}