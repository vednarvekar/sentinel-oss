import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, GitFork, Eye, AlertCircle, ArrowLeft, FileCode, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockRepos, mockIssues, mockOverview } from "@/lib/mock-data";
import CodeGraph from "@/components/CodeGraph";
import AuthModal from "@/components/AuthModal";
import { IssueCardSkeleton } from "@/components/SkeletonCards";

const RepoDetail = () => {
  const { owner, name } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "issues">("overview");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const isAuthenticated = false;

  const repo = mockRepos.find((r) => r.owner === owner && r.name === name) || mockRepos[0];
  const formatNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toString());

  const handleIssuesTab = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab("issues");
    setIsLoadingIssues(true);
    setTimeout(() => setIsLoadingIssues(false), 1500);
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", onClick: () => setActiveTab("overview") },
    { id: "issues" as const, label: "Issues", onClick: handleIssuesTab, locked: !isAuthenticated },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <FileCode className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground font-mono">{repo.full_name}</h1>
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning" /> {formatNum(repo.stars)}</span>
        <span className="flex items-center gap-1.5"><GitFork className="h-4 w-4" /> {formatNum(repo.forks)}</span>
        <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {formatNum(repo.watchers)}</span>
        <span className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {repo.open_issues} issues</span>
        <Badge variant="secondary" className="text-xs font-mono">{repo.language}</Badge>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium font-mono transition-colors ${
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-indicator" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">AI Summary</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{mockOverview.summary}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-card rounded-xl p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">Tech Stack</h2>
                <div className="flex flex-wrap gap-2">
                  {mockOverview.tech_stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs font-mono">{tech}</Badge>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">Repo Complexity</h2>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-primary font-mono">{mockOverview.complexity_score}</span>
                  <span className="text-sm text-muted-foreground mb-1 font-mono">/ 100</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mockOverview.complexity_score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{mockOverview.total_files.toLocaleString()} files</span>
                  <span>{mockOverview.total_contributors.toLocaleString()} contributors</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">Code Visualization</h2>
              <div className="h-[400px] rounded-lg border border-border/50 bg-background/50 overflow-hidden">
                <CodeGraph />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "issues" && (
          <motion.div
            key="issues"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {isLoadingIssues ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <IssueCardSkeleton />
                  </motion.div>
                ))}
              </>
            ) : (
              mockIssues.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/issues/${issue.id}/analysis`)}
                  className="group glass-card rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer hover-glow"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors font-mono">
                          {issue.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] border font-mono ${
                            issue.difficulty === "easy" ? "difficulty-easy" :
                            issue.difficulty === "medium" ? "difficulty-medium" : "difficulty-hard"
                          }`}
                        >
                          {issue.difficulty}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{issue.ai_summary}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>#{issue.number}</span>
                        <span>by {issue.author}</span>
                        <span>{issue.comments} comments</span>
                        <div className="flex gap-1.5">
                          {issue.labels.map((l) => (
                            <span
                              key={l.name}
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium font-mono"
                              style={{
                                backgroundColor: `#${l.color}15`,
                                color: `#${l.color}`,
                                border: `1px solid #${l.color}30`,
                              }}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default RepoDetail;
