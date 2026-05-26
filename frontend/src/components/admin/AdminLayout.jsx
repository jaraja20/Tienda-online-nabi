import React from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  Package, Tags, Layers, ShoppingCart, Folder,
  BarChart3, DollarSign, LogOut, ExternalLink
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

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "products", label: "Productos", icon: Package },
  { to: "categories", label: "Categorías", icon: Layers },
  { to: "tags", label: "Etiquetas", icon: Tags },
  { to: "orders", label: "Pedidos", icon: ShoppingCart },
  { to: "files", label: "Archivos", icon: Folder },
  { to: "exchange", label: "Tasa de Cambio", icon: DollarSign },
];

export default function AdminLayout() {
  const { logout, admin } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 fixed lg:static h-screen overflow-y-auto dark-scroll z-30">
        <div className="p-5 border-b border-zinc-800">
          <NabiLogo size="md" variant="dark" />
          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-nabi-400 font-bold">
            Panel admin
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${to}`}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-nabi-500 animate-beam" />}
                  <Icon className="w-4 h-4" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white px-3 py-2"
            data-testid="open-store-link"
          >
            <ExternalLink className="w-4 h-4" /> Ver tienda
          </a>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-2 text-xs text-zinc-400 hover:text-rose-400 px-3 py-2"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
          {admin && (
            <div className="text-[10px] text-zinc-600 px-3 pt-2">
              {admin.username}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 lg:ml-0 ml-64 overflow-x-hidden">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPanel />} />
          <Route path="products" element={<ProductsPanel />} />
          <Route path="categories" element={<CategoriesPanel />} />
          <Route path="tags" element={<TagsPanel />} />
          <Route path="orders" element={<OrdersPanel />} />
          <Route path="files" element={<FilesPanel />} />
          <Route path="exchange" element={<ExchangeRatePanel />} />
        </Routes>
      </main>
    </div>
  );
}
