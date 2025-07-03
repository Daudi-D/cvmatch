import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Layout,
  Type,
  Palette,
  Star,
  Eye,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface CVAnalysis {
  id: number;
  analysisType: 'ats' | 'email';
  overallScore: number;
  structureAnalysis: {
    sections: Array<{
      name: string;
      present: boolean;
      quality: 'good' | 'fair' | 'poor';
      feedback: string;
    }>;
    length: { 
      score: number; 
      feedback: string; 
      wordCount: number; 
      recommendation: string;
    };
    organization: { 
      score: number; 
      feedback: string; 
    };
  };
  contentAnalysis: {
    keywords: {
      score: number;
      strength: 'weak' | 'moderate' | 'strong';
      suggestions: string[];
    };
    achievements: {
      score: number;
      quantified: number;
      total: number;
      suggestions: string[];
    };
    skills: {
      technical: string[];
      soft: string[];
      missing: string[];
      recommendations: string[];
    };
  };
  formattingAnalysis: {
    atsCompatibility: {
      score: number;
      issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        fix: string;
      }>;
    };
    readability: {
      score: number;
      fontIssues: string[];
      spacingIssues: string[];
      suggestions: string[];
    };
  };
  recommendations: Array<{
    category: 'structure' | 'content' | 'formatting' | 'strategy';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
  templateSuggestion: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function CVAnalyzerPage() {
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [analysisType, setAnalysisType] = useState<'ats' | 'email'>('ats');
  const [analysisId, setAnalysisId] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch user CVs for selection
  const { data: cvs = [] } = useQuery({
    queryKey: ['/api/cv-library'],
    staleTime: 0,
  });

  // Start analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { cvId: number; analysisType: 'ats' | 'email' }) => {
      return apiRequest('/api/cv-analysis', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setAnalysisId(data.analysisId);
      toast({
        title: "Analysis Started",
        description: "Your CV is being analyzed. This may take a few moments.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to start CV analysis",
        variant: "destructive",
      });
    },
  });

  // Get analysis results
  const { data: analysis, isLoading: isAnalyzing } = useQuery({
    queryKey: ['cv-analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) return null;
      return apiRequest(`/api/cv-analysis/${analysisId}`);
    },
    enabled: !!analysisId,
    refetchInterval: analysis?.status === 'processing' ? 2000 : false,
    staleTime: 0,
  });

  const handleStartAnalysis = () => {
    if (!selectedCvId) {
      toast({
        title: "No CV Selected",
        description: "Please select a CV to analyze.",
        variant: "destructive",
      });
      return;
    }

    analysisMutation.mutate({
      cvId: selectedCvId,
      analysisType,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (!analysisId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">CV Analyzer</h1>
            <p className="text-gray-600">Get detailed insights and recommendations for your CV</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Analyze Your CV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select CV to Analyze</label>
                <Select value={selectedCvId?.toString() || ""} onValueChange={(value) => setSelectedCvId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a CV from your library" />
                  </SelectTrigger>
                  <SelectContent>
                    {cvs.map((cv: any) => (
                      <SelectItem key={cv.id} value={cv.id.toString()}>
                        {cv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Analysis Type</label>
                <Select value={analysisType} onValueChange={(value: 'ats' | 'email') => setAnalysisType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ats">ATS-Optimized (Applicant Tracking System)</SelectItem>
                    <SelectItem value="email">Traditional/Email Application</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  {analysisType === 'ats' 
                    ? "Optimize for automated screening systems used by companies"
                    : "Optimize for traditional review by human recruiters"
                  }
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What You'll Get:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Comprehensive structure analysis</li>
                  <li>• Content quality assessment</li>
                  <li>• ATS compatibility check</li>
                  <li>• Formatting recommendations</li>
                  <li>• Professional template suggestions</li>
                  <li>• Actionable improvement tips</li>
                </ul>
              </div>

              <Button 
                onClick={handleStartAnalysis}
                disabled={analysisMutation.isPending || !selectedCvId}
                className="w-full"
                size="lg"
              >
                {analysisMutation.isPending ? "Starting Analysis..." : "Analyze CV"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (analysis?.status === 'processing' || isAnalyzing) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">CV Analysis in Progress</h1>
            <p className="text-gray-600">Analyzing your CV for structure, content, and formatting...</p>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Analyzing Your CV</h3>
              <p className="text-gray-600 mb-4">This typically takes 30-60 seconds</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Parsing document structure</div>
                <div>✓ Analyzing content quality</div>
                <div>• Checking ATS compatibility</div>
                <div>• Generating recommendations</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (analysis?.status === 'failed') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analysis Failed</h1>
            <p className="text-gray-600">There was an issue analyzing your CV</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The CV analysis failed. Please try again or contact support if the issue persists.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex gap-4">
                <Button onClick={() => setAnalysisId(null)} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CV Analysis Results</h1>
            <p className="text-gray-600">Comprehensive analysis for {analysisType.toUpperCase()} optimization</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setAnalysisId(null)}>
              Analyze Another CV
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Overall CV Score</h3>
                <p className="text-gray-600">Based on structure, content, and formatting</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}%
                </div>
                <Badge variant={getScoreBadgeVariant(analysis.overallScore)}>
                  {analysis.overallScore >= 80 ? 'Excellent' : 
                   analysis.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </div>
            <Progress value={analysis.overallScore} className="mt-4" />
          </CardContent>
        </Card>

        <Tabs defaultValue="structure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="formatting">Formatting</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    CV Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.structureAnalysis.sections.map((section: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {section.present ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{section.name}</span>
                        </div>
                        <Badge variant={section.quality === 'good' ? 'default' : section.quality === 'fair' ? 'secondary' : 'destructive'}>
                          {section.quality}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Length Score</span>
                      <span className={`font-bold ${getScoreColor(analysis.structureAnalysis.length.score)}`}>
                        {analysis.structureAnalysis.length.score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {analysis.structureAnalysis.length.wordCount} words
                    </p>
                    <p className="text-sm">{analysis.structureAnalysis.length.feedback}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Organization Score</span>
                      <span className={`font-bold ${getScoreColor(analysis.structureAnalysis.organization.score)}`}>
                        {analysis.structureAnalysis.organization.score}%
                      </span>
                    </div>
                    <p className="text-sm">{analysis.structureAnalysis.organization.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Keywords & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Keyword Strength</span>
                      <Badge variant={analysis.contentAnalysis.keywords.strength === 'strong' ? 'default' : 
                                   analysis.contentAnalysis.keywords.strength === 'moderate' ? 'secondary' : 'destructive'}>
                        {analysis.contentAnalysis.keywords.strength}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Technical Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.contentAnalysis.skills.technical.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Soft Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.contentAnalysis.skills.soft.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Achievement Score</span>
                        <span className={`font-bold ${getScoreColor(analysis.contentAnalysis.achievements.score)}`}>
                          {analysis.contentAnalysis.achievements.score}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {analysis.contentAnalysis.achievements.quantified} out of {analysis.contentAnalysis.achievements.total} achievements are quantified
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Suggestions:</h5>
                      <ul className="text-sm space-y-1">
                        {analysis.contentAnalysis.achievements.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    ATS Compatibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Compatibility Score</span>
                      <span className={`font-bold ${getScoreColor(analysis.formattingAnalysis.atsCompatibility.score)}`}>
                        {analysis.formattingAnalysis.atsCompatibility.score}%
                      </span>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Issues Found:</h5>
                      <div className="space-y-2">
                        {analysis.formattingAnalysis.atsCompatibility.issues.map((issue: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{issue.type}</span>
                              <Badge variant={issue.severity === 'high' ? 'destructive' : 
                                           issue.severity === 'medium' ? 'secondary' : 'outline'}>
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                            <p className="text-sm font-medium text-blue-600">{issue.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Readability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Readability Score</span>
                      <span className={`font-bold ${getScoreColor(analysis.formattingAnalysis.readability.score)}`}>
                        {analysis.formattingAnalysis.readability.score}%
                      </span>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Improvement Areas:</h5>
                      <ul className="text-sm space-y-1">
                        {analysis.formattingAnalysis.readability.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {analysis.recommendations.map((rec: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 
                                        rec.priority === 'medium' ? 'secondary' : 'outline'}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{rec.description}</p>
                        <p className="text-sm text-blue-600 font-medium">
                          Impact: {rec.impact}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Recommended Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recommended Template:</strong> {analysis.templateSuggestion}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Why This Template?</h5>
                    <p className="text-sm text-gray-700">
                      Based on your analysis results, this template is optimized for {analysisType.toUpperCase()} 
                      applications and addresses the specific areas where your CV can be improved.
                    </p>
                  </div>

                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}