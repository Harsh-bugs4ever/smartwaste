import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { services } from "@/services";
import type { User, UserRole } from "@/types";

interface AuthCtx {
  user: User | null; loading: boolean; isDemo: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemo: (r: UserRole) => Promise<User>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { services.auth.getSession().then((s) => setUser(s?.user ?? null)).finally(() => setLoading(false)); }, []);
  const signIn = useCallback(async (email: string, password: string) => { const s = await services.auth.signIn(email, password); setUser(s.user); return s.user; }, []);
  const enterDemo = useCallback(async (role: UserRole) => {
    if (!services.auth.enterDemo) throw new Error("Demo mode is not available.");
    const s = await services.auth.enterDemo(role); setUser(s.user); return s.user;
  }, []);
  const signOut = useCallback(async () => { await services.auth.signOut(); setUser(null); }, []);
  return (
    <Ctx.Provider value={{ user, loading, isDemo: services.auth.isDemo, signIn, signUp: (i) => services.auth.signUp(i), resetPassword: (e) => services.auth.resetPassword(e), enterDemo, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error("useAuth outside AuthProvider"); return c; };
