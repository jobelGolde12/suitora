"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Better Auth returns session directly or nested
        const sess = data?.session || data;
        if (sess?.user) {
          setSession(sess);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  // Initial session fetch
  useEffect(() => {
    fetchSession();
  }, []);

  // Refresh session every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSession();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "session_update") {
        fetchSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}
