import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, ClipboardList, AlertTriangle, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  buildings: number;
  openOrders: number;
  overdue: number;
  upcoming: number;
}

const StatCard = ({
  to,
  title,
  value,
  icon: Icon,
  tone = "primary",
}: {
  to: string;
  title: string;
  value: number;
  icon: any;
  tone?: "primary" | "warning" | "destructive" | "success";
}) => (
  <Link to={to}>
    <Card className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-xl " +
            (tone === "warning"
              ? "bg-warning/15 text-warning"
              : tone === "destructive"
                ? "bg-destructive/15 text-destructive"
                : tone === "success"
                  ? "bg-success/15 text-success"
                  : "bg-primary/10 text-primary")
          }
        >
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ buildings: 0, openOrders: 0, overdue: 0, upcoming: 0 });

  useEffect(() => {
    document.title = "Panel · Mantenimiento";
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      const [b, wo, ov, up] = await Promise.all([
        supabase.from("buildings").select("id", { count: "exact", head: true }),
        supabase.from("work_orders").select("id", { count: "exact", head: true }).in("status", ["pendiente", "en_curso"]),
        supabase.from("preventive_tasks").select("id", { count: "exact", head: true }).lt("next_due_date", today).eq("active", true),
        supabase.from("preventive_tasks").select("id", { count: "exact", head: true }).gte("next_due_date", today).lte("next_due_date", in7).eq("active", true),
      ]);
      setStats({
        buildings: b.count ?? 0,
        openOrders: wo.count ?? 0,
        overdue: ov.count ?? 0,
        upcoming: up.count ?? 0,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Panel</h1>
        <p className="text-muted-foreground">Vista general del estado del mantenimiento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard to="/buildings" title="Edificios" value={stats.buildings} icon={Building2} />
        <StatCard to="/work-orders" title="Órdenes abiertas" value={stats.openOrders} icon={ClipboardList} tone="warning" />
        <StatCard to="/preventive" title="Preventivo vencido" value={stats.overdue} icon={AlertTriangle} tone="destructive" />
        <StatCard to="/preventive" title="Próximos 7 días" value={stats.upcoming} icon={CalendarClock} tone="success" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Empieza dando de alta un edificio y sus ubicaciones, luego crea órdenes de trabajo o
            programa tareas de mantenimiento preventivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Usa el menú lateral para navegar entre secciones.
        </CardContent>
      </Card>
    </div>
  );
}
