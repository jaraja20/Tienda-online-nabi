import React, { useEffect, useState, useMemo } from "react";
import { api, fileUrl } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Btn, Input, Select, Label, Card, Modal, Textarea } from "./AdminUI";
import { formatPYG } from "../../lib/utils";
import { Plus, Trash2, Pencil, Image as ImageIcon, X, Upload, Star, StarOff } from "lucide-react";
import toast from "react-hot-toast";

const blank = () => ({
  name: "", description: "", code: "", category_id: null, brand: "",
  cost_usd: 0, profit_pct: 40, photos: [], tag_ids: [], variants: [],
  featured: false, active: true,
});

export default function ProductsPanel() {
  const { categories, tagGroups, tags, rate, refreshProducts } = useApp();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const r = await api.get("/products", { params: { admin: true } });
    setItems(r.data.items);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    if (catFilter && p.category_id !== catFilter) return false;
    if (q && !`${p.name} ${p.code} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, q, catFilter]);

  const onSave = async (data) => {
    try {
      const body = {
        ...data,
        cost_usd: Number(data.cost_usd),
        profit_pct: Number(data.profit_pct),
        category_id: data.category_id || null,
      };
      if (data.id) await api.put(`/products/${data.id}`, body);
      else await api.post("/products", body);
      toast.success("Guardado");
      await load();
      await refreshProducts(true);
      setEditing(null);
    } catch (e) {
      toast.error("Error al guardar");
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    await load();
    await refreshProducts(true);
    toast.success("Eliminado");
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Productos"
        subtitle={`${items.length} productos · tasa ₲ ${rate.toLocaleString("es-PY")}/USD`}
        actions={<Btn onClick={() => setEditing(blank())} data-testid="new-product-btn"><Plus className="w-3 h-3 inline mr-1"/>Nuevo producto</Btn>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código, marca…" className="max-w-sm" data-testid="product-search"/>
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="max-w-xs" data-testid="product-cat-filter">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="text-left p-3">Foto</th>
              <th className="text-left p-3">Producto</th>
              <th className="text-left p-3">Categoría</th>
              <th className="text-right p-3">Costo USD</th>
              <th className="text-right p-3">Ganancia %</th>
              <th className="text-right p-3">Precio PYG</th>
              <th className="text-center p-3">Estado</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30" data-testid={`product-row-${p.id}`}>
                  <td className="p-3">
                    <div className="w-12 h-14 bg-zinc-800 overflow-hidden">
                      {p.photos?.[0] && <img src={fileUrl(p.photos[0])} alt="" className="w-full h-full object-cover"/>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold flex items-center gap-2">
                      {p.featured && <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>}
                      {p.name}
                    </div>
                    <div className="text-xs text-zinc-500">{p.code} {p.brand && `· ${p.brand}`}</div>
                  </td>
                  <td className="p-3 text-zinc-400">{cat?.name || "—"}</td>
                  <td className="p-3 text-right text-zinc-300">${p.cost_usd}</td>
                  <td className="p-3 text-right text-zinc-300">{p.profit_pct}%</td>
                  <td className="p-3 text-right font-bold">{formatPYG(p.price_pyg)}</td>
                  <td className="p-3 text-center">
                    {p.active ? (
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5">Activo</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider bg-zinc-700 text-zinc-400 px-2 py-0.5">Oculto</span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing({ ...p })} className="text-zinc-400 hover:text-white p-1.5" data-testid={`edit-product-${p.id}`}><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(p)} className="text-zinc-400 hover:text-rose-400 p-1.5" data-testid={`delete-product-${p.id}`}><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td className="p-10 text-center text-zinc-500" colSpan={8}>Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          tagGroups={tagGroups}
          tags={tags}
          rate={rate}
          onClose={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, tagGroups, tags, rate, onClose, onSave }) {
  const [d, setD] = useState({
    ...product,
    photos: [...(product.photos || [])],
    tag_ids: [...(product.tag_ids || [])],
    variants: (product.variants || []).map((v) => ({ ...v, photos: [...(v.photos || [])], tag_ids: [...(v.tag_ids || [])] })),
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const computedPrice = Number(d.cost_usd) * (1 + Number(d.profit_pct) / 100) * rate;
  const computedPriceRounded = Math.round(computedPrice / 1000) * 1000;

  const toggleTag = (tagId) => {
    setD((s) => ({ ...s, tag_ids: s.tag_ids.includes(tagId) ? s.tag_ids.filter((x) => x !== tagId) : [...s.tag_ids, tagId] }));
  };
  const addPhotoUrl = () => {
    if (!photoUrl.trim()) return;
    setD((s) => ({ ...s, photos: [...s.photos, photoUrl.trim()] }));
    setPhotoUrl("");
  };
  const removePhoto = (idx) => setD((s) => ({ ...s, photos: s.photos.filter((_, i) => i !== idx) }));
  const movePhotoUp = (idx) => setD((s) => {
    if (idx === 0) return s;
    const arr = [...s.photos];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    return { ...s, photos: arr };
  });

  const uploadFiles = async (files, targetSetter) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      fd.append("path", "/productos");
      const r = await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const urls = (r.data.saved || []).map((s) => s.url).filter(Boolean);
      targetSetter(urls);
      toast.success(`${urls.length} foto(s) subida(s)`);
    } catch {
      toast.error("Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const onUploadMain = (e) => uploadFiles(e.target.files, (urls) => setD((s) => ({ ...s, photos: [...s.photos, ...urls] })));

  const addVariant = () => setD((s) => ({ ...s, variants: [...s.variants, { id: null, tag_ids: [], photos: [], label: "" }] }));
  const removeVariant = (idx) => setD((s) => ({ ...s, variants: s.variants.filter((_, i) => i !== idx) }));
  const updateVariant = (idx, patch) => setD((s) => {
    const next = [...s.variants];
    next[idx] = { ...next[idx], ...patch };
    return { ...s, variants: next };
  });
  const toggleVariantTag = (idx, tagId) => setD((s) => {
    const next = [...s.variants];
    const cur = next[idx].tag_ids || [];
    next[idx] = { ...next[idx], tag_ids: cur.includes(tagId) ? cur.filter((x) => x !== tagId) : [...cur, tagId] };
    return { ...s, variants: next };
  });
  const onUploadVariant = (idx, e) => uploadFiles(e.target.files, (urls) => updateVariant(idx, { photos: [...(d.variants[idx].photos || []), ...urls] }));
  const addVariantUrl = (idx, url) => {
    if (!url.trim()) return;
    updateVariant(idx, { photos: [...(d.variants[idx].photos || []), url.trim()] });
  };

  return (
    <Modal open onClose={onClose} title={d.id ? "Editar producto" : "Nuevo producto"} size="xl">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: basic */}
        <div className="space-y-4">
          <div><Label>Nombre *</Label><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} data-testid="prod-name"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Código / SKU</Label><Input value={d.code || ""} onChange={(e) => setD({ ...d, code: e.target.value })} placeholder="NM-XX-001" data-testid="prod-code"/></div>
            <div><Label>Marca</Label><Input value={d.brand || ""} onChange={(e) => setD({ ...d, brand: e.target.value })} data-testid="prod-brand"/></div>
          </div>
          <div><Label>Categoría</Label>
            <Select value={d.category_id || ""} onChange={(e) => setD({ ...d, category_id: e.target.value || null })} data-testid="prod-category">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div><Label>Descripción</Label><Textarea rows={4} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} data-testid="prod-description"/></div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Costo USD *</Label><Input type="number" step="0.01" value={d.cost_usd} onChange={(e) => setD({ ...d, cost_usd: e.target.value })} data-testid="prod-cost-usd"/></div>
            <div><Label>Ganancia %</Label><Input type="number" step="1" value={d.profit_pct} onChange={(e) => setD({ ...d, profit_pct: e.target.value })} data-testid="prod-profit-pct"/></div>
            <div>
              <Label>Precio final (PYG)</Label>
              <div className="bg-nabi-900/30 border border-nabi-700 px-3 py-2 text-sm font-bold text-nabi-200" data-testid="prod-final-price">{formatPYG(computedPriceRounded)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm" data-testid="prod-featured-label">
              <input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} data-testid="prod-featured-checkbox"/>
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} data-testid="prod-active-checkbox"/>
              Activo (visible en tienda)
            </label>
          </div>

          <div>
            <Label>Etiquetas disponibles (talles, colores, estilo)</Label>
            <div className="space-y-3 max-h-60 overflow-y-auto dark-scroll pr-1">
              {tagGroups.map((g) => (
                <div key={g.id}>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">{g.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.filter((t) => t.group_id === g.id).map((t) => {
                      const on = d.tag_ids.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.id)}
                          className={`text-[11px] px-2.5 py-1 border ${on ? "bg-nabi-600 border-nabi-600 text-white" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                          data-testid={`toggle-tag-${t.id}`}
                        >
                          {t.color_hex && <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: t.color_hex }}/>}
                          {t.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: photos + variants */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Fotos principales</Label>
              <label className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 cursor-pointer">
                <Upload className="w-3 h-3 inline mr-1"/>Subir
                <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadMain} data-testid="upload-main-photos"/>
              </label>
            </div>
            <div className="flex gap-2 mb-2">
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="O pegá URL..." data-testid="photo-url-input"/>
              <Btn variant="secondary" onClick={addPhotoUrl} data-testid="add-photo-url-btn">Agregar</Btn>
            </div>
            {uploading && <div className="text-xs text-nabi-300 mb-2">Subiendo...</div>}
            <div className="grid grid-cols-4 gap-2">
              {d.photos.map((p, i) => (
                <div key={i} className="relative group aspect-square bg-zinc-800 overflow-hidden">
                  <img src={fileUrl(p)} alt="" className="w-full h-full object-cover"/>
                  {i === 0 && <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold px-1">PORTADA</span>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                    {i > 0 && <button onClick={() => movePhotoUp(i)} className="text-white bg-nabi-600 px-1.5 py-0.5 text-[10px]" data-testid={`photo-up-${i}`}>↑</button>}
                    <button onClick={() => removePhoto(i)} className="text-white bg-rose-600 p-1" data-testid={`photo-remove-${i}`}><X className="w-3 h-3"/></button>
                  </div>
                </div>
              ))}
              {d.photos.length === 0 && (
                <div className="col-span-4 border-2 border-dashed border-zinc-800 p-6 text-center text-zinc-500 text-xs">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-zinc-700"/>
                  Sin fotos. Subí o pegá URL.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Variantes (combinaciones específicas con sus propias fotos)</Label>
              <Btn variant="ghost" onClick={addVariant} data-testid="add-variant-btn"><Plus className="w-3 h-3 inline mr-1"/>Variante</Btn>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto dark-scroll pr-1">
              {d.variants.map((v, idx) => (
                <Card key={idx} className="p-3" data-testid={`variant-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-zinc-300">Variante #{idx + 1}</div>
                    <button onClick={() => removeVariant(idx)} className="text-rose-400 hover:text-rose-300" data-testid={`variant-remove-${idx}`}><Trash2 className="w-3 h-3"/></button>
                  </div>
                  <Input value={v.label || ""} onChange={(e) => updateVariant(idx, { label: e.target.value })} placeholder="Etiqueta libre (opcional, ej: 'Talla M / Negro')" className="mb-2" data-testid={`variant-label-${idx}`}/>
                  <div className="mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Tags de esta variante</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tagGroups.map((g) => (
                        <div key={g.id} className="flex flex-wrap gap-1 items-center mr-2">
                          <span className="text-[10px] text-zinc-500">{g.name}:</span>
                          {tags.filter((t) => t.group_id === g.id).map((t) => {
                            const on = (v.tag_ids || []).includes(t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => toggleVariantTag(idx, t.id)}
                                className={`text-[10px] px-2 py-0.5 border ${on ? "bg-nabi-600 border-nabi-600 text-white" : "border-zinc-700 text-zinc-400"}`}
                                data-testid={`variant-${idx}-tag-${t.id}`}
                              >
                                {t.value}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Fotos específicas de esta variante</div>
                    <div className="flex gap-2 mb-2">
                      <label className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 cursor-pointer flex items-center">
                        <Upload className="w-3 h-3 inline mr-1"/>Subir
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUploadVariant(idx, e)} data-testid={`variant-${idx}-upload`}/>
                      </label>
                      <Input placeholder="O URL..." onKeyDown={(e) => { if (e.key === "Enter") { addVariantUrl(idx, e.currentTarget.value); e.currentTarget.value = ""; }}} data-testid={`variant-${idx}-url-input`}/>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {(v.photos || []).map((p, pi) => (
                        <div key={pi} className="relative aspect-square bg-zinc-800">
                          <img src={fileUrl(p)} alt="" className="w-full h-full object-cover"/>
                          <button onClick={() => updateVariant(idx, { photos: v.photos.filter((_, i) => i !== pi) })} className="absolute top-0 right-0 bg-rose-600 p-0.5" data-testid={`variant-${idx}-photo-remove-${pi}`}><X className="w-2.5 h-2.5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
              {d.variants.length === 0 && (
                <div className="text-xs text-zinc-500 italic border border-dashed border-zinc-800 p-4 text-center">
                  Sin variantes. Las variantes permiten asignar fotos específicas a combinaciones de tags (ej: Talla M en color Azul).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-800">
        <Btn variant="ghost" onClick={onClose} data-testid="cancel-product-btn">Cancelar</Btn>
        <Btn onClick={() => onSave(d)} data-testid="save-product-btn">Guardar producto</Btn>
      </div>
    </Modal>
  );
}
