import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileCode, AlertCircle, Gauge, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockAnalysis, mockIssues } from "@/lib/mock-data";
import { AnalysisSkeleton } from "@/components/SkeletonCards";

const IssueAnalysis = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const analysis = mockAnalysis;
  const issue = mockIssues.find((i) => i.id === issueId) || mockIssues[0];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.proposed_fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-4 w-16 skeleton-shimmer rounded-md" />
        </div>
        <div className="mb-6 space-y-2">
          <div className="h-4 w-32 skeleton-shimmer rounded-md" />
          <div className="h-6 w-80 skeleton-shimmer rounded-md" />
        </div>
        <div className="glass-card rounded-xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary">Sentinel is analyzing the codebase...</span>
          </div>
          <div className="space-y-2 font-mono text-xs text-muted-foreground">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="text-accent">→</span> Reading issue context
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <span className="text-primary">→</span> Mapping file dependencies
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
              <span className="text-accent">→</span> Generating root cause analysis
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-terminal-blink" />
            </motion.div>
          </div>
        </div>
        <AnalysisSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 font-mono">
              <AlertCircle className="h-3.5 w-3.5 text-accent" />
              #{analysis.issue_number} · Open
            </div>
            <h1 className="text-xl font-semibold text-foreground font-mono">{analysis.issue_title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-xs border font-mono ${
                analysis.difficulty === "easy" ? "difficulty-easy" :
                analysis.difficulty === "medium" ? "difficulty-medium" : "difficulty-hard"
              }`}
            >
              {analysis.difficulty}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
              <Gauge className="h-4 w-4" />
              Risk: {analysis.risk_score}%
            </div>
          </div>
        </div>
      </div>

      {/* Stacked layout */}
      <div className="space-y-5">
        {/* Original Issue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5 accent-bar pl-7"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 font-mono">Original Issue</h2>
          <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {analysis.issue_body}
          </div>
        </motion.div>

        {/* Root Cause */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5 accent-bar pl-7"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">Root Cause Analysis</h2>
          <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {analysis.root_cause}
          </div>
        </motion.div>

        {/* File Map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">File Map</h2>
          <div className="space-y-2">
            {analysis.file_map.map((file, i) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-3 rounded-lg glass-subtle p-3"
              >
                <FileCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground truncate">{file.path}</span>
                    <span className="shrink-0 text-xs text-primary font-semibold font-mono">{file.relevance}%</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{file.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Proposed Fix */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Proposed Fix</h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg glass-subtle p-4 text-xs font-mono text-foreground/85 leading-relaxed">
            <code>{analysis.proposed_fix}</code>
          </pre>
        </motion.div>
      </div>
    </div>
  );
};

export default IssueAnalysis;
