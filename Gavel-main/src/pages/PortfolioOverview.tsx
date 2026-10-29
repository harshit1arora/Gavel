import { Navigate } from "react-router-dom";

/**
 * @deprecated This surface now lives inside the Enterprise Console.
 *
 * Portfolio overview previously had its own implementation (a second portfolio view duplicating components/dashboard/LoanPortfolio.tsx) while the console rendered a
 * second one for the same job. The console tab is the single implementation now,
 * so this route is kept only as a redirect to preserve links and bookmarks.
 */
export default function PortfolioOverview() {
  return <Navigate to="/dashboard?tab=portfolio" replace />;
}
