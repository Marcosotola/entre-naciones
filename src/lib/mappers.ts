import type { DocumentData } from "firebase/firestore";
import type { Categoria, ConfigTienda, Pedido, Producto } from "./types";
import { CONFIG_DEFAULT } from "./types";

const millis = (v: unknown): number =>
  v && typeof v === "object" && "toMillis" in v
    ? (v as { toMillis: () => number }).toMillis()
    : typeof v === "number"
      ? v
      : 0;

export function toProducto(id: string, d: DocumentData): Producto {
  return {
    id,
    nombre: d.nombre ?? "",
    slug: d.slug ?? id,
    descripcion: d.descripcion ?? "",
    presentacion: d.presentacion ?? "",
    precio: Number(d.precio ?? 0),
    precioOferta: d.precioOferta != null ? Number(d.precioOferta) : null,
    origen: d.origen ?? "OTRO",
    categoriaId: d.categoriaId ?? "",
    imagenes: Array.isArray(d.imagenes) ? d.imagenes : [],
    stock: d.stock != null ? Number(d.stock) : null,
    activo: d.activo !== false,
    destacado: Boolean(d.destacado),
    etiquetas: Array.isArray(d.etiquetas) ? d.etiquetas : [],
    actualizado: millis(d.actualizado),
  };
}

export function toCategoria(id: string, d: DocumentData): Categoria {
  return {
    id,
    nombre: d.nombre ?? "",
    slug: d.slug ?? id,
    emoji: d.emoji ?? "🍽️",
    orden: Number(d.orden ?? 0),
    activa: d.activa !== false,
  };
}

export function toConfig(d: DocumentData | undefined): ConfigTienda {
  return { ...CONFIG_DEFAULT, ...(d ?? {}) } as ConfigTienda;
}

export function toPedido(id: string, d: DocumentData): Pedido {
  return { ...(d as Omit<Pedido, "id" | "creado">), id, creado: millis(d.creado) };
}
