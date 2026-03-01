import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import RepoDetail from "@/pages/RepoDetail";
import Issues from "@/pages/Issues";
import IssueAnalysis from "@/pages/IssueAnalysis";
import Settings from "@/pages/Settings";
import AuthSuccess from "@/pages/AuthSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/repos/:owner/:name" element={<RepoDetail />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/issues/:issueId/analysis" element={<IssueAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
