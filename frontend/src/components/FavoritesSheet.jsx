import React from "react";
import { X, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatPYG } from "../lib/utils";
import { fileUrl } from "../lib/api";

export default function FavoritesSheet({ open, onClose, onOpenProduct }) {
  const { favorites, productsById, toggleFavorite } = useApp();
  const favItems = favorites.map((id) => productsById[id]).filter(Boolean);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      data-testid="favorites-sheet"
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h3 className="font-display font-bold text-lg tracking-tight">Tus favoritos</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100" data-testid="close-favorites-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {favItems.length === 0 && (
            <div className="text-center text-zinc-500 py-12">
              <Heart className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
              <p className="font-semibold">No tenés favoritos aún</p>
              <p className="text-xs mt-1">Tocá el corazón en los productos que te gusten</p>
            </div>
          )}
          {favItems.map((p) => (
            <div key={p.id} className="flex gap-3 cursor-pointer" onClick={() => { onOpenProduct?.(p); onClose(); }} data-testid={`fav-item-${p.id}`}>
              <div className="w-20 h-24 bg-zinc-100 shrink-0">
                {p.photos?.[0] && <img src={fileUrl(p.photos[0])} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold line-clamp-2">{p.name}</div>
                <div className="text-xs font-bold text-ink mt-1">{formatPYG(p.price_pyg)}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                className="p-2 text-rose-500 hover:bg-rose-50 self-start"
                data-testid={`fav-remove-${p.id}`}
              >
                <Heart className="w-4 h-4 fill-rose-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
