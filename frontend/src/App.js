import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import StorefrontPage from "./components/StorefrontPage";
import AdminLogin from "./components/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import "./App.css";

function ProtectedAdmin({ children }) {
  const { admin, token } = useApp();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (admin === null) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Cargando…</div>;
  }
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#0A0A0A", color: "#fff", fontFamily: "Manrope", fontSize: 13 },
          }}
        />
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedAdmin>
                <AdminLayout />
              </ProtectedAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
