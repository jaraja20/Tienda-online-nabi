import React from "react";

/**
 * Logo NABI MEN — usa la imagen real del usuario.
 * variant: "light" (sobre fondo claro/blanco) | "dark" (sobre fondo oscuro/admin)
 * size: sm | md | lg | xl
 */
export function NabiLogo({ variant = "light", size = "md", className = "" }) {
  const heights = {
    sm: "h-7",
    md: "h-10",
    lg: "h-16",
    xl: "h-24",
  };
  const src = variant === "dark" ? "/logo-nabimen-white.png" : "/logo-nabimen-transparent.png";
  return (
    <img
      src={src}
      alt="NABI MEN"
      className={`${heights[size] || heights.md} w-auto object-contain select-none ${className}`}
      draggable={false}
      data-testid="brand-logo"
    />
  );
}
