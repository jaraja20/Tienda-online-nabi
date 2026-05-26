import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Header from "./Header";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import CartSheet from "./CartSheet";
import FavoritesSheet from "./FavoritesSheet";
import { NabiLogo } from "./NabiLogo";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1576775068668-c147f14c36f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  "https://images.pexels.com/photos/29548609/pexels-photo-29548609.jpeg?auto=compress&cs=tinysrgb&w=1400",
];

export default function StorefrontPage() {
  const { products, categories, settings } = useApp();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [openProduct, setOpenProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [params, setParams] = useSearchParams();
  const catSlug = params.get("cat") || "";

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === catSlug),
    [categories, catSlug]
  );

  // Available brands within current category
  const brandsInScope = useMemo(() => {
    const scoped = activeCategory ? products.filter((p) => p.category_id === activeCategory.id) : products;
    return Array.from(new Set(scoped.map((p) => p.brand).filter(Boolean))).sort();
  }, [products, activeCategory]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.active !== false);
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory.id);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q)
      );
    }
    if (brandFilter) list = list.filter((p) => p.brand === brandFilter);
    if (priceMin) list = list.filter((p) => p.price_pyg >= Number(priceMin));
    if (priceMax) list = list.filter((p) => p.price_pyg <= Number(priceMax));

    if (sort === "price_asc") list = [...list].sort((a, b) => a.price_pyg - b.price_pyg);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.price_pyg - a.price_pyg);
    return list;
  }, [products, activeCategory, search, sort, brandFilter, priceMin, priceMax]);

  const heroProduct = useMemo(() => products.find((p) => p.featured), [products]);

  return (
    <div className="min-h-screen bg-white">
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenFavs={() => setFavsOpen(true)}
        search={search}
        onSearchChange={setSearch}
      />

      {/* HERO */}
      {!catSlug && (
        <section className="border-b border-zinc-200">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 relative bg-zinc-100 overflow-hidden min-h-[380px] lg:min-h-[520px]">
              <img src={HERO_IMAGES[0]} alt="Streetwear" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-nabi-200 mb-2">
                  Drop · Streetwear by encargo
                </div>
                <h1 className="font-display tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[0.92] uppercase">
                  Pedí tu Shein.<br />
                  <span className="text-nabi-300">Recibí estilo en CDE.</span>
                </h1>
                <p className="mt-3 text-sm text-zinc-200 max-w-md">
                  Championes, relojes, remeras y accesorios traídos por encargo. 50% de seña, 2–3 semanas, calidad garantizada.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-rows-2 gap-6">
              <div className="bg-ink text-white p-8 lg:p-10 flex flex-col justify-between">
                <NabiLogo size="xl" variant="dark" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-nabi-300 font-bold mb-2">Conexión directa</div>
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-xs">
                    Cada pedido se gestiona personalmente vía WhatsApp. Sin sorpresas, sin intermediarios.
                  </p>
                </div>
              </div>
              <div className="relative bg-zinc-100 overflow-hidden">
                <img src={HERO_IMAGES[1]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-nabi-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-[10px] uppercase tracking-[0.3em] font-bold">Drop actual</div>
                  <h3 className="font-display font-bold text-2xl mt-1">Nueva temporada</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Category strip */}
          <div className="border-t border-zinc-200">
            <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-5 flex gap-3 overflow-x-auto">
              <button
                onClick={() => setParams({})}
                className={`shrink-0 px-4 py-2 text-xs uppercase tracking-[0.18em] font-bold border transition ${
                  !catSlug ? "bg-ink text-white border-ink" : "border-zinc-300 hover:border-ink"
                }`}
                data-testid="cat-chip-all"
              >
                Todo
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setParams({ cat: c.slug })}
                  className={`shrink-0 px-4 py-2 text-xs uppercase tracking-[0.18em] font-bold border transition ${
                    catSlug === c.slug ? "bg-ink text-white border-ink" : "border-zinc-300 hover:border-ink"
                  }`}
                  data-testid={`cat-chip-${c.slug}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category header when filtered */}
      {catSlug && (
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-8 flex items-end justify-between gap-3">
            <div>
              <button onClick={() => setParams({})} className="text-xs uppercase tracking-[0.18em] font-bold text-zinc-500 hover:text-ink mb-2 flex items-center gap-1" data-testid="back-to-all">
                <X className="w-3 h-3" /> Volver al inicio
              </button>
              <h1 className="font-display font-black tracking-tighter text-3xl lg:text-5xl">
                {activeCategory?.name || "Productos"}
              </h1>
              <div className="text-xs text-zinc-500 mt-1">{filtered.length} producto(s)</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setParams({ cat: c.slug })}
                  className={`shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] font-bold border ${
                    catSlug === c.slug ? "bg-ink text-white border-ink" : "border-zinc-300 hover:border-ink bg-white"
                  }`}
                  data-testid={`cat-pill-${c.slug}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="border-b border-zinc-200 sticky top-[65px] z-30 bg-white/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold px-3 py-2 border border-zinc-300 hover:border-ink"
            data-testid="toggle-filters-btn"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
          {(brandFilter || priceMin || priceMax) && (
            <button
              onClick={() => { setBrandFilter(""); setPriceMin(""); setPriceMax(""); }}
              className="text-[11px] uppercase tracking-[0.15em] font-bold text-rose-600 hover:underline"
              data-testid="clear-filters-btn"
            >
              Limpiar filtros
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-bold uppercase tracking-[0.15em] border border-zinc-300 px-3 py-2 bg-white"
              data-testid="sort-select"
            >
              <option value="newest">Más nuevos</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
        {showFilters && (
          <div className="border-t border-zinc-200 bg-zinc-50">
            <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-1.5">Marca</div>
                <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white" data-testid="brand-filter">
                  <option value="">Todas</option>
                  {brandsInScope.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-1.5">Precio mínimo (₲)</div>
                <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-full border border-zinc-300 px-3 py-2 text-sm" placeholder="0" data-testid="price-min" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-1.5">Precio máximo (₲)</div>
                <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-full border border-zinc-300 px-3 py-2 text-sm" placeholder="∞" data-testid="price-max" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-8 lg:py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="font-display text-2xl font-bold tracking-tight">Sin resultados</p>
            <p className="text-sm mt-2">Probá ajustando los filtros o búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 stagger" data-testid="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setOpenProduct} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-ink text-zinc-400 mt-16">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <NabiLogo size="md" className="text-white" />
            <p className="text-sm mt-3 max-w-xs">Tu tienda de encargo para productos SHEIN en Paraguay. CDE & nacional.</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-nabi-300 mb-2">Categorías</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {categories.map((c) => (
                <a key={c.id} href={`/?cat=${c.slug}`} className="hover:text-white">{c.name}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-nabi-300 mb-2">Contacto</div>
            <a
              href={`https://wa.me/${settings?.whatsapp_number || "595986616939"}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm hover:text-white inline-flex items-center gap-2"
              data-testid="footer-whatsapp-link"
            >
              WhatsApp: +{settings?.whatsapp_number || "595986616939"}
            </a>
          </div>
        </div>
        <div className="border-t border-zinc-800 py-4 text-center text-[11px] text-zinc-600">
          © {new Date().getFullYear()} NABI MEN · Paraguay
        </div>
      </footer>

      {openProduct && <ProductDetailModal product={openProduct} onClose={() => setOpenProduct(null)} />}
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
      <FavoritesSheet open={favsOpen} onClose={() => setFavsOpen(false)} onOpenProduct={setOpenProduct} />
    </div>
  );
}
