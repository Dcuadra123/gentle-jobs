import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Building { id: string; name: string }
interface Location {
  id: string; name: string; floor: string | null; description: string | null;
  building_id: string; buildings?: { name: string } | null;
}

export default function Locations() {
  const { permissions } = useAuth();
  const canManage = permissions.canManageAssets;
  const canDelete = permissions.canDeleteAssets;
  const [items, setItems] = useState<Location[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [buildingId, setBuildingId] = useState<string>("");

  useEffect(() => { document.title = "Ubicaciones · Mantenimiento"; load(); }, []);

  const load = async () => {
    const [b, l] = await Promise.all([
      supabase.from("buildings").select("id,name").order("name"),
      supabase.from("locations").select("*, buildings(name)").order("name"),
    ]);
    if (b.error) toast.error(b.error.message); else setBuildings(b.data ?? []);
    if (l.error) toast.error(l.error.message); else setItems((l.data as any) ?? []);
  };

  const startCreate = () => {
    setEditing(null);
    setBuildingId(buildings[0]?.id ?? "");
    setOpen(true);
  };
  const startEdit = (loc: Location) => {
    setEditing(loc);
    setBuildingId(loc.building_id);
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!buildingId) return toast.error("Selecciona un edificio");
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      floor: String(fd.get("floor") ?? "").trim() || null,
      description: String(fd.get("description") ?? "").trim() || null,
      building_id: buildingId,
    };
    if (!payload.name) return toast.error("El nombre es obligatorio");
    const res = editing
      ? await supabase.from("locations").update(payload).eq("id", editing.id)
      : await supabase.from("locations").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success(editing ? "Actualizada" : "Creada"); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar ubicación?")) return;
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Eliminada"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Ubicaciones</h1>
          <p className="text-muted-foreground">Zonas, salas y áreas dentro de cada edificio.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={startCreate} disabled={buildings.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Nueva ubicación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Edificio</Label>
                  <Select value={buildingId} onValueChange={setBuildingId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" defaultValue={editing?.name} required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Planta</Label>
                  <Input id="floor" name="floor" defaultValue={editing?.floor ?? ""} maxLength={40} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} maxLength={500} />
                </div>
                <DialogFooter>
                  <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {buildings.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Crea primero un edificio.
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        buildings.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
              <MapPin className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Aún no hay ubicaciones.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Edificio</TableHead>
                <TableHead>Planta</TableHead>
                <TableHead>Descripción</TableHead>
                {(canManage || canDelete) && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.buildings?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.floor ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{l.description ?? "—"}</TableCell>
                  {(canManage || canDelete) && (
                    <TableCell className="text-right">
                      {canManage && (
                        <Button size="icon" variant="ghost" onClick={() => startEdit(l)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" onClick={() => remove(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
