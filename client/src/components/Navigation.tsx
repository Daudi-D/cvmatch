import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">TalentMatch ATS</h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <a href="#dashboard" className="text-primary border-b-2 border-primary px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#job-description" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Job Description
                </a>
                <a href="#upload-cvs" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Upload CVs
                </a>
                <a href="#analytics" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Analytics
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Button className="bg-primary text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Hiring Process
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
