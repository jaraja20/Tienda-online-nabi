import React from "react";
import { Heart } from "lucide-react";
import { formatPYG } from "../lib/utils";
import { useApp } from "../context/AppContext";
import { fileUrl } from "../lib/api";

export default function ProductCard({ product, onOpen }) {
  const { isFav, toggleFavorite, categoriesById } = useApp();
  const fav = isFav(product.id);
  const cover = product.photos?.[0] || "https://placehold.co/600x800/eee/333?text=NABI";
  const cat = categoriesById?.[product.category_id];

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onOpen(product)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
        <img
          src={fileUrl(cover)}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
          className={`absolute top-3 right-3 rounded-full p-2 backdrop-blur-md transition ${
            fav ? "bg-nabi-600 text-white" : "bg-white/80 text-zinc-700 hover:bg-white"
          }`}
          data-testid={`fav-btn-${product.id}`}
          aria-label="Favorito"
        >
          <Heart className={`w-4 h-4 ${fav ? "fill-white" : ""}`} />
        </button>
        {product.featured && (
          <div className="absolute top-3 left-3 bg-ink text-white text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-1">
            Destacado
          </div>
        )}
        {product.out_of_stock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-ink text-white text-xs uppercase tracking-[0.3em] font-bold px-4 py-2 border-2 border-white">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="pt-3 pb-1">
        {cat && (
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">
            {cat.name}
          </div>
        )}
        <div className="font-semibold text-sm text-ink line-clamp-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </div>
        <div className="mt-1 font-display font-bold text-base text-ink" data-testid={`product-price-${product.id}`}>
          {formatPYG(product.price_pyg)}
        </div>
      </div>
    </div>
  );
}
