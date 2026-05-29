import React, { useEffect, useState } from "react";
import { fileUrl } from "../lib/api";
import { NabiLogo } from "./NabiLogo";

/**
 * Carrusel autoplay para un slot del hero. Renderiza un layout específico según slot.
 * Si no hay eventos activos, renderiza un fallback hardcodeado (compatibilidad).
 */
function useCarousel(items, intervalMs = 5500) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [items.length]);
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs]);
  return [idx, setIdx];
}

function CarouselFrame({ items, children, className = "", testid }) {
  // children es una función render(item) → JSX
  const [idx, setIdx] = useCarousel(items);
  if (!items.length) return null;
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} data-testid={testid}>
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)`, width: `${items.length * 100}%` }}
      >
        {items.map((it, i) => (
          <div key={it.id || i} className="relative h-full" style={{ width: `${100 / items.length}%` }}>
            {children(it)}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
              aria-label={`Ir a evento ${i + 1}`}
              data-testid={`hero-dot-${testid}-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const FALLBACK_MAIN = {
  id: "fb-main",
  image_url: "https://images.unsplash.com/photo-1576775068668-c147f14c36f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  eyebrow: "Drop · Streetwear by encargo",
  title: "Pedí tu Shein.",
  subtitle: "Recibí estilo en CDE.",
  description: "Championes, relojes, remeras y accesorios traídos por encargo. 50% de seña, 2–3 semanas, calidad garantizada.",
};
const FALLBACK_SIDE_TOP = {
  id: "fb-st",
  eyebrow: "Conexión directa",
  description: "Cada pedido se gestiona personalmente vía WhatsApp. Sin sorpresas, sin intermediarios.",
};
const FALLBACK_SIDE_BOTTOM = {
  id: "fb-sb",
  image_url: "https://images.pexels.com/photos/29548609/pexels-photo-29548609.jpeg?auto=compress&cs=tinysrgb&w=1400",
  eyebrow: "Drop actual",
  title: "Nueva temporada",
};

export default function HeroSection({ heroEvents }) {
  const all = (heroEvents || []).filter((e) => e.active !== false);
  const main = all.filter((e) => e.slot === "main").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sideTop = all.filter((e) => e.slot === "side_top").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sideBottom = all.filter((e) => e.slot === "side_bottom").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const mainItems = main.length ? main : [FALLBACK_MAIN];
  const sideTopItems = sideTop.length ? sideTop : [FALLBACK_SIDE_TOP];
  const sideBottomItems = sideBottom.length ? sideBottom : [FALLBACK_SIDE_BOTTOM];

  return (
    <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* MAIN */}
      <div className="lg:col-span-7 bg-zinc-100 overflow-hidden min-h-[380px] lg:min-h-[520px]">
        <CarouselFrame items={mainItems} testid="hero-main">
          {(item) => (
            <>
              {item.image_url && <img src={fileUrl(item.image_url)} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-6 right-6 lg:left-8 lg:right-8 text-white">
                {item.eyebrow && (
                  <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-nabi-200 mb-2">
                    {item.eyebrow}
                  </div>
                )}
                {(item.title || item.subtitle) && (
                  <h1 className="font-display tracking-tight text-4xl sm:text-5xl lg:text-7xl leading-[0.92] uppercase">
                    {item.title}
                    {item.subtitle && (<><br /><span className="text-nabi-300">{item.subtitle}</span></>)}
                  </h1>
                )}
                {item.description && (
                  <p className="mt-3 text-xs sm:text-sm text-zinc-200 max-w-md">
                    {item.description}
                  </p>
                )}
              </div>
            </>
          )}
        </CarouselFrame>
      </div>

      {/* SIDE */}
      <div className="lg:col-span-5 grid grid-rows-2 gap-6 min-h-[400px] lg:min-h-[520px]">
        <div className="bg-ink text-white overflow-hidden min-h-[200px]">
          <CarouselFrame items={sideTopItems} testid="hero-side-top">
            {(item) => (
              <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-between">
                {item.image_url ? (
                  <>
                    <img src={fileUrl(item.image_url)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"/>
                  </>
                ) : (
                  <div className="relative"><NabiLogo size="xl" variant="dark" /></div>
                )}
                <div className="relative">
                  {item.eyebrow && (
                    <div className="text-[10px] uppercase tracking-[0.3em] text-nabi-300 font-bold mb-2">
                      {item.eyebrow}
                    </div>
                  )}
                  {item.title && <h3 className="font-display font-bold text-2xl mb-1">{item.title}</h3>}
                  {item.description && (
                    <p className="text-sm text-zinc-300 leading-relaxed max-w-xs">{item.description}</p>
                  )}
                </div>
              </div>
            )}
          </CarouselFrame>
        </div>

        <div className="bg-zinc-100 overflow-hidden min-h-[180px]">
          <CarouselFrame items={sideBottomItems} testid="hero-side-bottom">
            {(item) => (
              <>
                {item.image_url && <img src={fileUrl(item.image_url)} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-nabi-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  {item.eyebrow && (
                    <div className="text-[10px] uppercase tracking-[0.3em] font-bold">{item.eyebrow}</div>
                  )}
                  {item.title && <h3 className="font-display font-bold text-2xl mt-1">{item.title}</h3>}
                  {item.description && <p className="text-xs text-zinc-200 mt-1 line-clamp-2">{item.description}</p>}
                </div>
              </>
            )}
          </CarouselFrame>
        </div>
      </div>
    </div>
  );
}
