export const formatPYG = (n) => {
  if (n == null || isNaN(n)) return "₲ 0";
  return "₲ " + Math.round(n).toLocaleString("es-PY");
};

export const formatUSD = (n) => {
  if (n == null || isNaN(n)) return "USD 0";
  return "USD " + Number(n).toFixed(2);
};

export const STATE_LABELS = {
  en_proceso: "En proceso",
  pagado_parcialmente: "Pagado parcialmente (50%)",
  en_envio: "En proceso de envío",
  arribado: "Arribado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const STATE_COLORS = {
  en_proceso: "bg-amber-100 text-amber-800 border-amber-300",
  pagado_parcialmente: "bg-blue-100 text-blue-800 border-blue-300",
  en_envio: "bg-indigo-100 text-indigo-800 border-indigo-300",
  arribado: "bg-purple-100 text-purple-800 border-purple-300",
  completado: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelado: "bg-rose-100 text-rose-800 border-rose-300",
};

export const STATE_FLOW = [
  "en_proceso",
  "pagado_parcialmente",
  "en_envio",
  "arribado",
  "completado",
];

export function buildVariantLabel(variant, tagsById) {
  if (!variant) return null;
  if (variant.label) return variant.label;
  return (variant.tag_ids || [])
    .map((id) => tagsById?.[id]?.value)
    .filter(Boolean)
    .join(" / ");
}
