import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Upload, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Calendar,
  Search
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface UserCV {
  id: number;
  name: string;
  fileName: string;
  cvText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CVLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCV, setSelectedCV] = useState<UserCV | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user CVs
  const { data: cvs = [], isLoading } = useQuery({
    queryKey: ['/api/cv-library'],
    staleTime: 0,
  });

  // Upload CV mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { name: string; file?: File; text?: string }) => {
      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('name', data.name);
        
        return apiRequest('/api/cv-library/upload', {
          method: 'POST',
          body: formData,
          headers: {}, // Remove Content-Type to let browser set boundary
        });
      } else {
        return apiRequest('/api/cv-library', {
          method: 'POST',
          body: JSON.stringify({
            name: data.name,
            cvText: data.text,
            fileName: `${data.name}.txt`,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cv-library'] });
      setIsUploadDialogOpen(false);
      toast({
        title: "CV Uploaded",
        description: "Your CV has been successfully added to your library.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CV",
        variant: "destructive",
      });
    },
  });

  // Delete CV mutation
  const deleteMutation = useMutation({
    mutationFn: async (cvId: number) => {
      return apiRequest(`/api/cv-library/${cvId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cv-library'] });
      toast({
        title: "CV Deleted",
        description: "CV has been removed from your library.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete CV",
        variant: "destructive",
      });
    },
  });

  // Set active CV mutation
  const setActiveMutation = useMutation({
    mutationFn: async (cvId: number) => {
      return apiRequest(`/api/cv-library/${cvId}/set-active`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cv-library'] });
      toast({
        title: "Active CV Updated",
        description: "This CV is now your active default.",
      });
    },
  });

  const filteredCVs = cvs.filter((cv: UserCV) =>
    cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cv.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UploadDialog = () => {
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name) {
        toast({
          title: "Missing Information",
          description: "Please provide a name for your CV.",
          variant: "destructive",
        });
        return;
      }

      if (uploadMode === 'file' && !file) {
        toast({
          title: "Missing File",
          description: "Please select a file to upload.",
          variant: "destructive",
        });
        return;
      }

      if (uploadMode === 'text' && !text.trim()) {
        toast({
          title: "Missing Content",
          description: "Please provide CV content.",
          variant: "destructive",
        });
        return;
      }

      uploadMutation.mutate({
        name,
        file: uploadMode === 'file' ? file! : undefined,
        text: uploadMode === 'text' ? text : undefined,
      });
    };

    return (
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New CV</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">CV Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe - Software Engineer"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('file')}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('text')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Paste Text
                </Button>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CV File (PDF, DOCX, TXT)
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CV Content
                  </label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your CV content here..."
                    className="min-h-[200px]"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Add CV"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const ViewDialog = () => (
    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{selectedCV?.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
            {selectedCV?.cvText}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CV Library</h1>
            <p className="text-gray-600">Manage your CV collection and optimization history</p>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New CV
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search CVs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredCVs.length} CV{filteredCVs.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* CV Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCVs.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No CVs found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "No CVs match your search criteria." : "Start building your CV library by adding your first CV."}
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First CV
                </Button>
              </Card>
            </div>
          ) : (
            filteredCVs.map((cv: UserCV) => (
              <Card key={cv.id} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {cv.name}
                        {cv.isActive && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{cv.fileName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCV(cv);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View CV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveMutation.mutate(cv.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Set as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(cv.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs">
                      {Math.round(cv.cvText.length / 1000)}k chars
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <UploadDialog />
        <ViewDialog />
      </div>
    </DashboardLayout>
  );
}