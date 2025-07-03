import { useState } from "react";
import Navigation from "@/components/Navigation";
import JobDescriptionUpload from "@/components/JobDescriptionUpload";
import CVUpload from "@/components/CVUpload";
import CandidatesDashboard from "@/components/CandidatesDashboard";
import CandidateProfile from "@/components/CandidateProfile";

export default function Dashboard() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDescriptionUpload />
        <CVUpload />
        <CandidatesDashboard onViewCandidate={setSelectedCandidateId} />
      </div>

      {selectedCandidateId && (
        <CandidateProfile
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}
    </div>
  );
}
