import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/jobs">
                <h1 className="text-xl font-bold text-primary cursor-pointer">TalentMatch ATS</h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/jobs">
                  <span className={`${
                    location === "/jobs" || location.startsWith("/jobs/")
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  } px-3 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer`}>
                    <Briefcase className="h-4 w-4" />
                    All Positions
                  </span>
                </Link>
                <Link href="/dashboard">
                  <span className={`${
                    location === "/dashboard" || location === "/"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  } px-3 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer`}>
                    <Plus className="h-4 w-4" />
                    New Hiring Process
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
