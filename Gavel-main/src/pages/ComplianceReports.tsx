import { Navigate } from "react-router-dom";

/**
 * @deprecated This surface now lives inside the Enterprise Console.
 *
 * Compliance reporting previously had its own implementation (a second compliance view duplicating components/dashboard/ComplianceDashboard.tsx) while the console rendered a
 * second one for the same job. The console tab is the single implementation now,
 * so this route is kept only as a redirect to preserve links and bookmarks.
 */
export default function ComplianceReports() {
  return <Navigate to="/dashboard?tab=compliance" replace />;
}
