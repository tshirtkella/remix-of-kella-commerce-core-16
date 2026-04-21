import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  // Track previous user id to detect actual identity changes (vs token refresh / metadata update)
  const prevUserIdRef = useRef<string | null>(null);

  const isStaff = isAdmin || isModerator;
  const loading = !authReady || rolesLoading;

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;
      const nextUser = nextSession?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      const prevUserId = prevUserIdRef.current;
      const userChanged = nextUserId !== prevUserId;

      setSession(nextSession);
      setUser(nextUser);

      // Only flip rolesLoading when the actual user identity changes.
      // Token refresh / metadata updates keep the same id → don't reset.
      if (userChanged) {
        prevUserIdRef.current = nextUserId;
        setRolesLoading(Boolean(nextUser));
        if (!nextUser) {
          setIsAdmin(false);
          setIsModerator(false);
        }
      }

      setAuthReady(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        applySession(initialSession);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        prevUserIdRef.current = null;
        setRolesLoading(false);
        setAuthReady(true);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const loadRoles = async () => {
      if (!authReady) return;

      if (!user) {
        if (!isMounted) return;
        setIsAdmin(false);
        setIsModerator(false);
        setRolesLoading(false);
        return;
      }

      // Safety: if the network query stalls, don't block the UI forever.
      safetyTimer = setTimeout(() => {
        if (!isMounted) return;
        console.warn("[useAuth] roles fetch timed out — defaulting to non-staff");
        setRolesLoading(false);
      }, 5000);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "moderator"]);

        if (error) throw error;
        if (!isMounted) return;

        const roles = (data ?? []).map((r) => r.role);
        setIsAdmin(roles.includes("admin"));
        setIsModerator(roles.includes("moderator"));
      } catch (err) {
        console.warn("[useAuth] roles fetch failed:", err);
        if (!isMounted) return;
        setIsAdmin(false);
        setIsModerator(false);
      } finally {
        if (safetyTimer) clearTimeout(safetyTimer);
        if (isMounted) setRolesLoading(false);
      }
    };

    void loadRoles();

    return () => {
      isMounted = false;
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [authReady, user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isModerator, isStaff, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
