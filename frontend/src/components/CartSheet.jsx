import React, { useState } from "react";
import { X, Trash2, Plus, Minus, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatPYG } from "../lib/utils";
import { api, fileUrl } from "../lib/api";
import toast from "react-hot-toast";

export default function CartSheet({ open, onClose }) {
  const { cart, updateCartQty, removeFromCart, clearCart, settings } = useApp();
  const [stage, setStage] = useState("cart"); // cart | form
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    location: "Ciudad del Este",
    location_other: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((a, b) => a + b.qty * b.unit_price_pyg, 0);
  const wsNumber = settings?.whatsapp_number || "595986616939";

  const handleCheckout = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Ingresá tu nombre");
      return;
    }
    setSubmitting(true);
    const finalLocation = form.location === "Otra" ? (form.location_other || "Otra ciudad") : form.location;
    try {
      const r = await api.post("/orders", {
        items: cart.map((c) => ({
          product_id: c.product_id,
          name: c.name,
          code: c.code,
          variant_label: c.variant_label,
          qty: c.qty,
          unit_price_pyg: c.unit_price_pyg,
          photo: c.photo,
        })),
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        location: finalLocation,
        notes: form.notes.trim(),
      });
      const orderId = r.data.id;
      // Build WhatsApp message
      const lines = [];
      lines.push(`*Pedido NABI MEN - ${orderId.slice(0, 8).toUpperCase()}*`);
      lines.push(`Cliente: ${form.customer_name}`);
      if (form.customer_phone) lines.push(`Teléfono: ${form.customer_phone}`);
      lines.push(`Entrega: ${finalLocation}`);
      lines.push("");
      lines.push("*Productos:*");
      cart.forEach((c, i) => {
        lines.push(
          `${i + 1}. ${c.name}${c.code ? ` (${c.code})` : ""}${c.variant_label ? ` — ${c.variant_label}` : ""}`
        );
        lines.push(`   x${c.qty} · ${formatPYG(c.unit_price_pyg * c.qty)}`);
      });
      lines.push("");
      lines.push(`*Total: ${formatPYG(subtotal)}*`);
      if (form.notes) {
        lines.push("");
        lines.push(`_Notas:_ ${form.notes}`);
      }
      lines.push("");
      lines.push("Confirmo el pedido y entiendo las políticas (50% seña, 2–3 semanas, flete a calcular al arribo).");
      const msg = encodeURIComponent(lines.join("\n"));
      const url = `https://wa.me/${wsNumber}?text=${msg}`;
      window.open(url, "_blank");
      clearCart();
      setStage("cart");
      setForm({ customer_name: "", customer_phone: "", location: "Ciudad del Este", location_other: "", notes: "" });
      onClose();
      toast.success("Pedido creado. Abrimos WhatsApp.");
    } catch (e) {
      toast.error("Error al crear el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      data-testid="cart-sheet"
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h3 className="font-display font-bold text-lg tracking-tight">
            {stage === "cart" ? "Tu carrito" : "Datos del pedido"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100" data-testid="close-cart-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {stage === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 && (
                <div className="text-center text-zinc-500 py-12">
                  <p className="font-semibold">Tu carrito está vacío</p>
                  <p className="text-xs mt-1">Agregá productos para continuar</p>
                </div>
              )}
              {cart.map((c, idx) => (
                <div key={idx} className="flex gap-3" data-testid={`cart-item-${idx}`}>
                  <div className="w-20 h-24 bg-zinc-100 shrink-0">
                    {c.photo && <img src={fileUrl(c.photo)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold line-clamp-2">{c.name}</div>
                    {c.variant_label && (
                      <div className="text-xs text-zinc-500 mt-0.5">{c.variant_label}</div>
                    )}
                    <div className="text-xs font-bold text-ink mt-1">{formatPYG(c.unit_price_pyg)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex border border-zinc-300 text-xs">
                        <button onClick={() => updateCartQty(idx, c.qty - 1)} className="px-2 py-1 hover:bg-zinc-100" data-testid={`cart-minus-${idx}`}><Minus className="w-3 h-3"/></button>
                        <span className="px-3 py-1 border-x border-zinc-300 min-w-[2rem] text-center">{c.qty}</span>
                        <button onClick={() => updateCartQty(idx, c.qty + 1)} className="px-2 py-1 hover:bg-zinc-100" data-testid={`cart-plus-${idx}`}><Plus className="w-3 h-3"/></button>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="ml-auto text-zinc-400 hover:text-rose-600 p-1" data-testid={`cart-remove-${idx}`}>
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {settings?.policies_text && cart.length > 0 && (
                <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed whitespace-pre-wrap" data-testid="cart-policies">
                  {settings.policies_text}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200 p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.18em] font-bold text-zinc-600">Subtotal</span>
                <span className="font-display text-2xl font-black" data-testid="cart-subtotal">{formatPYG(subtotal)}</span>
              </div>
              <div className="text-[11px] text-zinc-500">El flete se calcula al arribo según peso del pedido.</div>
              <button
                disabled={cart.length === 0}
                onClick={() => setStage("form")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white font-bold uppercase tracking-[0.18em] text-xs py-4 flex items-center justify-center gap-2 transition"
                data-testid="checkout-btn"
              >
                <MessageCircle className="w-4 h-4" />
                Continuar a WhatsApp
              </button>
            </div>
          </>
        )}

        {stage === "form" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Field label="Nombre completo *" testid="form-name">
                <input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="input"
                  placeholder="Ej: Juan Pérez"
                  data-testid="form-name-input"
                />
              </Field>
              <Field label="Teléfono / WhatsApp (opcional)" testid="form-phone">
                <input
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="input"
                  placeholder="+595..."
                  data-testid="form-phone-input"
                />
              </Field>
              <Field label="Ubicación de entrega" testid="form-location">
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input"
                  data-testid="form-location-select"
                >
                  <option>Ciudad del Este</option>
                  <option>Asunción</option>
                  <option>Encarnación</option>
                  <option>San Lorenzo</option>
                  <option>Otra</option>
                </select>
              </Field>
              {form.location === "Otra" && (
                <Field label="Especificar ciudad" testid="form-location-other">
                  <input
                    value={form.location_other}
                    onChange={(e) => setForm({ ...form, location_other: e.target.value })}
                    className="input"
                    placeholder="Ciudad"
                    data-testid="form-location-other-input"
                  />
                </Field>
              )}
              <Field label="Notas adicionales (opcional)" testid="form-notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Comentarios sobre el pedido"
                  data-testid="form-notes-input"
                />
              </Field>

              <div className="bg-zinc-50 border border-zinc-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-2">Resumen</div>
                <div className="text-xs text-zinc-700 space-y-1">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate mr-2">{c.qty}× {c.name}</span>
                      <span className="font-semibold">{formatPYG(c.qty * c.unit_price_pyg)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatPYG(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-200 p-5 flex gap-2">
              <button onClick={() => setStage("cart")} className="px-4 py-3 border border-zinc-300 text-xs uppercase font-bold tracking-[0.18em] hover:bg-zinc-100" data-testid="back-to-cart-btn">
                Volver
              </button>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white font-bold uppercase tracking-[0.18em] text-xs py-3 flex items-center justify-center gap-2"
                data-testid="confirm-whatsapp-btn"
              >
                <MessageCircle className="w-4 h-4" />
                {submitting ? "Procesando..." : "Confirmar y abrir WhatsApp"}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d4d4d8;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #4338ca; box-shadow: 0 0 0 3px rgba(67,56,202,0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-600 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
