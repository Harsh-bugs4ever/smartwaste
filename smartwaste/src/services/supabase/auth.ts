import type { AuthService, Session } from "../interfaces";
import type { User, UserRole } from "@/types";
import { supabase } from "./client";

const ensureClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
  }
  return supabase;
};

export const supabaseAuthService: AuthService = {
  isDemo: false,

  async getSession(): Promise<Session | null> {
    const client = ensureClient();
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) return null;

    // Fetch user profile
    const { data: profile } = await client
      .from("profiles")
      .select("full_name, role")
      .eq("id", session.user.id)
      .single();

    const user: User = {
      id: session.user.id,
      name: profile?.full_name || session.user.user_metadata?.full_name || "Operator",
      email: session.user.email || "",
      role: (profile?.role as UserRole) || "municipal_admin",
    };

    return { user };
  },

  async signIn(email: string, password: string): Promise<Session> {
    const client = ensureClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Authentication failed: No user returned");

    const { data: profile } = await client
      .from("profiles")
      .select("full_name, role")
      .eq("id", data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name || email.split("@")[0],
      email: data.user.email || email,
      role: (profile?.role as UserRole) || "municipal_admin",
    };

    return { user };
  },

  async signUp({ name, email, password }: { name: string; email: string; password: string }): Promise<void> {
    const client = ensureClient();
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: "municipal_admin",
        },
      },
    });
    if (error) throw error;
  },

  async resetPassword(email: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    const client = ensureClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  async enterDemo(_role: UserRole): Promise<Session> {
    throw new Error("Demo role switcher is disabled in live Supabase mode. Use genuine email/password credentials.");
  },
};
