"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { pais, precioFinal, sinStock } from "@/lib/format";
import type { Producto } from "@/lib/types";
import Precio from "./Precio";

export default function ProductCard({ producto }: { producto: Producto }) {
  const { agregar } = useCart();
  const [agregado, setAgregado] = useState(false);
  const agotado = sinStock(producto);
  const descuento =
    precioFinal(producto) < producto.precio
      ? Math.round((1 - precioFinal(producto) / producto.precio) * 100)
      : 0;

  const onAgregar = () => {
    agregar(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
  };

  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link href={`/producto/${producto.slug}`} className="relative block aspect-square bg-arena/50">
        {producto.imagenes[0] ? (
          <Image
            src={producto.imagenes[0]}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className={`object-cover transition duration-300 group-hover:scale-105 ${agotado ? "grayscale" : ""}`}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-5xl">🍽️</span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-sm shadow-sm" title={pais(producto.origen).label}>
          {pais(producto.origen).bandera}
        </span>
        {descuento > 0 && !agotado && (
          <span className="absolute right-2 top-2 rounded-full bg-amarillo px-2 py-0.5 text-xs font-extrabold text-cacao">
            -{descuento}%
          </span>
        )}
        {agotado && (
          <span className="absolute inset-x-0 bottom-0 bg-cacao/80 py-1 text-center text-xs font-bold text-white">
            Sin stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/producto/${producto.slug}`} className="line-clamp-2 font-bold leading-tight hover:text-rojo">
          {producto.nombre}
        </Link>
        {producto.presentacion && <p className="text-xs text-cacao/60">{producto.presentacion}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Precio producto={producto} />
          <button
            onClick={onAgregar}
            disabled={agotado}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow transition active:scale-90 disabled:bg-cacao/20 ${
              agregado ? "bg-green-600" : "bg-rojo hover:bg-rojo-oscuro"
            }`}
          >
            {agregado ? "✓" : <Plus className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
}
