"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { normalizar, ORIGENES, precioFinal, sinStock } from "@/lib/format";
import type { Categoria, Origen, Producto } from "@/lib/types";
import ProductCard from "./ProductCard";

type Orden = "relevancia" | "menor" | "mayor" | "nombre";

export default function Catalogo({ productos, categorias }: { productos: Producto[]; categorias: Categoria[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [origen, setOrigen] = useState<Origen | "todos">("todos");
  const [categoria, setCategoria] = useState<string>("todas");
  const [orden, setOrden] = useState<Orden>("relevancia");

  // Solo mostramos categorías que tengan productos
  const categoriasConProductos = useMemo(
    () => categorias.filter((c) => productos.some((p) => p.categoriaId === c.id)),
    [categorias, productos]
  );
  const origenesPresentes = useMemo(
    () => (Object.keys(ORIGENES) as Origen[]).filter((o) => productos.some((p) => p.origen === o)),
    [productos]
  );

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const lista = productos.filter(
      (p) =>
        (origen === "todos" || p.origen === origen) &&
        (categoria === "todas" || p.categoriaId === categoria) &&
        (!q ||
          normalizar(`${p.nombre} ${p.descripcion} ${p.etiquetas.join(" ")}`).includes(q))
    );
    const conStockPrimero = (a: Producto, b: Producto) => Number(sinStock(a)) - Number(sinStock(b));
    return lista.sort((a, b) => {
      if (orden === "menor") return precioFinal(a) - precioFinal(b);
      if (orden === "mayor") return precioFinal(b) - precioFinal(a);
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      return conStockPrimero(a, b) || Number(b.destacado) - Number(a.destacado);
    });
  }, [productos, busqueda, origen, categoria, orden]);

  const hayFiltros = busqueda || origen !== "todos" || categoria !== "todas";
  const destacados = productos.filter((p) => p.destacado && !sinStock(p));

  const chipClase = (activo: boolean) =>
    `chip ${activo ? "bg-cacao text-crema ring-cacao" : "bg-white hover:bg-arena"}`;

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/40" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscá harina P.A.N., tequeños, alfajores…"
          className="input rounded-full! py-3.5 pl-12 shadow-sm"
          aria-label="Buscar productos"
        />
      </div>

      {/* Origen */}
      {origenesPresentes.length > 1 && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setOrigen("todos")} className={`${chipClase(origen === "todos")} justify-center px-2 sm:px-4`}>
            🌎 Todos
          </button>
          {origenesPresentes.filter((o) => o !== "OTRO").map((o) => (
            <button key={o} onClick={() => setOrigen(o)} className={`${chipClase(origen === o)} justify-center px-2 sm:px-4`}>
              {ORIGENES[o].bandera} {ORIGENES[o].label}
            </button>
          ))}
        </div>
      )}

      {/* Categorías */}
      {categoriasConProductos.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button onClick={() => setCategoria("todas")} className={chipClase(categoria === "todas")}>
            Todas
          </button>
          {categoriasConProductos.map((c) => (
            <button key={c.id} onClick={() => setCategoria(c.id)} className={chipClase(categoria === c.id)}>
              <span>{c.emoji}</span> {c.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Destacados (solo sin filtros) */}
      {!hayFiltros && destacados.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl text-rojo">⭐ Destacados</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {destacados.map((p) => (
              <div key={p.id} className="w-40 shrink-0 snap-start sm:w-52">
                <ProductCard producto={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl text-cacao">
            {hayFiltros ? `${filtrados.length} resultado${filtrados.length === 1 ? "" : "s"}` : "Todos los productos"}
          </h2>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="rounded-full border border-cacao/15 bg-white px-3 py-2 text-sm font-semibold"
            aria-label="Ordenar"
          >
            <option value="relevancia">Relevancia</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
            <option value="nombre">A-Z</option>
          </select>
        </div>

        {filtrados.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-5xl">🔎</p>
            <p className="font-bold">
              {productos.length === 0 ? "Pronto vas a ver nuestros productos acá" : "No encontramos productos con esos filtros"}
            </p>
            {hayFiltros && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setOrigen("todos");
                  setCategoria("todas");
                }}
                className="btn-secundario"
              >
                <X className="h-4 w-4" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
