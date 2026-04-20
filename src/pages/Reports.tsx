import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WO {
  id: string; title: string; status: string; priority: string;
  created_at: string; completed_at: string | null;
  locations?: { name: string; buildings?: { name: string } | null } | null;
}

export default function Reports() {
  const [orders, setOrders] = useState<WO[]>([]);

  useEffect(() => {
    document.title = "Informes · Mantenimiento";
    supabase
      .from("work_orders")
      .select("id,title,status,priority,created_at,completed_at, locations(name, buildings(name))")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  }, []);

  const total = orders.length;
  const completed = orders.filter((o) => o.status === "completada").length;
  const open = orders.filter((o) => o.status === "pendiente" || o.status === "en_curso").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Avg completion time (days)
  const completedOrders = orders.filter((o) => o.completed_at);
  const avgDays = completedOrders.length
    ? Math.round(
        completedOrders.reduce((acc, o) => {
          const d = (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 86400000;
          return acc + d;
        }, 0) / completedOrders.length
      )
    : 0;

  // by priority
  const byPriority = ["urgente", "alta", "media", "baja"].map((p) => ({
    p,
    count: orders.filter((o) => o.priority === p).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Informes</h1>
        <p className="text-muted-foreground">Historial e indicadores de mantenimiento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total órdenes</p>
            <p className="mt-1 text-3xl font-semibold">{total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Completadas</p>
            <p className="mt-1 text-3xl font-semibold text-success">{completed}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Abiertas</p>
            <p className="mt-1 text-3xl font-semibold text-warning">{open}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tasa de cierre</p>
            <p className="mt-1 text-3xl font-semibold">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle>Por prioridad</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byPriority.map(({ p, count }) => {
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={p}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{p}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle>Tiempo medio de resolución</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{avgDays} <span className="text-base font-normal text-muted-foreground">días</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Calculado sobre {completedOrders.length} órdenes completadas.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Historial reciente</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay órdenes registradas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 15).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.locations ? `${o.locations.buildings?.name ?? ""} · ${o.locations.name} · ` : ""}
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={o.status === "completada" ? "default" : "secondary"} className="capitalize">
                    {o.status.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
