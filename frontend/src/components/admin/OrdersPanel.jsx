import React, { useEffect, useState } from "react";
import { api, fileUrl } from "../../lib/api";
import { PageHeader, Btn, Card, Input, Label, Modal, Select } from "./AdminUI";
import { STATE_LABELS, STATE_COLORS, formatPYG } from "../../lib/utils";
import {
  MessageCircle, Truck, XCircle, ChevronRight, Plus, Trash2, FolderOpen, ShoppingBag, Edit3, Pencil,
} from "lucide-react";
import FilePickerModal from "./FilePickerModal";
import toast from "react-hot-toast";

const SOURCES = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "manual", label: "Pedidos manuales", icon: Edit3 },
];

export default function OrdersPanel() {
  const [tab, setTab] = useState("whatsapp");
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [shippingCost, setShippingCost] = useState("");
  const [note, setNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const load = async () => {
    const params = { source: tab };
    if (statusFilter) params.status = statusFilter;
    const r = await api.get("/orders", { params });
    setOrders(r.data);
    setSelected((cur) => (cur ? r.data.find((o) => o.id === cur.id) || null : null));
  };
  useEffect(() => { load(); }, [statusFilter, tab]); // eslint-disable-line

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
    } catch { toast.error("Error al actualizar"); }
    finally { setUpdating(false); }
  };

  const cancelOrder = async () => {
    if (!window.confirm("¿Cancelar este pedido?")) return;
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
    <div className="p-4 lg:p-8">
      <PageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedido(s) en ${SOURCES.find((s) => s.key === tab)?.label}`}
        actions={
          <div className="flex gap-2 items-center">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto" data-testid="orders-status-filter">
              <option value="">Todos los estados</option>
              {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            {tab === "manual" && (
              <Btn onClick={() => setShowCreate(true)} data-testid="new-manual-order-btn">
                <Plus className="w-3 h-3 inline mr-1"/> Nuevo pedido
              </Btn>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-zinc-800">
        {SOURCES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelected(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold transition border-b-2 -mb-px ${
              tab === key ? "text-white border-nabi-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"
            }`}
            data-testid={`orders-tab-${key}`}
          >
            <Icon className="w-3.5 h-3.5"/>{label}
          </button>
        ))}
      </div>

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
                <span>{o.items.length} ítem(s){o.shipping ? " · 📦 envío" : ""}</span>
                <span className="font-bold text-zinc-200">{formatPYG(o.total_pyg)}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{o.location}</div>
            </button>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800">
              {tab === "manual" ? <Edit3 className="w-10 h-10 mx-auto text-zinc-700 mb-2"/> : <Truck className="w-10 h-10 mx-auto text-zinc-700 mb-2"/>}
              <p className="text-sm">Sin pedidos {tab === "manual" ? "manuales" : "de WhatsApp"}</p>
              {tab === "manual" && (
                <Btn onClick={() => setShowCreate(true)} className="mt-3" data-testid="new-manual-empty-btn">
                  <Plus className="w-3 h-3 inline mr-1"/> Crear el primero
                </Btn>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="p-10 text-center text-zinc-500">
              <p className="font-semibold">Seleccioná un pedido</p>
            </Card>
          ) : (
            <OrderDetail
              order={selected}
              onUpdate={updateStatus}
              onCancel={cancelOrder}
              onDelete={() => deleteOrder(selected)}
              onEdit={() => setEditingOrder(selected)}
              updating={updating}
              shippingCost={shippingCost}
              setShippingCost={setShippingCost}
              note={note}
              setNote={setNote}
            />
          )}
        </div>
      </div>

      <ManualOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(o) => { load(); setSelected(o); setShowCreate(false); }}
      />

      <ManualOrderModal
        open={!!editingOrder}
        existing={editingOrder}
        onClose={() => setEditingOrder(null)}
        onCreated={(o) => { load(); setSelected(o); setEditingOrder(null); }}
      />
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

