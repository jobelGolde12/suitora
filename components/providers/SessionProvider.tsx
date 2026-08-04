"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { logoutAction } from "@/lib/auth/actions";

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
  logout: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
  logout: async () => false,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
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
  }, []);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async (): Promise<boolean> => {
    let apiSuccess = false;

    try {
      const result = await logoutAction();
      apiSuccess = result.success;
    } catch {
      // Continue with local cleanup even if the server action fails
    }

    Object.keys(localStorage).forEach((key) => {
      if (key.includes("session") || key.includes("token") || key.includes("auth")) {
        localStorage.removeItem(key);
      }
    });

    sessionStorage.clear();

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=strict;`;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("session_update", Date.now().toString());
    }

    setSession(null);

    return apiSuccess;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchSession());
  }, [fetchSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "session_update") {
        void fetchSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ session, isLoading, refreshSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
}