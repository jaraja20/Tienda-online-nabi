import React, { useEffect, useState } from "react";
import { api, fileUrl } from "../../lib/api";
import { PageHeader, Btn, Card, Input, Label, Modal, Select } from "./AdminUI";
import { STATE_LABELS, STATE_COLORS, formatPYG } from "../../lib/utils";
import { MessageCircle, Truck, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [shippingCost, setShippingCost] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const params = statusFilter ? { status: statusFilter } : {};
    const r = await api.get("/orders", { params });
    setOrders(r.data);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const body = { status: newStatus, note: note || null };
      if (shippingCost !== "" && (newStatus === "arribado" || newStatus === "completado")) {
        body.shipping_cost_pyg = Number(shippingCost);
      }
      const r = await api.put(`/orders/${selected.id}`, body);
      setSelected(r.data);
      await load();
      toast.success(`Pedido ${STATE_LABELS[newStatus]}`);
      setNote("");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm("¿Cancelar este pedido? Quedará marcado como cancelado.")) return;
    await updateStatus("cancelado");
  };

  const deleteOrder = async (o) => {
    if (!window.confirm("¿Eliminar permanentemente este pedido?")) return;
    await api.delete(`/orders/${o.id}`);
    setSelected(null);
    await load();
    toast.success("Eliminado");
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedido(s) en este filtro`}
        actions={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto" data-testid="orders-status-filter">
            <option value="">Todos los estados</option>
            {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-2 lg:max-h-[78vh] overflow-y-auto dark-scroll pr-1">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => { setSelected(o); setShippingCost(o.shipping_cost_pyg || ""); }}
              className={`w-full text-left p-4 border transition ${
                selected?.id === o.id ? "border-nabi-500 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60"
              }`}
              data-testid={`order-${o.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold">{o.customer_name}</div>
                  <div className="text-[11px] text-zinc-500">#{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${STATE_COLORS[o.status]} bg-opacity-20`}>
                  {STATE_LABELS[o.status]}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400 flex justify-between">
                <span>{o.items.length} ítem(s)</span>
                <span className="font-bold text-zinc-200">{formatPYG(o.total_pyg)}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{o.location}</div>
            </button>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800">
              <Truck className="w-10 h-10 mx-auto text-zinc-700 mb-2"/>
              <p className="text-sm">Sin pedidos</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="p-10 text-center text-zinc-500">
              <p className="font-semibold">Seleccioná un pedido</p>
              <p className="text-xs mt-1">Los detalles aparecerán acá</p>
            </Card>
          ) : (
            <OrderDetail
              order={selected}
              onUpdate={updateStatus}
              onCancel={cancelOrder}
              onDelete={() => deleteOrder(selected)}
              updating={updating}
              shippingCost={shippingCost}
              setShippingCost={setShippingCost}
              note={note}
              setNote={setNote}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const NEXT_STATE = {
  en_proceso: "pagado_parcialmente",
  pagado_parcialmente: "en_envio",
  en_envio: "arribado",
  arribado: "completado",
  completado: null,
  cancelado: null,
};

function OrderDetail({ order, onUpdate, onCancel, onDelete, updating, shippingCost, setShippingCost, note, setNote }) {
  const next = NEXT_STATE[order.status];

  return (
    <Card className="p-5" data-testid={`order-detail-${order.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Pedido</div>
          <div className="font-display text-2xl font-bold">#{order.id.slice(0, 8).toUpperCase()}</div>
          <div className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleString()}</div>
        </div>
        <span className={`text-[11px] uppercase tracking-wider px-3 py-1 border ${STATE_COLORS[order.status]} bg-opacity-20`}>
          {STATE_LABELS[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-zinc-950 p-3 border border-zinc-800">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">Cliente</div>
          <div className="font-bold text-sm">{order.customer_name}</div>
          {order.customer_phone && <div className="text-zinc-400">{order.customer_phone}</div>}
        </div>
        <div className="bg-zinc-950 p-3 border border-zinc-800">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">Entrega</div>
          <div className="font-bold text-sm">{order.location}</div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-200 mb-3">
          Nota: {order.notes}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {order.items.map((it, i) => (
          <div key={i} className="flex gap-3 p-2 bg-zinc-950 border border-zinc-800" data-testid={`order-item-${i}`}>
            <div className="w-12 h-14 bg-zinc-800 shrink-0">
              {it.photo && <img src={fileUrl(it.photo)} alt="" className="w-full h-full object-cover"/>}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold">{it.name}</div>
              {it.code && <div className="text-zinc-500">{it.code}</div>}
              {it.variant_label && <div className="text-zinc-400">{it.variant_label}</div>}
              <div className="mt-1 flex justify-between">
                <span>x{it.qty}</span>
                <span className="font-bold">{formatPYG(it.qty * it.unit_price_pyg)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-3 space-y-1 text-sm mb-4">
        <Row k="Subtotal productos" v={formatPYG(order.total_pyg - (order.shipping_cost_pyg || 0))} />
        {order.shipping_cost_pyg > 0 && <Row k="Flete" v={formatPYG(order.shipping_cost_pyg)} />}
        <Row k={<strong>Total</strong>} v={<strong className="text-base">{formatPYG(order.total_pyg)}</strong>} />
        <div className="text-[11px] text-zinc-500 pt-1">
          Costo: {formatPYG(order.cost_pyg_snapshot)} · Ganancia: <span className="text-emerald-400">{formatPYG(order.profit_pyg_snapshot)}</span>
        </div>
      </div>

      {(order.status === "arribado" || order.status === "en_envio") && order.status !== "completado" && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30">
          <Label>Costo de flete (₲)</Label>
          <Input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="Ej: 50000" data-testid="shipping-cost-input"/>
          <div className="text-[11px] text-amber-200 mt-1">Se agregará al total del pedido</div>
        </div>
      )}

      <Label>Nota para historial (opcional)</Label>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Cliente pagó por transferencia" data-testid="order-note-input"/>

      <div className="flex flex-wrap gap-2 mt-4">
        {next && order.status !== "cancelado" && (
          <Btn onClick={() => onUpdate(next)} disabled={updating} variant="success" data-testid="next-status-btn">
            <ChevronRight className="w-3 h-3 inline mr-1"/>Avanzar a: {STATE_LABELS[next]}
          </Btn>
        )}
        {order.status !== "cancelado" && order.status !== "completado" && (
          <Btn onClick={onCancel} variant="danger" disabled={updating} data-testid="cancel-order-btn">
            <XCircle className="w-3 h-3 inline mr-1"/>Cancelar pedido
          </Btn>
        )}
        <a
          href={`https://wa.me/${order.customer_phone?.replace(/\D/g, "") || ""}`}
          target="_blank"
          rel="noreferrer"
          className={`text-xs uppercase tracking-[0.15em] font-bold px-4 py-2 ${order.customer_phone ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-zinc-800 text-zinc-500 pointer-events-none"}`}
          data-testid="contact-customer-btn"
        >
          <MessageCircle className="w-3 h-3 inline mr-1"/>WhatsApp cliente
        </a>
        <Btn variant="ghost" onClick={onDelete} data-testid="delete-order-btn">Eliminar</Btn>
      </div>

      {/* History */}
      {order.status_history?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">Historial</div>
          <div className="space-y-1 text-xs">
            {order.status_history.map((h, i) => (
              <div key={i} className="flex justify-between text-zinc-400">
                <span>{STATE_LABELS[h.status] || h.status}{h.note ? ` — ${h.note}` : ""}</span>
                <span className="text-zinc-600">{new Date(h.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between text-zinc-300">
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
