import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Users, Plus } from "lucide-react";

interface JobDescription {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  isActive: boolean;
  createdAt: string;
}

export default function JobsPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/job-descriptions'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Positions</h1>
          <p className="text-gray-600 mt-2">Manage all your hiring positions and view candidate matches</p>
        </div>
        <Link href="/dashboard">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Hiring Process
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No job positions yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first hiring process</p>
            <Link href="/dashboard">
              <Button>Start New Hiring Process</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: JobDescription) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {job.company} • {job.location}
                    </CardDescription>
                  </div>
                  {job.isActive && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {job.description.substring(0, 150)}...
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    View Candidates
                  </div>
                </div>

                <Link href={`/jobs/${job.id}/candidates`}>
                  <Button variant="outline" className="w-full">
                    View Candidates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}