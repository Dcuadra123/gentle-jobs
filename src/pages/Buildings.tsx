import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Building {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
}

export default function Buildings() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Building[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);

  useEffect(() => {
    document.title = "Edificios · Mantenimiento";
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("buildings").select("*").order("name");
    if (error) toast.error(error.message);
    else setItems(data ?? []);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      address: String(fd.get("address") ?? "").trim() || null,
      notes: String(fd.get("notes") ?? "").trim() || null,
    };
    if (!payload.name) return toast.error("El nombre es obligatorio");

    const res = editing
      ? await supabase.from("buildings").update(payload).eq("id", editing.id)
      : await supabase.from("buildings").insert(payload);

    if (res.error) toast.error(res.error.message);
    else {
      toast.success(editing ? "Edificio actualizado" : "Edificio creado");
      setOpen(false);
      setEditing(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar edificio? También se borrarán sus ubicaciones.")) return;
    const { error } = await supabase.from("buildings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminado");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Edificios</h1>
          <p className="text-muted-foreground">Gestiona los inmuebles a mantener.</p>
        </div>
        {isAdmin && (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo edificio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar edificio" : "Nuevo edificio"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" defaultValue={editing?.name} required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" defaultValue={editing?.address ?? ""} maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" defaultValue={editing?.notes ?? ""} maxLength={500} />
                </div>
                <DialogFooter>
                  <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aún no hay edificios.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <Card key={b.id} className="shadow-card transition-shadow hover:shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{b.name}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(b);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {b.address && <p>{b.address}</p>}
                {b.notes && <p className="line-clamp-3">{b.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
