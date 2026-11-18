import type { AuthService, Session } from "../interfaces";
import { ROLE_LABELS, type UserRole } from "@/types";

/**
 * DEMO ONLY. This is NOT authentication: there are no passwords, nothing is verified, and the
 * "session" is a role label in sessionStorage. Replace with Supabase Auth for any real deployment.
 */
const KEY = "sw-demo-session";
const read = (): Session | null => { try { const v = sessionStorage.getItem(KEY); return v ? (JSON.parse(v) as Session) : null; } catch { return null; } };

export const authService: AuthService = {
  isDemo: true,
  getSession: async () => read(),
  signIn: async () => { throw new Error("Password sign-in is unavailable in demo mode. Choose a role to explore the app."); },
  signUp: async () => { throw new Error("Registration needs the Supabase backend and is unavailable in demo mode."); },
  resetPassword: async () => { throw new Error("Password reset needs the Supabase backend and is unavailable in demo mode."); },
  signOut: async () => { sessionStorage.removeItem(KEY); },
  async enterDemo(role: UserRole) {
    const session: Session = { user: { id: `demo-${role}`, name: `Demo ${ROLE_LABELS[role]}`, email: `${role}@demo.local`, role } };
    sessionStorage.setItem(KEY, JSON.stringify(session)); return session;
  },
};
