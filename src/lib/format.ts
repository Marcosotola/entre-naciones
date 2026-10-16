import type { Origen, Producto } from "./types";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatPrecio = (n: number) => ars.format(n);

export const ORIGENES: Record<Origen, { label: string; bandera: string }> = {
  VE: { label: "Venezuela", bandera: "🇻🇪" },
  AR: { label: "Argentina", bandera: "🇦🇷" },
  OTRO: { label: "Otros", bandera: "🌎" },
};

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
