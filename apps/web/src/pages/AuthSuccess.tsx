import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Check } from "lucide-react";

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border border-success/20">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Authentication Successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting you back...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
