import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Card, Btn, Input, Label } from "./AdminUI";
import { DollarSign, Save, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ExchangeRatePanel() {
  const { settings, refreshSettings, refreshProducts } = useApp();
  const [rate, setRate] = useState(settings?.exchange_rate || 7800);
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp_number || "");
  const [businessName, setBusinessName] = useState(settings?.business_name || "");
  const [policies, setPolicies] = useState(settings?.policies_text || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setRate(settings.exchange_rate);
      setWhatsapp(settings.whatsapp_number || "");
      setBusinessName(settings.business_name || "");
      setPolicies(settings.policies_text || "");
    }
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", {
        exchange_rate: Number(rate),
        whatsapp_number: whatsapp,
        business_name: businessName,
        policies_text: policies,
      });
      await refreshSettings();
      await refreshProducts(true);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const sampleUsd = 20;
  const exampleProfit = 40;
  const sampleFinal = sampleUsd * (1 + exampleProfit / 100) * Number(rate);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader
        title="Tasa de cambio & ajustes"
        subtitle="Configurá la tasa USD→PYG manual. Se aplica automáticamente a todos los productos."
      />

      <Card className="p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-nabi-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">Tasa actual</div>
            <div className="font-display text-3xl font-black">₲ {Number(rate).toLocaleString("es-PY")} <span className="text-sm text-zinc-500">/ USD</span></div>
          </div>
        </div>
        <Label>Nueva tasa (PYG por 1 USD)</Label>
        <Input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="7800"
          data-testid="exchange-rate-input"
        />
        <div className="mt-3 text-xs text-zinc-500">
          Ejemplo: producto con costo USD ${sampleUsd} + {exampleProfit}% ganancia ≈ <strong>₲ {Math.round(sampleFinal / 1000) * 1000}</strong> (precio final al cliente).
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold">WhatsApp & Negocio</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Número WhatsApp (sin +)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="595986616939" data-testid="whatsapp-input" />
          </div>
          <div>
            <Label>Nombre del negocio</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="NABI MEN" data-testid="business-name-input" />
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-bold mb-3">Políticas (se muestran en el carrito)</h3>
        <textarea
          value={policies}
          onChange={(e) => setPolicies(e.target.value)}
          rows={6}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-nabi-500 outline-none px-3 py-2 text-sm text-zinc-100 transition"
          data-testid="policies-textarea"
        />
      </Card>

      <Btn onClick={save} disabled={saving} variant="success" data-testid="save-settings-btn">
        <Save className="w-3 h-3 inline mr-2" />
        {saving ? "Guardando..." : "Guardar todo"}
      </Btn>
    </div>
  );
}
