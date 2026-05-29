import React, { useState, useMemo } from "react";
import { api, fileUrl } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Btn, Input, Modal, Label, Card } from "./AdminUI";
import FilePickerModal from "./FilePickerModal";
import { Plus, Trash2, Pencil, FolderOpen, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";

const SLOTS = [
  { key: "main", label: "Cuadro principal (grande izquierda)", help: "El cuadro grande con título grande y subtítulo en color." },
  { key: "side_top", label: "Cuadro superior derecho", help: "El cuadro negro con logo + descripción corta." },
  { key: "side_bottom", label: "Cuadro inferior derecho", help: "El cuadro chico con eyebrow + título." },
];

export default function EventsPanel() {
  const { heroEvents, refreshHeroEvents } = useApp();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const grouped = useMemo(() => {
    const g = { main: [], side_top: [], side_bottom: [] };
    (heroEvents || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((e) => { if (g[e.slot]) g[e.slot].push(e); });
    return g;
  }, [heroEvents]);

  const openNew = (slot) => {
    setEditing({
      slot,
      image_url: "",
      eyebrow: "",
      title: "",
      subtitle: "",
      description: "",
      order: (grouped[slot]?.length || 0) + 1,
      active: true,
    });
    setShowForm(true);
  };
  const openEdit = (e) => { setEditing({ ...e }); setShowForm(true); };

  const save = async () => {
    try {
      const body = {
        slot: editing.slot,
        image_url: editing.image_url || null,
        eyebrow: editing.eyebrow || "",
        title: editing.title || "",
        subtitle: editing.subtitle || "",
        description: editing.description || "",
        order: Number(editing.order) || 0,
        active: editing.active !== false,
      };
      if (editing.id) await api.put(`/hero-events/${editing.id}`, body);
      else await api.post("/hero-events", body);
      toast.success("Guardado");
      await refreshHeroEvents();
      setShowForm(false);
    } catch { toast.error("Error al guardar"); }
  };

  const del = async (e) => {
    if (!window.confirm(`¿Eliminar evento "${e.title || "sin título"}"?`)) return;
    await api.delete(`/hero-events/${e.id}`);
    await refreshHeroEvents();
    toast.success("Eliminado");
  };

  const toggleActive = async (e) => {
    await api.put(`/hero-events/${e.id}`, {
      slot: e.slot,
      image_url: e.image_url,
      eyebrow: e.eyebrow, title: e.title, subtitle: e.subtitle, description: e.description,
      order: e.order, active: !e.active,
    });
    await refreshHeroEvents();
  };

  const move = async (e, dir) => {
    const list = grouped[e.slot];
    const idx = list.findIndex((x) => x.id === e.id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= list.length) return;
    const other = list[swap];
    await Promise.all([
      api.put(`/hero-events/${e.id}`, { slot: e.slot, image_url: e.image_url, eyebrow: e.eyebrow, title: e.title, subtitle: e.subtitle, description: e.description, order: other.order, active: e.active }),
      api.put(`/hero-events/${other.id}`, { slot: other.slot, image_url: other.image_url, eyebrow: other.eyebrow, title: other.title, subtitle: other.subtitle, description: other.description, order: e.order, active: other.active }),
    ]);
    await refreshHeroEvents();
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      <PageHeader
        title="Eventos del Home"
        subtitle="Editá los 3 cuadros del hero. Cada cuadro acepta múltiples eventos que rotan automáticamente."
      />

      <div className="space-y-6">
        {SLOTS.map(({ key, label, help }) => (
          <Card key={key}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-zinc-100">{label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{help}</div>
              </div>
              <Btn onClick={() => openNew(key)} data-testid={`new-event-${key}-btn`}>
                <Plus className="w-3 h-3 inline mr-1" /> Nuevo evento
              </Btn>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {grouped[key].length === 0 && (
                <div className="p-6 text-center text-zinc-500 text-sm">
                  Sin eventos. Tocá "Nuevo evento" para crear el primero.
                </div>
              )}
              {grouped[key].map((e, i) => (
                <div key={e.id} className="p-3 flex items-center gap-3" data-testid={`event-row-${e.id}`}>
                  <div className="flex flex-col">
                    <button onClick={() => move(e, "up")} disabled={i === 0} className="text-zinc-500 hover:text-white disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => move(e, "down")} disabled={i === grouped[key].length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <div className="w-16 h-16 bg-zinc-800 shrink-0 overflow-hidden">
                    {e.image_url && <img src={fileUrl(e.image_url)} alt="" className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-nabi-400 truncate">{e.eyebrow || "—"}</div>
                    <div className="font-bold text-sm text-zinc-100 truncate">{e.title || "(sin título)"}</div>
                    <div className="text-xs text-zinc-500 truncate">{e.subtitle || e.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(e)} title={e.active ? "Desactivar" : "Activar"} className={`p-1.5 ${e.active ? "text-emerald-400" : "text-zinc-600"}`} data-testid={`event-toggle-${e.id}`}>
                      {e.active ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                    </button>
                    <button onClick={() => openEdit(e)} className="p-1.5 text-zinc-400 hover:text-white" data-testid={`event-edit-${e.id}`}><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => del(e)} className="p-1.5 text-zinc-400 hover:text-rose-400" data-testid={`event-delete-${e.id}`}><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing?.id ? "Editar evento" : "Nuevo evento"} size="md">
        {editing && (
          <div className="space-y-4">
            <div>
              <Label>Cuadro</Label>
              <select
                value={editing.slot}
                onChange={(e) => setEditing({ ...editing, slot: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                data-testid="event-slot-select"
              >
                {SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <Label>Imagen</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={editing.image_url || ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  placeholder="/api/uploads/... o URL completa"
                  data-testid="event-image-input"
                />
                <Btn variant="ghost" onClick={() => setPickerOpen(true)} data-testid="event-pick-img-btn">
                  <FolderOpen className="w-3 h-3 inline mr-1"/> Elegir
                </Btn>
              </div>
              {editing.image_url && (
                <div className="mt-2 w-32 h-32 bg-zinc-800 overflow-hidden">
                  <img src={fileUrl(editing.image_url)} alt="" className="w-full h-full object-cover"/>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eyebrow (texto chico arriba)</Label>
                <Input value={editing.eyebrow || ""} onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })} placeholder="Ej: Drop · Streetwear" data-testid="event-eyebrow"/>
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: e.target.value })} data-testid="event-order"/>
              </div>
            </div>

            <div>
              <Label>Título</Label>
              <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Pedí tu Shein." data-testid="event-title"/>
            </div>

            <div>
              <Label>Subtítulo (texto en color, opcional)</Label>
              <Input value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Recibí estilo en CDE." data-testid="event-subtitle"/>
            </div>

            <div>
              <Label>Descripción</Label>
              <textarea
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                data-testid="event-description"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                data-testid="event-active"
              />
              Activo (visible en la tienda)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn onClick={save} data-testid="save-event-btn">Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <FilePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(urls) => {
          if (urls?.length) setEditing((s) => ({ ...s, image_url: urls[0] }));
          setPickerOpen(false);
        }}
        multiple={false}
      />
    </div>
  );
}
