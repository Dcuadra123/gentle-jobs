import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, UserCog, Wrench } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "encargado" | "tecnico";

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: Role;
}

const roleMeta: Record<Role, { label: string; icon: typeof ShieldCheck; className: string }> = {
  admin: { label: "Administrador", icon: ShieldCheck, className: "bg-primary/10 text-primary border-primary/20" },
  encargado: { label: "Encargado", icon: UserCog, className: "bg-warning/15 text-warning border-warning/30" },
  tecnico: { label: "Técnico", icon: Wrench, className: "bg-muted text-muted-foreground border-border" },
};

export default function AdminUsers() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Usuarios · Administración";
    if (isAdmin) load();
  }, [isAdmin]);

  if (!authLoading && !isAdmin) return <Navigate to="/" replace />;

  const load = async () => {
    setLoading(true);
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, username, email")
      .order("created_at", { ascending: true });

    if (pErr) {
      toast.error(pErr.message);
      setLoading(false);
      return;
    }

    const { data: roles, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rErr) {
      toast.error(rErr.message);
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, Role>();
    (roles ?? []).forEach((r) => {
      const current = roleMap.get(r.user_id);
      // priorizar admin > encargado > tecnico
      const order: Role[] = ["admin", "encargado", "tecnico"];
      if (!current || order.indexOf(r.role as Role) < order.indexOf(current)) {
        roleMap.set(r.user_id, r.role as Role);
      }
    });

    const rows: UserRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      username: p.username,
      email: p.email,
      role: roleMap.get(p.id) ?? "tecnico",
    }));
    setUsers(rows);
    setLoading(false);
  };

  const changeRole = async (userId: string, newRole: Role) => {
    if (userId === user?.id) {
      toast.error("No puedes cambiar tu propio rol.");
      return;
    }
    setUpdatingId(userId);
    // reemplazar rol: borrar todos y crear uno nuevo
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      setUpdatingId(null);
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (insErr) {
      toast.error(insErr.message);
    } else {
      toast.success("Rol actualizado");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Gestión de usuarios</h1>
        <p className="text-muted-foreground">
          Asigna roles para controlar el acceso a la plataforma.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(roleMeta) as Role[]).map((r) => {
          const meta = roleMeta[r];
          const Icon = meta.icon;
          const count = users.filter((u) => u.role === r).length;
          return (
            <Card key={r} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol actual</TableHead>
                  <TableHead className="w-48">Cambiar rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const meta = roleMeta[u.role];
                  const isSelf = u.id === user?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.full_name ?? "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.username ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          disabled={isSelf || updatingId === u.id}
                          onValueChange={(v) => changeRole(u.id, v as Role)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="encargado">Encargado</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
