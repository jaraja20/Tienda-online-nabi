import React from "react";

export function NabiLogo({ size = "md", className = "" }) {
  const sizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };
  return (
    <div className={`brand-logo ${sizes[size] || sizes.md} ${className}`} data-testid="brand-logo">
      <span className="text-ink">NABI</span>
      <span className="men">MEN</span>
    </div>
  );
}
