import "server-only";
import { collection, doc, getDoc, getDocs, query, where, limit } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { toCategoria, toConfig, toProducto } from "./mappers";
import type { Categoria, ConfigTienda, Producto } from "./types";
import { CONFIG_DEFAULT } from "./types";

// Lecturas públicas del catálogo, usadas desde Server Components.
// Ante cualquier error (Firebase sin configurar, reglas, red) devuelven
// datos vacíos para que la tienda no se caiga.

export async function getProductos(): Promise<Producto[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, "productos"), where("activo", "==", true)));
    return snap.docs
      .map((d) => toProducto(d.id, d.data()))
      .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre));
  } catch (e) {
    console.error("getProductos", e);
    return [];
  }
}

export async function getProductoPorSlug(slug: string): Promise<Producto | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDocs(
      query(collection(db, "productos"), where("slug", "==", slug), where("activo", "==", true), limit(1))
    );
    const d = snap.docs[0];
    return d ? toProducto(d.id, d.data()) : null;
  } catch (e) {
    console.error("getProductoPorSlug", e);
    return null;
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, "categorias"));
    return snap.docs
      .map((d) => toCategoria(d.id, d.data()))
      .filter((c) => c.activa)
      .sort((a, b) => a.orden - b.orden);
  } catch (e) {
    console.error("getCategorias", e);
    return [];
  }
}

export async function getConfig(): Promise<ConfigTienda> {
  if (!isFirebaseConfigured) return CONFIG_DEFAULT;
  try {
    const snap = await getDoc(doc(db, "configuracion", "tienda"));
    return toConfig(snap.data());
  } catch (e) {
    console.error("getConfig", e);
    return CONFIG_DEFAULT;
  }
}
