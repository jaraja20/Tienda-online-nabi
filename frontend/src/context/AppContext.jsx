import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [heroEvents, setHeroEvents] = useState([]);
  const [rate, setRate] = useState(7800);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nm_favs") || "[]"); } catch { return []; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nm_cart") || "[]"); } catch { return []; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("nm_token"));
  const [admin, setAdmin] = useState(null);

  // Persist
  useEffect(() => {
    localStorage.setItem("nm_favs", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("nm_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (token) localStorage.setItem("nm_token", token);
    else localStorage.removeItem("nm_token");
  }, [token]);

  const loadInitial = useCallback(async () => {
    try {
      const [s, c, g, t, p, h] = await Promise.all([
        api.get("/settings"),
        api.get("/categories"),
        api.get("/tag-groups"),
        api.get("/tags"),
        api.get("/products"),
        api.get("/hero-events"),
      ]);
      setSettings(s.data);
      setCategories(c.data);
      setTagGroups(g.data);
      setTags(t.data);
      setProducts(p.data.items || []);
      setHeroEvents(h.data || []);
      setRate(p.data.rate || s.data.exchange_rate || 7800);
    } catch (e) {
      console.error("loadInitial err", e);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // Verify token still valid
  useEffect(() => {
    if (!token) { setAdmin(null); return; }
    api.get("/auth/me")
      .then((r) => setAdmin(r.data))
      .catch(() => { setToken(null); setAdmin(null); });
  }, [token]);

  const refreshProducts = useCallback(async (asAdmin = false) => {
    const r = await api.get("/products", { params: asAdmin ? { admin: true } : {} });
    setProducts(r.data.items || []);
    setRate(r.data.rate || 7800);
  }, []);

  const refreshSettings = useCallback(async () => {
    const r = await api.get("/settings");
    setSettings(r.data);
    if (r.data?.exchange_rate) setRate(r.data.exchange_rate);
  }, []);

  const refreshCategories = useCallback(async () => {
    const r = await api.get("/categories"); setCategories(r.data);
  }, []);

  const refreshTags = useCallback(async () => {
    const [g, t] = await Promise.all([api.get("/tag-groups"), api.get("/tags")]);
    setTagGroups(g.data); setTags(t.data);
  }, []);

  const refreshHeroEvents = useCallback(async () => {
    const r = await api.get("/hero-events"); setHeroEvents(r.data || []);
  }, []);

  // Favorites
  const toggleFavorite = (pid) => {
    setFavorites((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    );
  };
  const isFav = (pid) => favorites.includes(pid);

  // Cart
  const addToCart = (item) => {
    setCart((prev) => {
      const key = `${item.product_id}::${item.variant_id || ""}`;
      const idx = prev.findIndex(
        (x) => `${x.product_id}::${x.variant_id || ""}` === key
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + (item.qty || 1) };
        return next;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  };
  const updateCartQty = (idx, qty) => {
    setCart((prev) => {
      const next = [...prev];
      if (qty <= 0) { next.splice(idx, 1); return next; }
      next[idx] = { ...next[idx], qty };
      return next;
    });
  };
  const removeFromCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };
  const clearCart = () => setCart([]);

  // Auth
  const login = async (username, password) => {
    const r = await api.post("/auth/login", { username, password });
    setToken(r.data.token);
    setAdmin(r.data.user);
    return r.data.user;
  };
  const logout = () => { setToken(null); setAdmin(null); };

  // Derived maps
  const tagsById = Object.fromEntries(tags.map((t) => [t.id, t]));
  const tagGroupsById = Object.fromEntries(tagGroups.map((g) => [g.id, g]));
  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <AppCtx.Provider value={{
      settings, categories, tagGroups, tags, products, rate, heroEvents,
      tagsById, tagGroupsById, categoriesById, productsById,
      favorites, isFav, toggleFavorite,
      cart, addToCart, updateCartQty, removeFromCart, clearCart,
      token, admin, login, logout,
      loadInitial, refreshProducts, refreshSettings, refreshCategories, refreshTags, refreshHeroEvents,
      setRate,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
