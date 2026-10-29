import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  orgId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  orgId: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No credentials configured (self-hosted demo / open-source build): there is
    // no session to restore, so stop waiting immediately.
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // In Gavel, orgId === user's Firebase UID
      setOrgId(currentUser?.uid || null);
      setLoading(false);
    });

    // Safety net: a misconfigured project must never trap the UI on a spinner.
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, orgId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);
