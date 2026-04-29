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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

type Status = "pendiente" | "en_curso" | "completada" | "cancelada";
type Priority = "baja" | "media" | "alta" | "urgente";

interface WorkOrder {
  id: string; title: string; description: string | null;
  priority: Priority; status: Status;
  location_id: string | null; assigned_to: string | null; created_by: string | null;
  due_date: string | null; completed_at: string | null;
  created_at: string;
  locations?: { name: string; buildings?: { name: string } | null } | null;
}
interface Location { id: string; name: string; buildings?: { name: string } | null }
interface Profile { id: string; full_name: string | null; email: string | null }

const statusLabel: Record<Status, string> = {
  pendiente: "Pendiente", en_curso: "En curso", completada: "Completada", cancelada: "Cancelada",
};
const priorityLabel: Record<Priority, string> = {
  baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente",
};

const statusVariant = (s: Status) =>
  s === "completada" ? "default" : s === "en_curso" ? "secondary" : s === "cancelada" ? "outline" : "secondary";

const priorityClass = (p: Priority) =>
  p === "urgente" ? "bg-destructive/15 text-destructive border-destructive/30"
    : p === "alta" ? "bg-warning/15 text-warning border-warning/30"
      : p === "media" ? "bg-primary/10 text-primary border-primary/20"
        : "bg-muted text-muted-foreground border-border";

export default function WorkOrders() {
  const { user, permissions } = useAuth();
  const canEditAny = permissions.canEditAnyWork;
  const canDelete = permissions.canDeleteAssets;
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");

  // form state
  const [locationId, setLocationId] = useState<string>("none");
  const [assignedTo, setAssignedTo] = useState<string>("none");
  const [priority, setPriority] = useState<Priority>("media");
  const [status, setStatus] = useState<Status>("pendiente");

  useEffect(() => { document.title = "Órdenes · Mantenimiento"; load(); }, []);

  const load = async () => {
    const [wo, loc, pr] = await Promise.all([
      supabase.from("work_orders").select("*, locations(name, buildings(name))").order("created_at", { ascending: false }),
      supabase.from("locations").select("id,name, buildings(name)").order("name"),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    if (wo.error) toast.error(wo.error.message); else setItems((wo.data as any) ?? []);
    if (loc.data) setLocations(loc.data as any);
    if (pr.data) setProfiles(pr.data);
  };

  const startCreate = () => {
    setEditing(null);
    setLocationId("none"); setAssignedTo("none"); setPriority("media"); setStatus("pendiente");
    setOpen(true);
  };
  const startEdit = (w: WorkOrder) => {
    setEditing(w);
    setLocationId(w.location_id ?? "none");
    setAssignedTo(w.assigned_to ?? "none");
    setPriority(w.priority); setStatus(w.status);
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return toast.error("Título obligatorio");
    const due = String(fd.get("due_date") ?? "").trim();

    const payload: any = {
      title,
      description: String(fd.get("description") ?? "").trim() || null,
      location_id: locationId === "none" ? null : locationId,
      assigned_to: assignedTo === "none" ? null : assignedTo,
      priority, status,
      due_date: due || null,
      completed_at: status === "completada" ? (editing?.completed_at ?? new Date().toISOString()) : null,
    };
    if (!editing) payload.created_by = user!.id;

    let res;
    if (editing) {
      res = await supabase.from("work_orders").update(payload).eq("id", editing.id);
    } else {
      res = await supabase.from("work_orders").insert(payload).select();
    }

    if (res.error) {
      toast.error(res.error.message);
    } else {
      if (!editing && res.data && res.data[0]) {
        fetch("https://require-press-anchovy.ngrok-free.dev/webhook-test/A", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(res.data[0]),
        }).catch((err) => console.error("Error al enviar webhook:", err));
      }
      toast.success(editing ? "Actualizada" : "Creada");
      setOpen(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar orden?")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Eliminada"); load(); }
  };

  const visible = filter === "all" ? items : items.filter((i) => i.status === filter);

  const profileName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((p) => p.id === id);
    return p?.full_name || p?.email || "Usuario";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Órdenes de trabajo</h1>
          <p className="text-muted-foreground">Incidencias y trabajos a realizar.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nueva orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar orden" : "Nueva orden"}</DialogTitle>
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
                  <Label>Prioridad</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["baja", "media", "alta", "urgente"] as Priority[]).map((p) => (
                        <SelectItem key={p} value={p}>{priorityLabel[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["pendiente", "en_curso", "completada", "cancelada"] as Status[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Sin ubicación" /></SelectTrigger>
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
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input id="due_date" name="due_date" type="date" defaultValue={editing?.due_date ?? ""} />
              </div>
              <DialogFooter>
                <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="en_curso">En curso</TabsTrigger>
          <TabsTrigger value="completada">Completadas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No hay órdenes en esta vista.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((w) => {
            const canEdit = canEditAny || w.assigned_to === user?.id;
            return (
              <Card key={w.id} className="shadow-card transition-shadow hover:shadow-elevated">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{w.title}</h3>
                      <Badge variant={statusVariant(w.status) as any}>{statusLabel[w.status]}</Badge>
                      <Badge variant="outline" className={priorityClass(w.priority)}>{priorityLabel[w.priority]}</Badge>
                    </div>
                    {w.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{w.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {w.locations && (
                        <span>📍 {w.locations.buildings?.name ? `${w.locations.buildings.name} · ` : ""}{w.locations.name}</span>
                      )}
                      <span>👤 {profileName(w.assigned_to)}</span>
                      {w.due_date && <span>📅 {w.due_date}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => startEdit(w)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => remove(w.id)}>
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
