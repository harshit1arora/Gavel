import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (!user) {
    // Send prospects to the product tour, not to an unrelated sandbox page.
    // A login wall that explains what is behind it converts; one that teleports
    // the visitor does not.
    return <Navigate to="/platform" replace />;
  }

  return <>{children}</>;
}
