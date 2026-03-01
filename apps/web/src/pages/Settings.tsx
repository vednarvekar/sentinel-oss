import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Github, LogOut, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockRepos } from "@/lib/mock-data";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-foreground mb-8">Settings</h1>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">sentinel-user</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Github className="h-3.5 w-3.5" />
              Account Connected
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Repositories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-border bg-card p-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">My Repositories</h2>
        <div className="space-y-2">
          {mockRepos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => navigate(`/repos/${repo.owner}/${repo.name}`)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-background p-3 hover:border-primary/30 transition-colors group"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{repo.full_name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  Analyzed {repo.updated_at}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-destructive/30 bg-card p-5"
      >
        <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-4">Danger Zone</h2>
        <Button variant="destructive" size="sm">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;
