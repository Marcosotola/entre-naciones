"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Producto } from "./types";
import { precioFinal } from "./format";

export interface CartItem {
  productoId: string;
  slug: string;
  nombre: string;
  presentacion: string;
  precio: number;
  imagen: string | null;
  cantidad: number;
  /** Stock disponible al momento de agregarlo; null = sin límite */
  max: number | null;
}

interface CartCtx {
  items: CartItem[];
  cantidadTotal: number;
  subtotal: number;
  listo: boolean;
  agregar: (p: Producto, cantidad?: number) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  quitar: (productoId: string) => void;
  vaciar: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "entre-naciones:carrito";

// Store externo sobre localStorage: persiste el carrito y lo sincroniza entre pestañas
const VACIO: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function leer(): CartItem[] {
  if (cache === null) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function escribir(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const noop = () => () => {};
const setItems = (fn: (prev: CartItem[]) => CartItem[]) => escribir(fn(leer()));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, leer, () => VACIO);
  // false en el servidor y en la hidratación; true una vez en el cliente
  const listo = useSyncExternalStore(noop, () => true, () => false);
  const limitar = (cant: number, max: number | null) =>
    Math.max(1, max != null ? Math.min(cant, max) : cant);

  const agregar = useCallback((p: Producto, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === p.id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: limitar(i.cantidad + cantidad, p.stock) } : i
        );
      }
      return [
        ...prev,
        {
          productoId: p.id,
          slug: p.slug,
          nombre: p.nombre,
          presentacion: p.presentacion,
          precio: precioFinal(p),
          imagen: p.imagenes[0] ?? null,
          cantidad: limitar(cantidad, p.stock),
          max: p.stock,
        },
      ];
    });
  }, []);

  const cambiarCantidad = useCallback((productoId: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: limitar(cantidad, i.max) } : i))
    );
  }, []);

  const quitar = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const vaciar = useCallback(() => escribir([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      listo,
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      subtotal: items.reduce((s, i) => s + i.cantidad * i.precio, 0),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [items, listo, agregar, cambiarCantidad, quitar, vaciar]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
