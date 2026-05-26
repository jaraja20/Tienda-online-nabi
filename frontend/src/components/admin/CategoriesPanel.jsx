import React, { useState } from "react";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Btn, Input, Modal, Label, Card } from "./AdminUI";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function CategoriesPanel() {
  const { categories, refreshCategories } = useApp();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const openNew = () => { setEditing({ name: "", icon: "", order: categories.length + 1 }); setShowForm(true); };
  const openEdit = (c) => { setEditing({ ...c }); setShowForm(true); };

  const save = async () => {
    if (!editing.name.trim()) return toast.error("Nombre requerido");
    try {
      const body = { name: editing.name, icon: editing.icon || null, order: Number(editing.order) || 0 };
      if (editing.id) await api.put(`/categories/${editing.id}`, body);
      else await api.post("/categories", body);
      toast.success("Guardado");
      await refreshCategories();
      setShowForm(false);
    } catch { toast.error("Error"); }
  };

  const del = async (c) => {
    if (!window.confirm(`¿Eliminar categoría "${c.name}"?`)) return;
    await api.delete(`/categories/${c.id}`);
    await refreshCategories();
    toast.success("Eliminada");
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader
        title="Categorías"
        subtitle="Organizá tus productos por tipo (championes, remeras, relojes…)."
        actions={<Btn onClick={openNew} data-testid="new-category-btn"><Plus className="w-3 h-3 inline mr-1" />Nueva categoría</Btn>}
      />

      <Card>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Orden</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30" data-testid={`category-row-${c.id}`}>
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 text-zinc-500">{c.slug}</td>
                <td className="p-3 text-zinc-500">{c.order}</td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(c)} className="text-zinc-400 hover:text-white p-1.5" data-testid={`edit-cat-${c.id}`}><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => del(c)} className="text-zinc-400 hover:text-rose-400 p-1.5" data-testid={`delete-cat-${c.id}`}><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td className="p-6 text-center text-zinc-500" colSpan={4}>Sin categorías</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing?.id ? "Editar categoría" : "Nueva categoría"} size="sm">
        {editing && (
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="cat-name-input"/>
            </div>
            <div>
              <Label>Ícono (opcional, nombre lucide)</Label>
              <Input value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Shirt, Watch, Footprints..." data-testid="cat-icon-input"/>
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: e.target.value })} data-testid="cat-order-input"/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn onClick={save} data-testid="save-cat-btn">Guardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
