import React, { useEffect, useMemo, useState } from "react";
import { X, Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatPYG, buildVariantLabel } from "../lib/utils";
import { fileUrl } from "../lib/api";
import toast from "react-hot-toast";

export default function ProductDetailModal({ product, onClose }) {
  const { isFav, toggleFavorite, addToCart, tagGroups, tagsById, categoriesById } = useApp();
  const [selectedTagIds, setSelectedTagIds] = useState({}); // {group_id: tag_id}
  const [qty, setQty] = useState(1);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    setSelectedTagIds({});
    setQty(1);
    setActivePhoto(0);
  }, [product?.id]);

  const cat = product ? categoriesById?.[product.category_id] : null;

  // Determine which variant matches current selection (any tag match)
  const matchedVariant = useMemo(() => {
    if (!product) return null;
    const selectedIds = Object.values(selectedTagIds).filter(Boolean);
    if (!selectedIds.length || !product.variants?.length) return null;
    const exact = product.variants.find((v) =>
      selectedIds.every((id) => (v.tag_ids || []).includes(id)) &&
      selectedIds.length === (v.tag_ids || []).length
    );
    if (exact) return exact;
    return product.variants.find((v) =>
      (v.tag_ids || []).some((id) => selectedIds.includes(id))
    ) || null;
  }, [selectedTagIds, product]);

  // Group tags available for this product
  const groupedTags = useMemo(() => {
    if (!product) return {};
    const all = (product.tag_ids?.length ? product.tag_ids : []);
    const tagsInProduct = all.length
      ? all.map((id) => tagsById[id]).filter(Boolean)
      : Object.values(tagsById);

    (product.variants || []).forEach((v) => {
      (v.tag_ids || []).forEach((id) => {
        const t = tagsById[id];
        if (t && !tagsInProduct.find((x) => x.id === id)) tagsInProduct.push(t);
      });
    });

    const grouped = {};
    tagsInProduct.forEach((t) => {
      if (!t?.group_id) return;
      grouped[t.group_id] = grouped[t.group_id] || [];
      if (!grouped[t.group_id].find((x) => x.id === t.id)) grouped[t.group_id].push(t);
    });
    return grouped;
  }, [product, tagsById]);

  if (!product) return null;

  const photos = (matchedVariant?.photos?.length ? matchedVariant.photos : product.photos) || [];
  const activeImg = fileUrl(photos[activePhoto] || photos[0] || "https://placehold.co/800x800/eee/333?text=NABI");

  const handleAdd = () => {
    const variantLabel = matchedVariant
      ? buildVariantLabel(matchedVariant, tagsById)
      : Object.values(selectedTagIds)
          .map((id) => tagsById[id]?.value)
          .filter(Boolean)
          .join(" / ");
    addToCart({
      product_id: product.id,
      variant_id: matchedVariant?.id || null,
      name: product.name,
      code: product.code,
      variant_label: variantLabel || null,
      qty,
      unit_price_pyg: product.price_pyg,
      photo: photos[0] || null,
    });
    toast.success("Agregado al carrito");
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      data-testid="product-modal-backdrop"
    >
      <div
        className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-2 relative"
        onClick={(e) => e.stopPropagation()}
        data-testid="product-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-white border border-zinc-200 hover:bg-zinc-100"
          data-testid="close-product-modal-btn"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery */}
        <div className="bg-zinc-50">
          <div className="relative aspect-square bg-zinc-100">
            <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 hover:bg-white"
                  aria-label="Anterior"
                  data-testid="prev-photo-btn"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 hover:bg-white"
                  aria-label="Siguiente"
                  data-testid="next-photo-btn"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 shrink-0 border ${i === activePhoto ? "border-nabi-600 border-2" : "border-zinc-200"}`}
                  data-testid={`thumb-${i}`}
                >
                  <img src={fileUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 lg:p-8 flex flex-col">
          {cat && (
            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-2">
              {cat.name}
              {product.brand && <span className="text-nabi-600"> · {product.brand}</span>}
            </div>
          )}
          <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight" data-testid="modal-product-name">
            {product.name}
          </h2>
          {product.code && (
            <div className="text-xs text-zinc-500 mt-1">Código: {product.code}</div>
          )}

          <div className="my-4 font-display text-3xl font-black text-ink" data-testid="modal-product-price">
            {formatPYG(product.price_pyg)}
          </div>

          {product.description && (
            <p className="text-sm text-zinc-600 leading-relaxed mb-5 whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          {/* Tag selectors per group */}
          <div className="space-y-4 mb-6">
            {tagGroups
              .filter((g) => groupedTags[g.id]?.length)
              .map((g) => (
                <div key={g.id}>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-600 mb-2">
                    {g.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedTags[g.id].map((t) => {
                      const sel = selectedTagIds[g.id] === t.id;
                      if (g.display_type === "tag" && t.color_hex) {
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTagIds((s) => ({ ...s, [g.id]: sel ? null : t.id }))}
                            data-testid={`tag-${t.id}`}
                            className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-semibold transition ${
                              sel ? "border-nabi-600 ring-2 ring-nabi-200" : "border-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-zinc-400" style={{ background: t.color_hex }} />
                            {t.value}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTagIds((s) => ({ ...s, [g.id]: sel ? null : t.id }))}
                          data-testid={`tag-${t.id}`}
                          className={`px-4 py-2 border text-xs font-semibold uppercase tracking-wider transition ${
                            sel ? "bg-ink text-white border-ink" : "border-zinc-300 hover:border-ink"
                          }`}
                        >
                          {t.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-600">Cantidad</div>
            <div className="flex border border-zinc-300">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 hover:bg-zinc-100"
                data-testid="qty-minus"
              >-</button>
              <span className="px-4 py-1.5 border-x border-zinc-300 min-w-[3rem] text-center text-sm font-semibold" data-testid="qty-value">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-1.5 hover:bg-zinc-100"
                data-testid="qty-plus"
              >+</button>
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`p-3 border ${
                isFav(product.id) ? "bg-nabi-600 text-white border-nabi-600" : "border-zinc-300 hover:border-ink"
              }`}
              data-testid="modal-fav-btn"
              aria-label="Favorito"
            >
              <Heart className={`w-5 h-5 ${isFav(product.id) ? "fill-white" : ""}`} />
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-ink text-white font-bold uppercase tracking-[0.18em] text-xs py-4 hover:bg-nabi-600 transition flex items-center justify-center gap-2"
              data-testid="add-to-cart-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
