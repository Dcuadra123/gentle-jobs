import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PT {
  id: string; title: string; description: string | null;
  location_id: string | null; assigned_to: string | null;
  frequency_days: number; next_due_date: string;
  last_completed_at: string | null; active: boolean;
  created_by: string | null;
  locations?: { name: string; buildings?: { name: string } | null } | null;
}
interface Location { id: string; name: string; buildings?: { name: string } | null }
interface Profile { id: string; full_name: string | null; email: string | null }

export default function Preventive() {
  const { user, permissions } = useAuth();
  const canEditAny = permissions.canEditAnyWork;
  const canDelete = permissions.canDeleteAssets;
  const [items, setItems] = useState<PT[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PT | null>(null);
  const [locationId, setLocationId] = useState("none");
  const [assignedTo, setAssignedTo] = useState("none");

  useEffect(() => { document.title = "Preventivo · Mantenimiento"; load(); }, []);

  const load = async () => {
    const [pt, loc, pr] = await Promise.all([
      supabase.from("preventive_tasks").select("*, locations(name, buildings(name))").order("next_due_date"),
      supabase.from("locations").select("id,name, buildings(name)").order("name"),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    if (pt.error) toast.error(pt.error.message); else setItems((pt.data as any) ?? []);
    if (loc.data) setLocations(loc.data as any);
    if (pr.data) setProfiles(pr.data);
  };

  const startCreate = () => {
    setEditing(null);
    setLocationId("none"); setAssignedTo("none");
    setOpen(true);
  };
  const startEdit = (p: PT) => {
    setEditing(p);
    setLocationId(p.location_id ?? "none");
    setAssignedTo(p.assigned_to ?? "none");
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const freq = parseInt(String(fd.get("frequency_days") ?? "30"), 10);
    const due = String(fd.get("next_due_date") ?? "").trim();
    if (!title) return toast.error("Título obligatorio");
    if (!due) return toast.error("Próxima fecha obligatoria");
    if (!freq || freq <= 0) return toast.error("Frecuencia inválida");

    const payload: any = {
      title,
      description: String(fd.get("description") ?? "").trim() || null,
      location_id: locationId === "none" ? null : locationId,
      assigned_to: assignedTo === "none" ? null : assignedTo,
      frequency_days: freq,
      next_due_date: due,
      active: true,
    };
    if (!editing) payload.created_by = user!.id;

    const res = editing
      ? await supabase.from("preventive_tasks").update(payload).eq("id", editing.id)
      : await supabase.from("preventive_tasks").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success(editing ? "Actualizada" : "Creada"); setOpen(false); load(); }
  };

  const complete = async (p: PT) => {
    const next = new Date();
    next.setDate(next.getDate() + p.frequency_days);
    const { error } = await supabase
      .from("preventive_tasks")
      .update({
        last_completed_at: new Date().toISOString(),
        next_due_date: next.toISOString().slice(0, 10),
      })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Marcada como realizada"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar tarea preventiva?")) return;
    const { error } = await supabase.from("preventive_tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Eliminada"); load(); }
  };

  const profileName = (id: string | null) => {
    if (!id) return "Sin asignar";
    const p = profiles.find((p) => p.id === id);
    return p?.full_name || p?.email || "Usuario";
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Mantenimiento preventivo</h1>
          <p className="text-muted-foreground">Tareas recurrentes programadas por fecha.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nueva tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar tarea" : "Nueva tarea preventiva"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={editing?.title} required maxLength={140} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} maxLength={1000} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency_days">Frecuencia (días)</Label>
                  <Input id="frequency_days" name="frequency_days" type="number" min={1} defaultValue={editing?.frequency_days ?? 30} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_due_date">Próxima fecha</Label>
                  <Input id="next_due_date" name="next_due_date" type="date" defaultValue={editing?.next_due_date ?? today} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ubicación</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.buildings?.name ? `${l.buildings.name} · ` : ""}{l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asignar a</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <CalendarClock className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aún no hay tareas preventivas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => {
            const overdue = p.next_due_date < today;
            const canEdit = canEditAny || p.assigned_to === user?.id;
            return (
              <Card key={p.id} className="shadow-card">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{p.title}</h3>
                      {overdue ? (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30" variant="outline">
                          Vencida
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Programada</Badge>
                      )}
                      <Badge variant="outline">cada {p.frequency_days}d</Badge>
                    </div>
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {p.locations && (
                        <span>📍 {p.locations.buildings?.name ? `${p.locations.buildings.name} · ` : ""}{p.locations.name}</span>
                      )}
                      <span>👤 {profileName(p.assigned_to)}</span>
                      <span>📅 {p.next_due_date}</span>
                      {p.last_completed_at && <span>✓ última: {new Date(p.last_completed_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => complete(p)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Realizar
                      </Button>
                    )}
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => startEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
