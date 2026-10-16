"use client";

import Image from "next/image";
import Link from "next/link";
import { collection, deleteDoc, doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { formatPrecio, normalizar, ORIGENES, sinStock } from "@/lib/format";
import { toCategoria, toProducto } from "@/lib/mappers";
import { cargarEjemplos } from "@/lib/ejemplos";
import { borrarImagenes } from "@/lib/storage";
import type { Categoria, Producto } from "@/lib/types";

type Filtro = "todos" | "activos" | "ocultos" | "sin-stock";

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [cargandoEjemplos, setCargandoEjemplos] = useState(false);

  const onCargarEjemplos = async () => {
    setCargandoEjemplos(true);
    try {
      await cargarEjemplos();
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los ejemplos");
    }
    setCargandoEjemplos(false);
  };

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "productos"), (s) =>
      setProductos(s.docs.map((d) => toProducto(d.id, d.data())).sort((a, b) => a.nombre.localeCompare(b.nombre)))
    );
    const u2 = onSnapshot(collection(db, "categorias"), (s) =>
      setCategorias(s.docs.map((d) => toCategoria(d.id, d.data())))
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  const lista = useMemo(() => {
    const q = normalizar(busqueda);
    return (productos ?? []).filter(
      (p) =>
        (!q || normalizar(p.nombre).includes(q)) &&
        (filtro === "todos" ||
          (filtro === "activos" && p.activo) ||
          (filtro === "ocultos" && !p.activo) ||
          (filtro === "sin-stock" && sinStock(p)))
    );
  }, [productos, busqueda, filtro]);

  const cambiar = (id: string, data: Partial<Producto>) =>
    updateDoc(doc(db, "productos", id), { ...data, actualizado: serverTimestamp() });

  const eliminar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    await borrarImagenes(p.imagenes); // primero Storage, después el documento
    await deleteDoc(doc(db, "productos", p.id));
  };

  const nombreCategoria = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? "Sin categoría";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primario">
          <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo producto</span><span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/40" />
        <input className="input pl-10" placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {(["todos", "activos", "ocultos", "sin-stock"] as Filtro[]).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} className={`chip capitalize ${filtro === f ? "bg-cacao text-crema" : "bg-white"}`}>
            {f.replace("-", " ")}
          </button>
        ))}
      </div>

      {productos === null ? (
        <p className="py-10 text-center text-cacao/60">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-2 font-bold">{productos.length === 0 ? "Todavía no cargaste productos" : "Sin resultados"}</p>
          {productos.length === 0 && (
            <div className="mt-4 space-y-2">
              <button onClick={onCargarEjemplos} disabled={cargandoEjemplos} className="btn-secundario">
                {cargandoEjemplos ? "Cargando…" : "✨ Cargar 10 productos de ejemplo"}
              </button>
              <p className="text-xs text-cacao/60">5 menús y 5 productos con imágenes ilustrativas, para editar o borrar después.</p>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => (
            <li key={p.id} className={`card flex items-center gap-3 p-3 ${p.activo ? "" : "opacity-60"}`}>
              <Link href={`/admin/productos/${p.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-arena">
                {p.imagenes[0] ? <Image src={p.imagenes[0]} alt="" fill sizes="64px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-2xl">🍽️</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/productos/${p.id}`} className="block truncate font-bold hover:text-rojo">
                  {ORIGENES[p.origen].bandera} {p.nombre}
                </Link>
                <p className="truncate text-xs text-cacao/60">
                  {nombreCategoria(p.categoriaId)}{p.presentacion && ` · ${p.presentacion}`}
                </p>
                <p className="text-sm">
                  <span className="font-extrabold">{formatPrecio(p.precioOferta ?? p.precio)}</span>
                  {p.precioOferta != null && <span className="ml-1 text-xs text-cacao/50 line-through">{formatPrecio(p.precio)}</span>}
                  <span className={`ml-2 text-xs font-bold ${sinStock(p) ? "text-rojo" : "text-cacao/60"}`}>
                    {p.stock == null ? "" : sinStock(p) ? "Sin stock" : `Stock: ${p.stock}`}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button onClick={() => cambiar(p.id, { destacado: !p.destacado })} className="rounded-full p-2 hover:bg-arena" title="Destacado">
                  <Star className={`h-5 w-5 ${p.destacado ? "fill-amarillo text-naranja" : "text-cacao/30"}`} />
                </button>
                <button onClick={() => cambiar(p.id, { activo: !p.activo })} className="rounded-full p-2 hover:bg-arena" title={p.activo ? "Ocultar" : "Mostrar"}>
                  {p.activo ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-cacao/40" />}
                </button>
                <Link href={`/admin/productos/${p.id}`} className="hidden rounded-full p-2 hover:bg-arena sm:block" title="Editar">
                  <Pencil className="h-5 w-5" />
                </Link>
                <button onClick={() => eliminar(p)} className="hidden rounded-full p-2 text-rojo hover:bg-rojo/10 sm:block" title="Eliminar">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-xs text-cacao/50">{productos?.length ?? 0} productos en total</p>
    </div>
  );
}
