import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Package, Tags, Layers, ShoppingCart, Folder,
  BarChart3, DollarSign, LogOut, ExternalLink,
  Menu, X, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NabiLogo } from "../NabiLogo";
import ProductsPanel from "./ProductsPanel";
import CategoriesPanel from "./CategoriesPanel";
import TagsPanel from "./TagsPanel";
import OrdersPanel from "./OrdersPanel";
import FilesPanel from "./FilesPanel";
import DashboardPanel from "./DashboardPanel";
import ExchangeRatePanel from "./ExchangeRatePanel";
import EventsPanel from "./EventsPanel";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "products", label: "Productos", icon: Package },
  { to: "categories", label: "Categorías", icon: Layers },
  { to: "tags", label: "Etiquetas", icon: Tags },
  { to: "events", label: "Eventos", icon: Sparkles },
  { to: "orders", label: "Pedidos", icon: ShoppingCart },
  { to: "files", label: "Archivos", icon: Folder },
  { to: "exchange", label: "Tasa de Cambio", icon: DollarSign },
];

export default function AdminLayout() {
  const { logout, admin } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Collapsed (icon-only) en desktop. Persistimos en localStorage.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nabi_admin_collapsed") === "1");

  useEffect(() => {
    localStorage.setItem("nabi_admin_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Cerrar el drawer móvil al navegar
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Topbar móvil */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-3 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-zinc-300 hover:text-white"
          data-testid="admin-mobile-menu-btn"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <NabiLogo size="sm" variant="dark" />
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="p-2 text-zinc-400 hover:text-rose-400"
          data-testid="admin-mobile-logout-btn"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        {/* Backdrop móvil */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
            data-testid="admin-mobile-backdrop"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:relative top-0 left-0 ${sidebarWidth} bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 h-screen lg:h-[100vh] lg:sticky lg:top-0 overflow-y-auto overflow-x-hidden dark-scroll z-50 transition-transform duration-200 lg:transition-[width] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className={`p-4 border-b border-zinc-800 flex items-center justify-between gap-2 ${collapsed ? "lg:px-2 lg:justify-center" : ""}`}>
            {!collapsed && (
              <div>
                <NabiLogo size="md" variant="dark" />
                <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-nabi-400 font-bold">
                  Panel admin
                </div>
              </div>
            )}
            {collapsed && <NabiLogo size="sm" variant="dark" />}
            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
              data-testid="admin-sidebar-close-mobile"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                data-testid={`nav-${to}`}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center ${collapsed ? "lg:justify-center lg:px-2" : "gap-3 px-3"} py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-nabi-500 animate-beam" />}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className={`p-2 border-t border-zinc-800 space-y-1 ${collapsed ? "lg:px-1" : ""}`}>
            {/* Botón retraer (solo desktop) */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`hidden lg:flex w-full items-center ${collapsed ? "justify-center" : "gap-2 px-3"} py-2 text-xs text-zinc-400 hover:text-white transition`}
              data-testid="admin-sidebar-collapse-btn"
              title={collapsed ? "Expandir" : "Retraer"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : (<><ChevronLeft className="w-4 h-4" /> Retraer</>)}
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              title={collapsed ? "Ver tienda" : undefined}
              className={`flex items-center ${collapsed ? "lg:justify-center lg:px-2" : "gap-2 px-3"} py-2 text-xs text-zinc-400 hover:text-white`}
              data-testid="open-store-link"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>Ver tienda</span>
            </a>
            <button
              onClick={() => { logout(); navigate("/"); }}
              title={collapsed ? "Cerrar sesión" : undefined}
              className={`w-full flex items-center ${collapsed ? "lg:justify-center lg:px-2" : "gap-2 px-3"} py-2 text-xs text-zinc-400 hover:text-rose-400`}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>Cerrar sesión</span>
            </button>
            {admin && !collapsed && (
              <div className="text-[10px] text-zinc-600 px-3 pt-1">
                {admin.username}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPanel />} />
            <Route path="products" element={<ProductsPanel />} />
            <Route path="categories" element={<CategoriesPanel />} />
            <Route path="tags" element={<TagsPanel />} />
            <Route path="events" element={<EventsPanel />} />
            <Route path="orders" element={<OrdersPanel />} />
            <Route path="files" element={<FilesPanel />} />
            <Route path="exchange" element={<ExchangeRatePanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