function OrderDetail({ order, onUpdate, onCancel, onDelete, onEdit, updating, shippingCost, setShippingCost, note, setNote }) {
  const next = NEXT_STATE[order.status];
  return (
    <Card className="p-5" data-testid={`order-detail-${order.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex gap-2 items-center">
            Pedido
            <span className={`px-1.5 py-0.5 text-[8px] ${order.source === "manual" ? "bg-amber-600/30 text-amber-200" : "bg-emerald-600/30 text-emerald-200"}`}>
              {order.source === "manual" ? "MANUAL" : "WHATSAPP"}
            </span>
          </div>
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

      {order.shipping && (
        <div className="bg-blue-500/10 border border-blue-500/30 p-3 text-xs mb-3 space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-blue-300 font-bold">📦 Envío</div>
          {order.shipping_cedula && <div><span className="text-zinc-500">Cédula:</span> <span className="text-zinc-200">{order.shipping_cedula}</span></div>}
          {order.shipping_address && <div><span className="text-zinc-500">Dirección:</span> <span className="text-zinc-200">{order.shipping_address}</span></div>}
          {order.shipping_carrier && <div><span className="text-zinc-500">Transportadora:</span> <span className="text-zinc-200">{order.shipping_carrier}</span></div>}
        </div>
      )}

      {order.notes && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-200 mb-3">
          Nota: {order.notes}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {order.items.map((it, i) => (
          <div key={i} className="flex gap-3 p-2 bg-zinc-950 border border-zinc-800" data-testid={`order-item-${i}`}>
            <div className="w-14 h-16 bg-zinc-800 shrink-0">
              {it.photo && <img src={fileUrl(it.photo)} alt="" className="w-full h-full object-cover"/>}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold flex items-center gap-1">
                {it.name}
                {it.is_manual && <span className="text-[8px] bg-amber-600/30 text-amber-200 px-1">M</span>}
              </div>
              {it.code && <div className="text-zinc-500">{it.code}</div>}
              {it.variant_label && <div className="text-zinc-400">{it.variant_label}</div>}
              {it.manual_description && <div className="text-zinc-400 italic">{it.manual_description}</div>}
              <div className="mt-1 flex justify-between">
                <span>x{it.qty} {it.is_manual ? `· costo ${formatPYG(it.manual_cost_pyg || 0)}/u` : ""}</span>
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
        </div>
      )}

      <Label>Nota para historial (opcional)</Label>
      <Input value={note} onChange={(e) => setNote(e.target.value)} data-testid="order-note-input"/>

      <div className="flex flex-wrap gap-2 mt-4">
        {next && order.status !== "cancelado" && (
          <Btn onClick={() => onUpdate(next)} disabled={updating} variant="success" data-testid="next-status-btn">
            <ChevronRight className="w-3 h-3 inline mr-1"/>Avanzar a: {STATE_LABELS[next]}
          </Btn>
        )}
        <Btn variant="ghost" onClick={onEdit} data-testid="edit-order-btn">
          <Pencil className="w-3 h-3 inline mr-1"/>Editar
        </Btn>
        {order.status !== "cancelado" && order.status !== "completado" && (
          <Btn onClick={onCancel} variant="danger" disabled={updating} data-testid="cancel-order-btn">
            <XCircle className="w-3 h-3 inline mr-1"/>Cancelar
          </Btn>
        )}
        {order.customer_phone && (
          <a
            href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-[0.15em] font-bold px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500"
            data-testid="contact-customer-btn"
          >
            <MessageCircle className="w-3 h-3 inline mr-1"/>WhatsApp
          </a>
        )}
        <Btn variant="ghost" onClick={onDelete} data-testid="delete-order-btn">Eliminar</Btn>
      </div>

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
  return <div className="flex justify-between text-zinc-300"><span>{k}</span><span>{v}</span></div>;
}

// ---------------- Modal de pedido manual ----------------
function blankItem() {
  return { name: "", code: "", qty: 1, unit_price_pyg: "", manual_cost: "", manual_cost_currency: "PYG", manual_description: "", photo: "" };
}

function ManualOrderModal({ open, onClose, onCreated, existing = null }) {
  const isEdit = !!existing;
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [shipping, setShipping] = useState({ enabled: false, cedula: "", address: "", carrier: "" });
  const [items, setItems] = useState([blankItem()]);
  const [notes, setNotes] = useState("");
  const [totalOverride, setTotalOverride] = useState(""); // precio venta total opcional
  const [saving, setSaving] = useState(false);
  const [pickerForIdx, setPickerForIdx] = useState(null);
  const [rate, setRate] = useState(7800);

  // Cargar exchange rate
  useEffect(() => {
    if (!open) return;
    api.get("/settings").then((r) => {
      const er = Number(r.data?.exchange_rate);
      if (er > 0) setRate(er);
    }).catch(() => {});
  }, [open]);

  // Si es edición, pre-cargar campos del pedido existente
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existing) {
      setCustomer({ name: existing.customer_name || "", phone: existing.customer_phone || "" });
      setShipping({
        enabled: !!existing.shipping,
        cedula: existing.shipping_cedula || "",
        address: existing.shipping_address || "",
        carrier: existing.shipping_carrier || "",
      });
      setItems((existing.items || []).map((it) => ({
        name: it.name || "",
        code: it.code || "",
        qty: it.qty || 1,
        unit_price_pyg: it.unit_price_pyg || "",
        manual_cost: it.manual_cost_pyg || "",
        manual_cost_currency: "PYG",
        manual_description: it.manual_description || it.variant_label || "",
        photo: it.photo || "",
      })));
      setNotes(existing.notes || "");
      setTotalOverride("");
    } else {
      setCustomer({ name: "", phone: "" });
      setShipping({ enabled: false, cedula: "", address: "", carrier: "" });
      setItems([blankItem()]);
      setNotes("");
      setTotalOverride("");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, existing]);

  const reset = () => {
    setCustomer({ name: "", phone: "" });
    setShipping({ enabled: false, cedula: "", address: "", carrier: "" });
    setItems([blankItem()]);
    setNotes("");
    setTotalOverride("");
  };

  const updateItem = (idx, patch) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => setItems((arr) => arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr);

  // Helper: convierte costo del item a PYG según moneda elegida
  const itemCostPyg = (it) => {
    const v = Number(it.manual_cost) || 0;
    return it.manual_cost_currency === "USD" ? v * rate : v;
  };

  const sumItemPrices = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price_pyg) || 0), 0);
  const overrideNum = Number(totalOverride) || 0;
  const total = overrideNum > 0 ? overrideNum : sumItemPrices;
  const costTotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * itemCostPyg(it), 0);
  const profitTotal = total - costTotal;

  const onUploadPhoto = async (idx, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("files", f);
      fd.append("path", "/manuales");
      const r = await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = r.data?.saved?.[0]?.url;
      if (url) {
        updateItem(idx, { photo: url });
        toast.success("Imagen subida");
      } else {
        toast.error("La subida no retornó URL");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Error al subir imagen");
    } finally {
      // limpiar input para permitir re-upload del mismo archivo
      try { e.target.value = ""; } catch { /* noop */ }
    }
  };

  const submit = async () => {
    if (!customer.name.trim()) return toast.error("Falta nombre del cliente");
    const validItems = items.filter((it) => it.name.trim());
    if (!validItems.length) return toast.error("Agregá al menos un producto con nombre");

    setSaving(true);
    try {
      const itemsPayload = validItems.map((it) => ({
        name: it.name.trim(),
        code: it.code || null,
        qty: Number(it.qty) || 1,
        unit_price_pyg: Number(it.unit_price_pyg) || 0,
        is_manual: true,
        manual_cost_pyg: itemCostPyg(it),
        manual_description: it.manual_description || null,
        photo: it.photo || null,
      }));

      // Si el usuario puso un total y los items no tienen precio, distribuir el total entre los items
      // (para que cada item tenga un unit_price_pyg coherente y los reportes funcionen)
      if (overrideNum > 0) {
        const totalQty = itemsPayload.reduce((s, it) => s + it.qty, 0) || 1;
        const perUnit = overrideNum / totalQty;
        // solo override si NINGÚN item tenía precio (es decir, sumItemPrices === 0)
        if (sumItemPrices === 0) {
          itemsPayload.forEach((it) => { it.unit_price_pyg = Math.round(perUnit); });
        }
      }

      const payload = {
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim() || null,
        location: shipping.enabled ? "Envío" : (existing?.location || "Ciudad del Este"),
        notes: notes || null,
        source: existing?.source || "manual",
        shipping: shipping.enabled,
        shipping_cedula: shipping.enabled ? shipping.cedula || null : null,
        shipping_address: shipping.enabled ? shipping.address || null : null,
        shipping_carrier: shipping.enabled ? shipping.carrier || null : null,
        items: itemsPayload,
        // Si el total override es mayor al sum, lo enviamos como override
        manual_total_pyg: overrideNum > 0 ? overrideNum : null,
      };
      const r = isEdit
        ? await api.patch(`/orders/${existing.id}`, payload)
        : await api.post("/orders", payload);
      toast.success(isEdit ? "Pedido actualizado" : "Pedido manual creado");
      reset();
      onCreated?.(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Error al crear pedido");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar pedido" : "Nuevo pedido manual"} size="lg">
      <div className="space-y-5">
        {/* Cliente */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Nombre del cliente *</Label>
            <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} data-testid="mo-customer-name"/>
          </div>
          <div>
            <Label>Número de WhatsApp / teléfono</Label>
            <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="595981000000" data-testid="mo-customer-phone"/>
          </div>
        </div>

        {/* Envío */}
        <div className="border border-zinc-800 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-100 font-semibold cursor-pointer">
            <input type="checkbox" checked={shipping.enabled} onChange={(e) => setShipping({ ...shipping, enabled: e.target.checked })} data-testid="mo-shipping-toggle"/>
            📦 Envío (para fuera de CDE)
          </label>
          {shipping.enabled && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div>
                <Label>Cédula</Label>
                <Input value={shipping.cedula} onChange={(e) => setShipping({ ...shipping, cedula: e.target.value })} data-testid="mo-cedula"/>
              </div>
              <div>
                <Label>Transportadora</Label>
                <Input value={shipping.carrier} onChange={(e) => setShipping({ ...shipping, carrier: e.target.value })} placeholder="Ej: NSA, Encomiendas Express..." data-testid="mo-carrier"/>
              </div>
              <div className="sm:col-span-3">
                <Label>Dirección completa</Label>
                <Input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} data-testid="mo-address"/>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">
              Productos <span className="text-zinc-600 normal-case">· tasa: 1 USD = {formatPYG(rate)}</span>
            </div>
            <Btn variant="ghost" onClick={() => setItems((arr) => [...arr, blankItem()])} data-testid="mo-add-item">
              <Plus className="w-3 h-3 inline mr-1"/>Agregar producto
            </Btn>
          </div>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="border border-zinc-800 p-3 bg-zinc-950" data-testid={`mo-item-${i}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-zinc-300">Producto #{i + 1}</div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-rose-400 hover:text-rose-300" data-testid={`mo-remove-${i}`}>
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Nombre del producto *</Label>
                    <Input value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="Ej: Vestido floral SHEIN" data-testid={`mo-item-name-${i}`}/>
                  </div>
                  <div>
                    <Label>Código (opcional)</Label>
                    <Input value={it.code} onChange={(e) => updateItem(i, { code: e.target.value })} data-testid={`mo-item-code-${i}`}/>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input type="number" min="1" value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} data-testid={`mo-item-qty-${i}`}/>
                  </div>

                  {/* Costo con selector USD/PYG */}
                  <div className="sm:col-span-2">
                    <Label>Precio costo *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={it.manual_cost}
                        onChange={(e) => updateItem(i, { manual_cost: e.target.value })}
                        placeholder="0"
                        className="flex-1"
                        data-testid={`mo-item-cost-${i}`}
                      />
                      <div className="flex">
                        {["PYG", "USD"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateItem(i, { manual_cost_currency: c })}
                            className={`px-3 text-xs font-bold uppercase border ${
                              it.manual_cost_currency === c
                                ? "bg-nabi-500 text-white border-nabi-500"
                                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
                            }`}
                            data-testid={`mo-item-cost-curr-${i}-${c.toLowerCase()}`}
                          >
                            {c === "PYG" ? "₲" : "USD"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {it.manual_cost_currency === "USD" && Number(it.manual_cost) > 0 && (
                      <div className="text-[10px] text-zinc-500 mt-1">
                        ≈ {formatPYG(Number(it.manual_cost) * rate)} cada uno
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Precio venta unitario (opcional) <span className="text-zinc-500 normal-case">— dejar vacío si se vende por lote</span></Label>
                    <Input
                      type="number"
                      value={it.unit_price_pyg}
                      onChange={(e) => updateItem(i, { unit_price_pyg: e.target.value })}
                      placeholder="0"
                      data-testid={`mo-item-sale-${i}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Descripción / notas (opcional)</Label>
                    <Input value={it.manual_description} onChange={(e) => updateItem(i, { manual_description: e.target.value })} placeholder="Talle, color, observaciones..." data-testid={`mo-item-desc-${i}`}/>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Imagen de referencia</Label>
                    <div className="flex gap-2 items-start">
                      <div className="w-20 h-20 bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {it.photo ? <img src={fileUrl(it.photo)} alt="" className="w-full h-full object-cover"/> : <ShoppingBag className="w-6 h-6 text-zinc-600"/>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 cursor-pointer border border-nabi-700 px-2 py-1">
                          Subir del PC
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadPhoto(i, e)} data-testid={`mo-item-upload-${i}`}/>
                        </label>
                        <button type="button" onClick={() => setPickerForIdx(i)} className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 px-2 py-1 border border-nabi-700" data-testid={`mo-item-pick-${i}`}>
                          <FolderOpen className="w-3 h-3 inline mr-1"/>Archivos
                        </button>
                        {it.photo && (
                          <button onClick={() => updateItem(i, { photo: "" })} className="text-[10px] uppercase tracking-wider text-rose-400 hover:text-rose-300 px-2 py-1 border border-rose-800">
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Precio total del pedido (opcional - override) */}
        <div className="border border-nabi-700/40 bg-nabi-900/10 p-3">
          <Label>Precio venta TOTAL del pedido (opcional)</Label>
          <Input
            type="number"
            value={totalOverride}
            onChange={(e) => setTotalOverride(e.target.value)}
            placeholder="Si lo dejás vacío, se calcula sumando precios unitarios"
            data-testid="mo-total-override"
          />
          <div className="text-[11px] text-zinc-500 mt-1">
            Útil si vendés el lote completo por un único precio y no querés calcular el unitario.
          </div>
        </div>

        {/* Notas y resumen */}
        <div>
          <Label>Nota interna (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="mo-notes"/>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Total venta {overrideNum > 0 ? "(override)" : ""}</span>
            <span className="font-bold">{formatPYG(total)}</span>
          </div>
          <div className="flex justify-between"><span className="text-zinc-400">Costo total</span><span>{formatPYG(costTotal)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Ganancia</span><span className={`font-bold ${profitTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatPYG(profitTotal)}</span></div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit} disabled={saving} data-testid="mo-submit">{saving ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar cambios" : "Crear pedido")}</Btn>
        </div>
      </div>

      <FilePickerModal
        open={pickerForIdx !== null}
        onClose={() => setPickerForIdx(null)}
        onSelect={(urls) => {
          if (urls?.length && pickerForIdx !== null) updateItem(pickerForIdx, { photo: urls[0] });
          setPickerForIdx(null);
        }}
        multiple={false}
      />
    </Modal>
  );
}
