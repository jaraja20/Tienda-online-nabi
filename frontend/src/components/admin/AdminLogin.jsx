import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NabiLogo } from "../NabiLogo";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Lock, User } from "lucide-react";

export default function AdminLogin() {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Sesión iniciada");
      navigate("/admin");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-nabi-700 via-nabi-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(67,56,202,0.4) 0, transparent 50%)"
        }} />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <NabiLogo size="xl" variant="dark" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-nabi-300 font-bold mb-3">
              Panel de control
            </div>
            <h2 className="font-display text-4xl font-black tracking-tighter leading-[0.95] max-w-md">
              Administrá tu tienda con precisión total.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 max-w-md">
              Gestión de productos, pedidos, archivos, estadísticas y tasa de cambio en un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5" data-testid="admin-login-form">
          <div className="lg:hidden mb-4"><NabiLogo size="md" variant="dark" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Acceso admin</h1>
            <p className="text-sm text-zinc-400 mt-1">Ingresá con tus credenciales.</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400">Usuario</label>
            <div className="mt-1.5 flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-nabi-500">
              <User className="w-4 h-4 ml-3 text-zinc-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent flex-1 px-3 py-3 outline-none text-sm"
                placeholder="admin"
                autoComplete="username"
                data-testid="login-username-input"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400">Contraseña</label>
            <div className="mt-1.5 flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-nabi-500">
              <Lock className="w-4 h-4 ml-3 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent flex-1 px-3 py-3 outline-none text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
                data-testid="login-password-input"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nabi-600 hover:bg-nabi-500 disabled:opacity-50 text-white font-bold uppercase tracking-[0.18em] text-xs py-4 transition"
            data-testid="login-submit-btn"
          >
            {loading ? "Verificando..." : "Iniciar sesión"}
          </button>
          <a href="/" className="block text-center text-xs text-zinc-500 hover:text-white" data-testid="back-to-store-link">
            ← Volver a la tienda
          </a>
        </form>
      </div>
    </div>
  );
}
