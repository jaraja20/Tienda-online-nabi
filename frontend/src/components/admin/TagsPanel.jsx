import React, { useState } from "react";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Btn, Input, Modal, Label, Card, Select } from "./AdminUI";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function TagsPanel() {
  const { tagGroups, tags, refreshTags } = useApp();
  const [editGroup, setEditGroup] = useState(null);
  const [editTag, setEditTag] = useState(null);

  const newGroup = () => setEditGroup({ name: "", display_type: "button" });
  const newTag = (gid) => setEditTag({ group_id: gid, value: "", color_hex: "" });

  const saveGroup = async () => {
    if (!editGroup.name.trim()) return toast.error("Nombre requerido");
    if (editGroup.id) await api.put(`/tag-groups/${editGroup.id}`, { name: editGroup.name, display_type: editGroup.display_type });
    else await api.post("/tag-groups", { name: editGroup.name, display_type: editGroup.display_type });
    await refreshTags();
    setEditGroup(null);
    toast.success("Guardado");
  };

  const delGroup = async (g) => {
    if (!window.confirm(`¿Eliminar grupo "${g.name}" y todas sus etiquetas?`)) return;
    await api.delete(`/tag-groups/${g.id}`);
    await refreshTags();
    toast.success("Eliminado");
  };

  const saveTag = async () => {
    if (!editTag.value.trim()) return toast.error("Valor requerido");
    const body = { group_id: editTag.group_id, value: editTag.value, color_hex: editTag.color_hex || null };
    if (editTag.id) await api.put(`/tags/${editTag.id}`, body);
    else await api.post("/tags", body);
    await refreshTags();
    setEditTag(null);
    toast.success("Guardado");
  };

  const delTag = async (t) => {
    if (!window.confirm(`¿Eliminar etiqueta "${t.value}"?`)) return;
    await api.delete(`/tags/${t.id}`);
    await refreshTags();
    toast.success("Eliminada");
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Etiquetas"
        subtitle="Agrupá las propiedades de los productos: talles, colores, estilos, etc."
        actions={<Btn onClick={newGroup} data-testid="new-tag-group-btn"><Plus className="w-3 h-3 inline mr-1"/>Nuevo grupo</Btn>}
      />

      <div className="space-y-4">
        {tagGroups.map((g) => (
          <Card key={g.id} className="p-5" data-testid={`tag-group-${g.id}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  {g.name}
                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 border border-zinc-700 px-2 py-0.5">
                    {g.display_type === "button" ? "Botón" : "Tag"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditGroup({ ...g })} className="text-zinc-400 hover:text-white p-1.5" data-testid={`edit-group-${g.id}`}><Pencil className="w-4 h-4"/></button>
                <button onClick={() => delGroup(g)} className="text-zinc-400 hover:text-rose-400 p-1.5" data-testid={`delete-group-${g.id}`}><Trash2 className="w-4 h-4"/></button>
                <Btn variant="ghost" onClick={() => newTag(g.id)} data-testid={`new-tag-${g.id}`}><Plus className="w-3 h-3 inline mr-1"/>Etiqueta</Btn>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.filter((t) => t.group_id === g.id).map((t) => (
                <div key={t.id} className="group inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 pl-3 pr-1 py-1 text-xs" data-testid={`tag-chip-${t.id}`}>
                  {t.color_hex && <span className="w-3 h-3 rounded-full border border-zinc-600" style={{ background: t.color_hex }} />}
                  <span className="font-semibold">{t.value}</span>
                  <button onClick={() => setEditTag({ ...t })} className="ml-1 text-zinc-500 hover:text-white p-1" data-testid={`edit-tag-${t.id}`}><Pencil className="w-3 h-3"/></button>
                  <button onClick={() => delTag(t)} className="text-zinc-500 hover:text-rose-400 p-1" data-testid={`delete-tag-${t.id}`}><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {tags.filter((t) => t.group_id === g.id).length === 0 && (
                <span className="text-xs text-zinc-500 italic">Sin etiquetas aún</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title={editGroup?.id ? "Editar grupo" : "Nuevo grupo"} size="sm">
        {editGroup && (
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={editGroup.name} onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })} placeholder="Ej: Talle, Color, Estilo" data-testid="group-name-input"/></div>
            <div>
              <Label>Tipo de visualización</Label>
              <Select value={editGroup.display_type} onChange={(e) => setEditGroup({ ...editGroup, display_type: e.target.value })} data-testid="group-display-type-select">
                <option value="button">Botón (Talle)</option>
                <option value="tag">Tag con color (Color/Estilo)</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setEditGroup(null)}>Cancelar</Btn>
              <Btn onClick={saveGroup} data-testid="save-group-btn">Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editTag} onClose={() => setEditTag(null)} title={editTag?.id ? "Editar etiqueta" : "Nueva etiqueta"} size="sm">
        {editTag && (
          <div className="space-y-4">
            <div><Label>Valor *</Label><Input value={editTag.value} onChange={(e) => setEditTag({ ...editTag, value: e.target.value })} placeholder="Ej: M, Negro, Casual" data-testid="tag-value-input"/></div>
            <div>
              <Label>Color (opcional, solo para grupos tipo tag)</Label>
              <div className="flex gap-2">
                <input type="color" value={editTag.color_hex || "#000000"} onChange={(e) => setEditTag({ ...editTag, color_hex: e.target.value })} className="w-12 h-10 bg-zinc-900 border border-zinc-800" data-testid="tag-color-input"/>
                <Input value={editTag.color_hex || ""} onChange={(e) => setEditTag({ ...editTag, color_hex: e.target.value })} placeholder="#000000 (opcional)"/>
                {editTag.color_hex && <Btn variant="ghost" onClick={() => setEditTag({ ...editTag, color_hex: "" })}>Sin color</Btn>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setEditTag(null)}>Cancelar</Btn>
              <Btn onClick={saveTag} data-testid="save-tag-btn">Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
