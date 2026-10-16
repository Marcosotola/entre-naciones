import type { Producto } from "./types";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatPrecio = (n: number) => ars.format(n);

// Países de origen disponibles para los productos (el orden es el del selector del admin)
export const PAISES: Record<string, { label: string; bandera: string }> = {
  VE: { label: "Venezuela", bandera: "🇻🇪" },
  AR: { label: "Argentina", bandera: "🇦🇷" },
  CO: { label: "Colombia", bandera: "🇨🇴" },
  PE: { label: "Perú", bandera: "🇵🇪" },
  CL: { label: "Chile", bandera: "🇨🇱" },
  UY: { label: "Uruguay", bandera: "🇺🇾" },
  PY: { label: "Paraguay", bandera: "🇵🇾" },
  BO: { label: "Bolivia", bandera: "🇧🇴" },
  EC: { label: "Ecuador", bandera: "🇪🇨" },
  BR: { label: "Brasil", bandera: "🇧🇷" },
  MX: { label: "México", bandera: "🇲🇽" },
  CU: { label: "Cuba", bandera: "🇨🇺" },
  DO: { label: "Rep. Dominicana", bandera: "🇩🇴" },
  US: { label: "Estados Unidos", bandera: "🇺🇸" },
  ES: { label: "España", bandera: "🇪🇸" },
  IT: { label: "Italia", bandera: "🇮🇹" },
  PT: { label: "Portugal", bandera: "🇵🇹" },
  JP: { label: "Japón", bandera: "🇯🇵" },
  KR: { label: "Corea", bandera: "🇰🇷" },
  CN: { label: "China", bandera: "🇨🇳" },
  OTRO: { label: "Otros", bandera: "🌎" },
};

export const pais = (codigo: string) => PAISES[codigo] ?? PAISES.OTRO;

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normaliza para búsqueda: sin tildes, minúsculas */
export const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const precioFinal = (p: Pick<Producto, "precio" | "precioOferta">) =>
  p.precioOferta != null && p.precioOferta > 0 && p.precioOferta < p.precio
    ? p.precioOferta
    : p.precio;

export const sinStock = (p: Pick<Producto, "stock">) =>
  p.stock !== null && p.stock <= 0;
