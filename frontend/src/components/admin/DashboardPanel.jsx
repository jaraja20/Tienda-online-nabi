import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Card, Btn } from "./AdminUI";
import { Package, ShoppingCart, CheckCircle2, XCircle, DollarSign, TrendingUp, Truck } from "lucide-react";
import { formatPYG } from "../../lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

export default function DashboardPanel() {
  const [stats, setStats] = useState(null);
  const { rate } = useApp();

  const load = async () => {
    const r = await api.get("/dashboard/stats");
    setStats(r.data);
  };
  useEffect(() => { load(); }, []);

  if (!stats) {
    return <div className="p-8 text-zinc-500">Cargando estadísticas…</div>;
  }

  return (
    <div className="p-6 lg:p-8 dark-scroll">
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen de pedidos completados · tasa actual ₲ ${rate.toLocaleString("es-PY")}/USD`}
        actions={<Btn variant="ghost" onClick={load}>Refrescar</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Package} label="Productos activos" value={stats.products.active} />
        <Stat icon={ShoppingCart} label="Pedidos totales" value={stats.orders.total} />
        <Stat icon={Truck} label="En proceso/envío" value={stats.orders.en_proceso + stats.orders.en_envio} />
        <Stat icon={CheckCircle2} label="Completados" value={stats.orders.completados} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <BigStat icon={DollarSign} label="Ingresos (completados)" value={formatPYG(stats.money.revenue)} accent="emerald" testid="stat-revenue" />
        <BigStat icon={TrendingUp} label="Costo total (USD→PYG)" value={formatPYG(stats.money.cost)} accent="amber" testid="stat-cost" />
        <BigStat icon={DollarSign} label="Ganancia neta" value={formatPYG(stats.money.profit)} accent="nabi" testid="stat-profit" />
      </div>

      <Card className="p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">Mensual</div>
            <h3 className="font-display font-bold text-xl">Ingresos · Costo · Ganancia</h3>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chart_months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" />
              <YAxis stroke="#71717a" tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fafafa" }}
                formatter={(v) => formatPYG(v)}
              />
              <Legend />
              <Bar dataKey="revenue" name="Ingresos" fill="#4338ca" />
              <Bar dataKey="cost" name="Costo" fill="#f59e0b" />
              <Bar dataKey="profit" name="Ganancia" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
        <Stat label="En proceso" value={stats.orders.en_proceso} color="text-amber-400" />
        <Stat label="En envío" value={stats.orders.en_envio} color="text-indigo-400" />
        <Stat label="Completados" value={stats.orders.completados} color="text-emerald-400" />
        <Stat icon={XCircle} label="Cancelados" value={stats.orders.cancelados} color="text-rose-400" />
        <Stat label="Flete cobrado" value={formatPYG(stats.money.shipping)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color = "text-white", testid }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function BigStat({ icon: Icon, label, value, accent = "nabi", testid }) {
  const accents = {
    emerald: "border-emerald-500/40 from-emerald-500/10",
    amber: "border-amber-500/40 from-amber-500/10",
    nabi: "border-nabi-500/40 from-nabi-500/10",
  };
  return (
    <div className={`relative bg-gradient-to-br ${accents[accent]} to-transparent border ${accents[accent]} p-5 overflow-hidden`} data-testid={testid}>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="font-display text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}
