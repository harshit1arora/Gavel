import { db } from "./firebase";
import { 
  collection, doc, setDoc, addDoc, updateDoc, 
  onSnapshot, query, where, orderBy, getDocs, serverTimestamp, runTransaction
} from "firebase/firestore";
import { apiWithAuth, parseResponse } from "./api-client";

export interface LoanApplication {
  id?: string;
  applicantName: string;
  annualIncome: number;
  loanAmount: number;
  creditDebt: number;
  status: "Pending" | "Approved" | "Manual Review" | "Rejected";
  aiScore: number | null;
  aiReasoning: string | null;
  createdAt: any; 
  orgId: string; 
}

export interface ApiKey {
  id?: string;
  key: string;
  name: string;
  env: "sandbox" | "live";
  createdAt: any;
  lastUsedAt: any | null;
  orgId: string;
  isActive: boolean;
}

export interface UsageLog {
  id?: string;
  path: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: any;
  orgId: string;
}

export interface TeamMember {
  id?: string;
  email: string;
  role: "admin" | "developer" | "viewer";
  joinedAt: any;
  orgId: string;
}

export interface DataCluster {
  id?: string;
  name: string;
  region: string;
  provider: "AWS" | "GCP" | "Azure";
  status: "active" | "maintenance" | "scaling";
  load: number;
  orgId: string;
}

export interface PolicyRule {
  id: number;
  field: string;
  op: string;
  value: string;
  description: string;
}

export interface RiskPolicy {
  id?: string;
  orgId: string;
  "auto-approve": PolicyRule[];
  "auto-reject": PolicyRule[];
  "manual-review": PolicyRule[];
  updatedAt: any;
}

export interface SentinelScoreHistory {
  date: any;
  score: number;
  category: 'Green' | 'Amber' | 'Red';
  reason: string;
}

export interface MonitoredBorrower {
  id?: string;
  orgId: string;
  applicantName: string;
  loanAmount: number;
  disbursementDate: any;
  currentScore: number;
  riskCategory: 'Green' | 'Amber' | 'Red';
  history: SentinelScoreHistory[];
  signals: {
    gstTurnover: number;
    upiInflows: number;
    bureauScore: number;
    lastGstFilingDate: any;
  };
  sector: string;
  location: string;
}

// ------ APPLICATIONS ------
export const submitApplication = async (data: Omit<LoanApplication, "id" | "status" | "aiScore" | "aiReasoning" | "createdAt">) => {
  const colRef = collection(db, "applications");
  const docRef = await addDoc(colRef, {
    ...data,
    status: "Pending",
    aiScore: null,
    aiReasoning: null,
    createdAt: serverTimestamp(),
    orgId: data.orgId || "public-demo-bank",
  });
  return docRef.id;
};

export const updateApplicationWithAi = async (id: string, score: number, status: string, reasoning: string) => {
  const docRef = doc(db, "applications", id);
  await updateDoc(docRef, { aiScore: score, status, aiReasoning: reasoning });
};

export const updateApplicationStatus = async (id: string, status: string) => {
  const docRef = doc(db, "applications", id);
  await updateDoc(docRef, { status });
};

export const subscribeToApplications = (orgId: string, callback: (apps: LoanApplication[]) => void) => {
  const q = query(
    collection(db, "applications"),
    where("orgId", "==", orgId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication)));
  }, (err) => {
    console.error("Applications snapshot error:", err);
    // If indices missing, we might fail. Fallback to normal query.
  });
};

// ------ API KEYS ------
export const createApiKey = async (orgId: string, name: string, env: "sandbox" | "live" = "live"): Promise<ApiKey> => {
  const res = await apiWithAuth("/v1/apikeys", {
    method: "POST",
    body: JSON.stringify({ name, env })
  });
  return await parseResponse(res);
};

export const getApiKeys = (orgId: string, callback: (keys: ApiKey[]) => void) => {
  const q = query(collection(db, "api_keys"), where("orgId", "==", orgId), where("isActive", "==", true));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiKey)));
  });
};

export const revokeApiKey = async (id: string) => {
  const res = await apiWithAuth(`/v1/apikeys/${id}`, { method: "DELETE" });
  await parseResponse(res);
};



// ------ RISK POLICIES ------
export const getRiskPolicy = async (orgId: string): Promise<RiskPolicy | null> => {
  const q = query(collection(db, "policies"), where("orgId", "==", orgId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as RiskPolicy;
};

export const subscribeToRiskPolicy = (orgId: string, callback: (policy: RiskPolicy | null) => void) => {
  const q = query(collection(db, "policies"), where("orgId", "==", orgId));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) callback(null);
    else callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as RiskPolicy);
  });
};

export const saveRiskPolicy = async (orgId: string, policyData: Omit<RiskPolicy, "id" | "orgId" | "updatedAt">) => {
  const res = await apiWithAuth("/v1/policies", {
    method: "POST",
    body: JSON.stringify(policyData)
  });
  await parseResponse(res);
};

// ------ USAGE LOGS ------
export const logApiUsage = async (orgId: string, data: Omit<UsageLog, "id" | "timestamp" | "orgId">) => {
  await addDoc(collection(db, "usage_logs"), {
    ...data,
    orgId,
    timestamp: serverTimestamp()
  });
};

export const subscribeToUsageLogs = (orgId: string, callback: (logs: UsageLog[]) => void) => {
  const q = query(
    collection(db, "usage_logs"), 
    where("orgId", "==", orgId),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsageLog)));
  }, (err) => {
    console.error("Usage logs snapshot error", err);
  });
};

// ------ TEAM MEMBERS ------
export const getTeamMembers = (orgId: string, callback: (members: TeamMember[]) => void) => {
  const q = query(collection(db, "team_members"), where("orgId", "==", orgId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
  }, (err) => {
    console.error("Team members snapshot error", err);
  });
};

export const inviteMember = async (orgId: string, email: string, role: string) => {
  await addDoc(collection(db, "team_members"), {
    orgId,
    email,
    role,
    joinedAt: serverTimestamp()
  });
};

// ------ DATA CLUSTERS ------
export const getClusters = (orgId: string, callback: (clusters: DataCluster[]) => void) => {
  const q = query(collection(db, "clusters"), where("orgId", "==", orgId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataCluster)));
  }, (err) => {
    console.error("Clusters snapshot error", err);
  });
};

export const updateClusterStatus = async (id: string, status: string) => {
  const docRef = doc(db, "clusters", id);
  await updateDoc(docRef, { status });
};

// ------ SENTINEL / MONITORING ------
export const subscribeToSentinelBorrowers = (orgId: string, callback: (borrowers: MonitoredBorrower[]) => void) => {
  const q = query(
    collection(db, "monitored_borrowers"),
    where("orgId", "==", orgId)
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoredBorrower)));
  }, (err) => {
    console.error("Sentinel snapshot error:", err);
  });
};
