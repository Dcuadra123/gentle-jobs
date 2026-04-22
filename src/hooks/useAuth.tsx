import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "encargado" | "tecnico";

interface Permissions {
  canManageUsers: boolean;
  canManageAssets: boolean;      // crear/editar edificios y ubicaciones
  canDeleteAssets: boolean;      // eliminar edificios/ubicaciones/órdenes/preventivos
  canCreateWork: boolean;        // crear órdenes y preventivos
  canAssignWork: boolean;        // reasignar trabajo a otros
  canEditAnyWork: boolean;       // editar cualquier orden/preventivo (no solo lo asignado)
  canViewReports: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  isEncargado: boolean;
  isTecnico: boolean;
  permissions: Permissions;
  signOut: () => Promise<void>;
}

const buildPermissions = (role: Role | null): Permissions => {
  const admin = role === "admin";
  const encargado = role === "encargado";
  return {
    canManageUsers: admin,
    canManageAssets: admin || encargado,
    canDeleteAssets: admin,
    canCreateWork: admin || encargado,
    canAssignWork: admin || encargado,
    canEditAnyWork: admin || encargado,
    canViewReports: true,
  };
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid deadlock
        setTimeout(() => fetchRole(newSession.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role", { ascending: true })
      .limit(1)
      .maybeSingle();
    setRole((data?.role as Role) ?? "tecnico");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, isAdmin: role === "admin", signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
