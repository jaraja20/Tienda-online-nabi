import React, { useEffect, useState, useMemo, useRef } from "react";
import { api, fileUrl } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import { PageHeader, Btn, Input, Select, Label, Card, Modal, Textarea } from "./AdminUI";
import FilePickerModal from "./FilePickerModal";
import { formatPYG } from "../../lib/utils";
import { Plus, Trash2, Pencil, Image as ImageIcon, X, Upload, Star, FolderInput, FolderOpen } from "lucide-react";
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
  const [showImport, setShowImport] = useState(false);

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
        actions={
          <>
            <Btn variant="ghost" onClick={() => setShowImport(true)} data-testid="bulk-import-btn">
              <FolderInput className="w-3 h-3 inline mr-1"/>Importar desde carpeta
            </Btn>
            <Btn onClick={() => setEditing(blank())} data-testid="new-product-btn">
              <Plus className="w-3 h-3 inline mr-1"/>Nuevo producto
            </Btn>
          </>
        }
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

      {showImport && (
        <ImportFromFolderModal
          categories={categories}
          onClose={() => setShowImport(false)}
          onDone={async () => { setShowImport(false); await load(); await refreshProducts(true); }}
        />
      )}
    </div>
  );
}

function ImportFromFolderModal({ categories, onClose, onDone }) {
  const [folderPath, setFolderPath] = useState("/Nabimen");
  const [useSubfolder, setUseSubfolder] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [cost, setCost] = useState(15);
  const [profit, setProfit] = useState(45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("folder_path", folderPath);
      fd.append("use_subfolder_as_category", useSubfolder ? "true" : "false");
      if (!useSubfolder && categoryId) fd.append("category_id", categoryId);
      fd.append("default_cost_usd", String(cost));
      fd.append("default_profit_pct", String(profit));
      const r = await api.post("/products/import-from-folder", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data);
      toast.success(`${r.data.count} producto(s) importado(s)`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Importar productos desde carpeta" size="md">
      <p className="text-sm text-zinc-400 mb-4">
        Recorre la estructura de carpetas en <code className="text-nabi-300">/api/uploads</code> y crea un producto por cada subcarpeta. Si encuentra <code>descripcion.txt</code> lo usa como descripción.
      </p>
      <div className="space-y-4">
        <div>
          <Label>Carpeta raíz (en Archivos)</Label>
          <Input value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="/Nabimen" data-testid="import-folder-input"/>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useSubfolder}
            onChange={(e) => setUseSubfolder(e.target.checked)}
            id="usesub"
            data-testid="import-use-subfolder"
          />
          <label htmlFor="usesub" className="cursor-pointer">
            Las subcarpetas de primer nivel son categorías (ej: <code>/Nabimen/Championes/&lt;producto&gt;</code>)
          </label>
        </div>
        {!useSubfolder && (
          <div>
            <Label>Categoría para todos los productos</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} data-testid="import-category">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Costo USD por defecto</Label>
            <Input type="number" step="0.5" value={cost} onChange={(e) => setCost(e.target.value)} data-testid="import-cost"/>
          </div>
          <div>
            <Label>Ganancia % por defecto</Label>
            <Input type="number" step="1" value={profit} onChange={(e) => setProfit(e.target.value)} data-testid="import-profit"/>
          </div>
        </div>
        {result && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs">
            <strong>{result.count}</strong> creados.{" "}
            {result.skipped?.length > 0 && (<span className="text-amber-300">{result.skipped.length} omitidos (ya existían o sin fotos)</span>)}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
          <Btn onClick={submit} disabled={loading} data-testid="run-import-btn">
            {loading ? "Importando..." : "Importar ahora"}
          </Btn>
          {result && <Btn variant="success" onClick={onDone} data-testid="finish-import-btn">Listo</Btn>}
        </div>
      </div>
    </Modal>
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
  const [pickerFor, setPickerFor] = useState(null); // "main" | {variantIdx: n}
  const [dragMain, setDragMain] = useState(false);
  const [dragVariant, setDragVariant] = useState(null);
  const mainFileInput = useRef(null);

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

  // Internal drag payload (foto ya existente que se arrastra entre zonas)
  // Formato: JSON con { url, source: "main" | {variantIdx: n} }
  const NABI_MIME = "application/x-nabi-photo";

  const onDropMain = (e) => {
    e.preventDefault();
    setDragMain(false);
    // ¿Es un drag interno (foto que viene de una variante)?
    const internal = e.dataTransfer.getData(NABI_MIME);
    if (internal) {
      try {
        const payload = JSON.parse(internal);
        if (payload.url) {
          // Si vino de una variante, no la sacamos de ahí; solo la sumamos a main si no existe.
          setD((s) => (s.photos.includes(payload.url) ? s : { ...s, photos: [...s.photos, payload.url] }));
        }
      } catch {}
      return;
    }
    // Archivos del SO → subir
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files, (urls) => setD((s) => ({ ...s, photos: [...s.photos, ...urls] })));
    }
  };

  const onDropVariant = (e, idx) => {
    e.preventDefault();
    setDragVariant(null);
    const internal = e.dataTransfer.getData(NABI_MIME);
    if (internal) {
      try {
        const payload = JSON.parse(internal);
        if (payload.url) {
          updateVariant(idx, {
            photos: (d.variants[idx].photos || []).includes(payload.url)
              ? d.variants[idx].photos
              : [...(d.variants[idx].photos || []), payload.url],
          });
        }
      } catch {}
      return;
    }
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files, (urls) => updateVariant(idx, { photos: [...(d.variants[idx].photos || []), ...urls] }));
    }
  };

  // Helpers de drag-start
  const dragStartPhoto = (e, url, source) => {
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData(NABI_MIME, JSON.stringify({ url, source }));
    // fallback para algunos navegadores
    e.dataTransfer.setData("text/plain", url);
  };

  // Reorder y eliminar foto dentro de una variante
  const moveVariantPhotoUp = (idx, pi) => setD((s) => {
    if (pi === 0) return s;
    const variants = [...s.variants];
    const arr = [...(variants[idx].photos || [])];
    [arr[pi - 1], arr[pi]] = [arr[pi], arr[pi - 1]];
    variants[idx] = { ...variants[idx], photos: arr };
    return { ...s, variants };
  });
  const removeVariantPhoto = (idx, pi) => setD((s) => {
    const variants = [...s.variants];
    variants[idx] = { ...variants[idx], photos: (variants[idx].photos || []).filter((_, i) => i !== pi) };
    return { ...s, variants };
  });

  const onPickerSelect = (urls) => {
    if (pickerFor === "main") {
      setD((s) => ({ ...s, photos: [...s.photos, ...urls] }));
    } else if (pickerFor && typeof pickerFor.variantIdx === "number") {
      const idx = pickerFor.variantIdx;
      updateVariant(idx, { photos: [...(d.variants[idx].photos || []), ...urls] });
    }
    setPickerFor(null);
  };

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
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <Label>Fotos principales</Label>
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPickerFor("main")}
                  className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 px-2 py-1 border border-nabi-700"
                  data-testid="main-pick-from-files-btn"
                >
                  <FolderOpen className="w-3 h-3 inline mr-1"/>Elegir de archivos
                </button>
                <button
                  type="button"
                  onClick={() => mainFileInput.current?.click()}
                  className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 px-2 py-1 border border-nabi-700"
                  data-testid="main-upload-pc-btn"
                >
                  <Upload className="w-3 h-3 inline mr-1"/>Subir del PC
                </button>
                <input ref={mainFileInput} type="file" multiple accept="image/*" className="hidden" onChange={onUploadMain} data-testid="upload-main-photos"/>
              </div>
            </div>

            <div
              onDragEnter={(e) => { e.preventDefault(); setDragMain(true); }}
              onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setDragMain(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropMain}
              className={`border-2 border-dashed p-3 mb-2 transition ${
                dragMain ? "border-nabi-500 bg-nabi-900/30" : "border-zinc-800"
              }`}
              data-testid="main-drop-zone"
            >
              <div className="flex gap-2 mb-2">
                <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="O pegá URL..." data-testid="photo-url-input"/>
                <Btn variant="secondary" onClick={addPhotoUrl} data-testid="add-photo-url-btn">Agregar</Btn>
              </div>
              {uploading && <div className="text-xs text-nabi-300 mb-2">Subiendo...</div>}
              <div className="grid grid-cols-4 gap-2">
                {d.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square bg-zinc-800 overflow-hidden cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => dragStartPhoto(e, p, "main")}
                    data-testid={`main-photo-${i}`}
                  >
                    <img src={fileUrl(p)} alt="" className="w-full h-full object-cover pointer-events-none"/>
                    {i === 0 && <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold px-1">PORTADA</span>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                      {i > 0 && <button onClick={() => movePhotoUp(i)} className="text-white bg-nabi-600 px-1.5 py-0.5 text-[10px]" data-testid={`photo-up-${i}`}>↑</button>}
                      <button onClick={() => removePhoto(i)} className="text-white bg-rose-600 p-1" data-testid={`photo-remove-${i}`}><X className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
                {d.photos.length === 0 && (
                  <div className="col-span-4 p-6 text-center text-zinc-500 text-xs">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-zinc-700"/>
                    Arrastrá imágenes acá, subí del PC o elegí de Archivos.
                  </div>
                )}
              </div>
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

                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragVariant(idx); }}
                    onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setDragVariant(null); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropVariant(e, idx)}
                    className={`border-2 border-dashed p-2 ${dragVariant === idx ? "border-nabi-500 bg-nabi-900/30" : "border-transparent"}`}
                    data-testid={`variant-${idx}-drop-zone`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      Fotos específicas de esta variante <span className="text-zinc-600 normal-case">· la primera es la portada</span>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <label className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 cursor-pointer flex items-center border border-nabi-700 px-2 py-1">
                        <Upload className="w-3 h-3 inline mr-1"/>Subir del PC
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUploadVariant(idx, e)} data-testid={`variant-${idx}-upload`}/>
                      </label>
                      <button
                        type="button"
                        onClick={() => setPickerFor({ variantIdx: idx })}
                        className="text-[10px] uppercase tracking-wider text-nabi-300 hover:text-nabi-200 px-2 py-1 border border-nabi-700"
                        data-testid={`variant-${idx}-pick-files-btn`}
                      >
                        <FolderOpen className="w-3 h-3 inline mr-1"/>Elegir de archivos
                      </button>
                      <Input placeholder="O URL..." onKeyDown={(e) => { if (e.key === "Enter") { addVariantUrl(idx, e.currentTarget.value); e.currentTarget.value = ""; }}} data-testid={`variant-${idx}-url-input`} className="!w-40"/>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {(v.photos || []).map((p, pi) => (
                        <div
                          key={pi}
                          className="relative group aspect-square bg-zinc-800 cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => dragStartPhoto(e, p, { variantIdx: idx })}
                          data-testid={`variant-${idx}-photo-${pi}`}
                        >
                          <img src={fileUrl(p)} alt="" className="w-full h-full object-cover pointer-events-none"/>
                          {pi === 0 && <span className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-black text-[8px] font-bold px-1 text-center">PORTADA</span>}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 transition">
                            {pi > 0 && (
                              <button
                                onClick={() => moveVariantPhotoUp(idx, pi)}
                                className="text-white bg-nabi-600 px-1 py-0.5 text-[9px]"
                                data-testid={`variant-${idx}-photo-up-${pi}`}
                              >↑</button>
                            )}
                            <button
                              onClick={() => removeVariantPhoto(idx, pi)}
                              className="text-white bg-rose-600 p-0.5"
                              data-testid={`variant-${idx}-photo-remove-${pi}`}
                            ><X className="w-2.5 h-2.5"/></button>
                          </div>
                        </div>
                      ))}
                      {(v.photos || []).length === 0 && (
                        <div className="col-span-6 text-[10px] text-zinc-600 text-center py-3 border border-dashed border-zinc-800">
                          Arrastrá una foto principal acá, subí del PC o elegí de Archivos
                        </div>
                      )}
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

      {pickerFor && (
        <FilePickerModal
          open={!!pickerFor}
          onClose={() => setPickerFor(null)}
          onSelect={onPickerSelect}
          multiple
        />
      )}
    </Modal>
  );
}
