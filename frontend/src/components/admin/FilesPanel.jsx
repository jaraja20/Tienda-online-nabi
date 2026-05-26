import React, { useEffect, useState, useRef } from "react";
import { api, fileUrl } from "../../lib/api";
import { PageHeader, Btn, Card, Input, Modal, Label } from "./AdminUI";
import { Folder, File as FileIcon, ChevronRight, Upload, FolderPlus, Trash2, Home, Copy, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function FilesPanel() {
  const [path, setPath] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [drag, setDrag] = useState(false);
  const fileInput = useRef(null);

  const load = async (p = path) => {
    setLoading(true);
    try {
      const r = await api.get("/files/list", { params: { path: p } });
      setItems(r.data.items);
      setPath(r.data.path);
    } catch (e) {
      toast.error("Error cargando archivos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load("/"); }, []);

  const navigate = (newPath) => load(newPath);
  const upDir = () => {
    if (path === "/") return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    load("/" + parts.join("/"));
  };

  const mkdir = async () => {
    if (!newFolderName.trim()) return;
    try {
      const fd = new FormData();
      fd.append("path", path);
      fd.append("name", newFolderName.trim());
      await api.post("/files/mkdir", fd);
      toast.success("Carpeta creada");
      setNewFolderName("");
      setShowNew(false);
      load();
    } catch {
      toast.error("No se pudo crear");
    }
  };

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    fd.append("path", path);
    try {
      const r = await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${r.data.saved.length} ítem(s) subido(s)`);
      load();
    } catch {
      toast.error("Error al subir");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    uploadFiles(e.dataTransfer.files);
  };

  const remove = async (it) => {
    if (!window.confirm(`¿Eliminar ${it.type === "folder" ? "carpeta" : "archivo"} "${it.name}"?`)) return;
    await api.delete(`/files/delete`, { params: { path: it.path } });
    toast.success("Eliminado");
    load();
  };

  const copyUrl = (url) => {
    const full = fileUrl(url);
    navigator.clipboard.writeText(full);
    toast.success("URL copiada");
  };

  const crumbs = path === "/" ? [] : path.split("/").filter(Boolean);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Archivos"
        subtitle="Gestor de fotos para los productos. Drag & drop, ZIP, carpetas anidadas."
        actions={
          <>
            <Btn variant="ghost" onClick={() => setShowNew(true)} data-testid="new-folder-btn">
              <FolderPlus className="w-3 h-3 inline mr-1"/>Carpeta
            </Btn>
            <Btn onClick={() => fileInput.current?.click()} data-testid="upload-files-btn">
              <Upload className="w-3 h-3 inline mr-1"/>Subir
            </Btn>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              data-testid="file-input"
            />
          </>
        }
      />

      <Card>
        <div className="flex items-center gap-1 text-xs px-3 py-2 border-b border-zinc-800 bg-zinc-950 overflow-x-auto">
          <button onClick={() => load("/")} className="flex items-center gap-1 hover:text-white text-zinc-400" data-testid="crumb-home">
            <Home className="w-3 h-3"/>Inicio
          </button>
          {crumbs.map((c, i) => {
            const p = "/" + crumbs.slice(0, i + 1).join("/");
            return (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-zinc-600"/>
                <button onClick={() => load(p)} className="hover:text-white text-zinc-400" data-testid={`crumb-${c}`}>{c}</button>
              </React.Fragment>
            );
          })}
        </div>

        <div
          onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`min-h-[400px] p-4 ${drag ? "bg-nabi-900/30 border-2 border-dashed border-nabi-500" : ""}`}
          data-testid="files-drop-zone"
        >
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <FolderPlus className="w-12 h-12 mx-auto mb-2 text-zinc-700"/>
              <p className="text-sm">Carpeta vacía</p>
              <p className="text-xs mt-1">Arrastrá archivos o ZIPs aquí, o usá el botón Subir</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {path !== "/" && (
                <button onClick={upDir} className="flex flex-col items-center p-2 hover:bg-zinc-800 transition" data-testid="up-dir-btn">
                  <Folder className="w-12 h-12 text-zinc-500 mb-1"/>
                  <span className="text-xs">..</span>
                </button>
              )}
              {items.map((it) => (
                <div key={it.path} className="relative group" data-testid={`file-item-${it.name}`}>
                  {it.type === "folder" ? (
                    <button onClick={() => navigate(it.path)} className="w-full flex flex-col items-center p-2 hover:bg-zinc-800 transition">
                      <Folder className="w-12 h-12 text-nabi-400 mb-1 fill-nabi-500/30"/>
                      <span className="text-[11px] text-center break-all line-clamp-2 w-full">{it.name}</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center p-2 hover:bg-zinc-800 transition">
                      <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center mb-1 overflow-hidden">
                        {/\.(jpe?g|png|webp|gif|avif)$/i.test(it.name) ? (
                          <img src={fileUrl(it.url)} alt="" className="w-full h-full object-cover"/>
                        ) : (
                          <FileIcon className="w-6 h-6 text-zinc-500"/>
                        )}
                      </div>
                      <span className="text-[11px] text-center break-all line-clamp-2 w-full">{it.name}</span>
                      <span className="text-[9px] text-zinc-600">{Math.round(it.size / 1024)} KB</span>
                    </div>
                  )}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 transition">
                    {it.type === "file" && it.url && (
                      <button onClick={() => copyUrl(it.url)} className="bg-nabi-600 text-white p-1" title="Copiar URL" data-testid={`copy-url-${it.name}`}>
                        <Copy className="w-3 h-3"/>
                      </button>
                    )}
                    <button onClick={() => remove(it)} className="bg-rose-600 text-white p-1" title="Eliminar" data-testid={`delete-file-${it.name}`}>
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva carpeta" size="sm">
        <Label>Nombre de la carpeta</Label>
        <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="ej: relojes" data-testid="new-folder-name-input"/>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Btn>
          <Btn onClick={mkdir} data-testid="create-folder-btn">Crear</Btn>
        </div>
      </Modal>
    </div>
  );
}
