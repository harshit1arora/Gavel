import { Navigate } from "react-router-dom";

/**
 * @deprecated This surface now lives inside the Enterprise Console.
 *
 * Collections previously had its own implementation (749 lines duplicating components/dashboard/CollectionsPipeline.tsx) while the console rendered a
 * second one for the same job. The console tab is the single implementation now,
 * so this route is kept only as a redirect to preserve links and bookmarks.
 */
export default function CollectionsDashboard() {
  return <Navigate to="/dashboard?tab=collections" replace />;
}
