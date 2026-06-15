import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Card, Btn } from "./AdminUI";
import {
  Package, ShoppingCart, CheckCircle2, XCircle, DollarSign, TrendingUp,
  Truck, CircleDollarSign, Clock, MessageCircle, Edit3, AlertCircle,
} from "lucide-react";
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

  if (!stats) return <div className="p-8 text-zinc-500">Cargando estadísticas…</div>;

  const m = stats.money;
  const wsp = stats.by_source?.whatsapp || { orders: 0, realized: 0, pending: 0 };
  const man = stats.by_source?.manual || { orders: 0, realized: 0, pending: 0 };

  return (
    <div className="p-6 lg:p-8 dark-scroll">
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen financiero · tasa actual ₲ ${rate.toLocaleString("es-PY")}/USD`}
        actions={<Btn variant="ghost" onClick={load} data-testid="dash-refresh-btn">Refrescar</Btn>}
      />

      {/* Top: contadores rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Package} label="Productos activos" value={stats.products.active} />
        <Stat icon={ShoppingCart} label="Pedidos activos" value={stats.orders.active} />
        <Stat icon={Truck} label="En proceso/envío" value={stats.orders.en_proceso + stats.orders.en_envio} color="text-amber-300" />
        <Stat icon={CheckCircle2} label="Completados" value={stats.orders.completados} color="text-emerald-400" />
      </div>

      {/* Bloque financiero principal */}
      <Card className="p-5 lg:p-6 mb-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500 mb-4">
          Cash flow — incluye WhatsApp + manuales
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BigStat
            icon={CircleDollarSign}
            label="Ganancia REALIZADA"
            sub="50% de seña + 100% completados"
            value={formatPYG(m.realized)}
            accent="emerald"
            testid="stat-realized"
          />
          <BigStat
            icon={Clock}
            label="Ganancia NO REALIZADA"
            sub="50% por cobrar de pedidos en curso"
            value={formatPYG(m.pending)}
            accent="amber"
            testid="stat-pending"
          />
          <BigStat
            icon={AlertCircle}
            label="Gastos (costos)"
            sub="Productos comprados a proveedor"
            value={formatPYG(m.cost)}
            accent="rose"
            testid="stat-cost"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-800">
          <Row label="Ventas totales (esperadas)" value={formatPYG(m.revenue)} icon={DollarSign} />
          <Row label="Ganancia neta hoy" value={formatPYG(m.profit)} icon={TrendingUp}
               highlight={m.profit >= 0 ? "text-emerald-300" : "text-rose-400"} />
          <Row label="Ganancia total esperada" value={formatPYG(m.expected_profit)} icon={CheckCircle2}
               highlight="text-zinc-200" />
        </div>
      </Card>

      {/* Por origen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SourceCard
          icon={MessageCircle}
          title="Pedidos WhatsApp"
          color="emerald"
          data={wsp}
        />
        <SourceCard
          icon={Edit3}
          title="Pedidos manuales (SHEIN)"
          color="amber"
          data={man}
        />
      </div>

      {/* Chart mensual */}
      <Card className="p-6 mb-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">Mensual</div>
            <h3 className="font-display font-bold text-xl">Ingresos · Costo · Realizado</h3>
            <p className="text-xs text-zinc-500 mt-1">&ldquo;Realizado&rdquo; = cobro efectivo (seña 50% o pago total).</p>
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
              <Bar dataKey="revenue" name="Ventas totales" fill="#4338ca" />
              <Bar dataKey="realized" name="Realizado (cobrado)" fill="#10b981" />
              <Bar dataKey="cost" name="Costo" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Desglose por estado */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="En proceso" value={stats.orders.en_proceso} color="text-amber-400" />
        <Stat label="En envío / arribado" value={stats.orders.en_envio} color="text-indigo-400" />
        <Stat label="Completados" value={stats.orders.completados} color="text-emerald-400" />
        <Stat icon={XCircle} label="Cancelados" value={stats.orders.cancelados} color="text-rose-400" />
        <Stat label="Flete cobrado" value={formatPYG(m.shipping)} />
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

function Row({ label, value, icon: Icon, highlight = "text-zinc-300" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className={`font-display text-xl font-bold ${highlight}`}>{value}</div>
    </div>
  );
}

function BigStat({ icon: Icon, label, sub, value, accent = "nabi", testid }) {
  const accents = {
    emerald: { border: "border-emerald-500/40", bg: "from-emerald-500/10", iconCol: "text-emerald-300" },
    amber: { border: "border-amber-500/40", bg: "from-amber-500/10", iconCol: "text-amber-300" },
    rose: { border: "border-rose-500/40", bg: "from-rose-500/10", iconCol: "text-rose-300" },
    nabi: { border: "border-nabi-500/40", bg: "from-nabi-500/10", iconCol: "text-nabi-300" },
  };
  const a = accents[accent] || accents.nabi;
  return (
    <div className={`relative bg-gradient-to-br ${a.bg} to-transparent border ${a.border} p-5`} data-testid={testid}>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400 mb-2 flex items-center gap-2">
        {Icon && <Icon className={`w-3.5 h-3.5 ${a.iconCol}`} />} {label}
      </div>
      <div className="font-display text-3xl font-black tracking-tight text-white">{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 mt-1.5">{sub}</div>}
    </div>
  );
}

function SourceCard({ icon: Icon, title, color, data }) {
  const colors = {
    emerald: "border-emerald-500/30 text-emerald-300",
    amber: "border-amber-500/30 text-amber-300",
  };
  return (
    <div className={`bg-zinc-900 border ${colors[color]?.split(" ")[0]} p-4`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-3 ${colors[color]?.split(" ")[1]}`}>
        <Icon className="w-4 h-4" /> {title}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] uppercase text-zinc-500 mb-0.5">Pedidos</div>
          <div className="font-display text-xl font-bold">{data.orders}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-zinc-500 mb-0.5">Cobrado</div>
          <div className="font-display text-base font-bold text-emerald-300">{formatPYG(data.realized)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-zinc-500 mb-0.5">Por cobrar</div>
          <div className="font-display text-base font-bold text-amber-300">{formatPYG(data.pending)}</div>
        </div>
      </div>
    </div>
  );
}
