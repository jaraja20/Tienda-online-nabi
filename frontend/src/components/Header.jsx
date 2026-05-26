import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { NabiLogo } from "./NabiLogo";
import { useApp } from "../context/AppContext";

export default function Header({ onOpenCart, onOpenFavs, onSearchChange, search }) {
  const { cart, favorites, categories } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  return (
    <header className="sticky top-0 z-40 glass border-b border-zinc-200">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-3 flex items-center gap-6">
        <Link to="/" className="shrink-0 flex items-center" data-testid="logo-link">
          <NabiLogo size="md" variant="light" />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-2 text-xs uppercase tracking-[0.18em] font-bold text-zinc-700">
          <Link to="/" className="hover:text-nabi-600 transition" data-testid="nav-home">Inicio</Link>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to={`/?cat=${c.slug}`}
              className="hover:text-nabi-600 transition"
              data-testid={`nav-cat-${c.slug}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2 w-72">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            data-testid="search-input"
            value={search || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar producto…"
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-zinc-500"
          />
        </div>

        <button
          onClick={onOpenFavs}
          data-testid="open-favorites-btn"
          className="relative p-2 hover:bg-zinc-100 rounded-full transition"
          aria-label="Favoritos"
        >
          <Heart className="w-5 h-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-nabi-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {favorites.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenCart}
          data-testid="open-cart-btn"
          className="relative p-2 hover:bg-zinc-100 rounded-full transition"
          aria-label="Carrito"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-ink text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/admin/login")}
          className="hidden md:inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] font-bold text-zinc-600 hover:text-nabi-600 transition px-3 py-2"
          data-testid="admin-login-link"
          title="Acceso administrador"
        >
          <User className="w-4 h-4" />
          Admin
        </button>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          data-testid="mobile-menu-toggle"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-zinc-200 bg-white">
          <div className="px-5 py-4 flex flex-col gap-3 text-sm font-semibold">
            <Link to="/" onClick={() => setOpen(false)}>Inicio</Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/?cat=${c.slug}`}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
            <Link to="/admin/login" onClick={() => setOpen(false)}>Admin</Link>
          </div>
        </div>
      )}
    </header>
  );
}
