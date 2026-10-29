import { useEffect } from "react";
import { logApiUsage } from "../lib/firestore";

const ENDPOINTS = [
  { path: "/v1/underwrite", method: "POST" },
  { path: "/v1/verify/kyc", method: "POST" },
  { path: "/v1/rules", method: "GET" },
  { path: "/v1/projects", method: "GET" },
  { path: "/v1/score", method: "POST" },
];

const STATUS_CODES = [200, 200, 200, 200, 200, 200, 201, 200, 400, 401, 500];

/**
 * Synthetic API traffic for demo orgs only.
 *
 * This writes rows into the `api_usage` collection, which feeds the usage and
 * billing screens. It must therefore never run against a real organisation,
 * earlier it ran for every org and quietly polluted production analytics with
 * invented calls, random latencies and random 5xx responses.
 *
 * Guard rails:
 * - dev builds only, and
 * - the org must be a demo/sandbox org.
 */
export function useTrafficSimulator(orgId: string | null, enabled: boolean = true) {
  const isDemoOrg = !!orgId && /^(demo|sandbox)[_-]/i.test(orgId);
  const allowed = import.meta.env.DEV && isDemoOrg && enabled;

  useEffect(() => {
    if (!allowed || !orgId) return;

    const interval = setInterval(async () => {
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      const status = STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
      const durationMs = Math.floor(Math.random() * 800) + 10;

      try {
        await logApiUsage(orgId, {
          path: endpoint.path,
          method: endpoint.method,
          status,
          durationMs,
        });
      } catch (err) {
        console.error("Traffic simulator failed to log:", err);
      }
    }, 8000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [allowed, orgId]);
}
