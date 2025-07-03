import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import JobsPage from "@/pages/jobs";
import JobCandidatesPage from "@/pages/job-candidates";
import CVOptimizerPage from "@/pages/cv-optimizer";
import CVLibraryPage from "@/pages/cv-library";
import CVAnalyzerPage from "@/pages/cv-analyzer";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cv-library" component={CVLibraryPage} />
      <Route path="/cv-analyzer" component={CVAnalyzerPage} />
      <Route path="/cv-optimizer" component={CVOptimizerPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/jobs/:jobId/candidates" component={JobCandidatesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
