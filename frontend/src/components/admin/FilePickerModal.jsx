import React, { useEffect, useState } from "react";
import { api, fileUrl } from "../../lib/api";
import { Modal, Btn, Input } from "./AdminUI";
import { Folder, ChevronRight, Home, Search, Check } from "lucide-react";

/**
 * FilePickerModal — browse /api/uploads tree and select images.
 * Props:
 *  - open: bool
 *  - multiple: bool (default true)
 *  - onClose: () => void
 *  - onSelect: (urls: string[]) => void   urls are like "/api/uploads/..."
 */
export default function FilePickerModal({ open, multiple = true, onClose, onSelect }) {
  const [path, setPath] = useState("/");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (p) => {
    setLoading(true);
    try {
      const r = await api.get("/files/list", { params: { path: p } });
      setItems(r.data.items);
      setPath(r.data.path);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setQ("");
      load("/");
    }
  }, [open]);

  const upDir = () => {
    if (path === "/") return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    load("/" + parts.join("/"));
  };

  const toggle = (url) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else {
        if (!multiple) next.clear();
        next.add(url);
      }
      return next;
    });
  };

  const confirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  const crumbs = path === "/" ? [] : path.split("/").filter(Boolean);
  const isImage = (n) => /\.(jpe?g|png|webp|gif|avif)$/i.test(n);
  const filtered = q
    ? items.filter((it) => it.name.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <Modal open={open} onClose={onClose} title="Seleccionar fotos desde Archivos" size="lg">
      {/* Breadcrumbs + search */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <button onClick={() => load("/")} className="flex items-center gap-1 hover:text-white text-zinc-400">
          <Home className="w-3 h-3" />Inicio
        </button>
        {crumbs.map((c, i) => {
          const p = "/" + crumbs.slice(0, i + 1).join("/");
          return (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <button onClick={() => load(p)} className="hover:text-white text-zinc-400">{c}</button>
            </React.Fragment>
          );
        })}
        <div className="ml-auto flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-2 py-1">
          <Search className="w-3 h-3 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar..."
            className="bg-transparent outline-none text-xs w-40"
            data-testid="picker-search"
          />
        </div>
      </div>

      <div className="min-h-[300px] max-h-[55vh] overflow-y-auto dark-scroll">
        {loading ? (
          <div className="py-10 text-center text-zinc-500">Cargando...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {path !== "/" && (
              <button onClick={upDir} className="flex flex-col items-center p-2 hover:bg-zinc-800 transition border border-zinc-800" data-testid="picker-up-dir">
                <Folder className="w-10 h-10 text-zinc-500 mb-1" />
                <span className="text-[10px]">..</span>
              </button>
            )}
            {filtered.map((it) => {
              if (it.type === "folder") {
                return (
                  <button key={it.path} onClick={() => load(it.path)} className="flex flex-col items-center p-2 hover:bg-zinc-800 transition border border-zinc-800" data-testid={`picker-folder-${it.name}`}>
                    <Folder className="w-10 h-10 text-nabi-400 fill-nabi-500/20 mb-1" />
                    <span className="text-[10px] text-center break-all line-clamp-2 w-full">{it.name}</span>
                  </button>
                );
              }
              if (!isImage(it.name)) return null;
              const url = it.url;
              const sel = selected.has(url);
              return (
                <button
                  key={it.path}
                  onClick={() => toggle(url)}
                  className={`relative flex flex-col items-center p-1 transition border ${
                    sel ? "border-nabi-500 ring-2 ring-nabi-400" : "border-zinc-800 hover:border-zinc-600"
                  }`}
                  data-testid={`picker-file-${it.name}`}
                >
                  <div className="w-full aspect-square bg-zinc-800 overflow-hidden">
                    <img src={fileUrl(url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 text-center break-all line-clamp-1 w-full">{it.name}</span>
                  {sel && (
                    <div className="absolute top-1 right-1 bg-nabi-500 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-zinc-500 py-10 text-sm">
            <Folder className="w-10 h-10 mx-auto text-zinc-700 mb-1" />
            Carpeta vacía o sin resultados
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-400" data-testid="picker-selection-count">
          {selected.size} foto{selected.size === 1 ? "" : "s"} seleccionada{selected.size === 1 ? "" : "s"}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={confirm} disabled={selected.size === 0} data-testid="picker-confirm-btn">
            Agregar {selected.size > 0 ? `(${selected.size})` : ""}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
