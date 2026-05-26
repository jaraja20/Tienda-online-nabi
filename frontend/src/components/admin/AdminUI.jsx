import React from "react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...rest }) {
  const variants = {
    primary: "bg-nabi-600 hover:bg-nabi-500 text-white",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
    ghost: "border border-zinc-700 hover:border-zinc-500 text-zinc-300",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  };
  return (
    <button
      {...rest}
      className={`text-xs uppercase tracking-[0.15em] font-bold px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full bg-zinc-900 border border-zinc-800 focus:border-nabi-500 outline-none px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition ${className}`}
    />
  );
}

export function Textarea({ className = "", ...rest }) {
  return (
    <textarea
      {...rest}
      className={`w-full bg-zinc-900 border border-zinc-800 focus:border-nabi-500 outline-none px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition ${className}`}
    />
  );
}

export function Select({ className = "", children, ...rest }) {
  return (
    <select
      {...rest}
      className={`w-full bg-zinc-900 border border-zinc-800 focus:border-nabi-500 outline-none px-3 py-2 text-sm text-zinc-100 transition ${className}`}
    >
      {children}
    </select>
  );
}

export function Label({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500 mb-1.5">
      {children}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 ${className}`}>{children}</div>
  );
}

export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-zinc-900 border border-zinc-800 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto dark-scroll`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h3 className="font-display font-bold text-xl tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
