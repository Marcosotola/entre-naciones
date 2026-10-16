"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { sinStock } from "@/lib/format";
import type { Producto } from "@/lib/types";

export default function AgregarAlCarrito({ producto }: { producto: Producto }) {
  const { agregar, items } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [ok, setOk] = useState(false);
  const agotado = sinStock(producto);
  const enCarrito = items.find((i) => i.productoId === producto.id)?.cantidad ?? 0;
  const max = producto.stock != null ? Math.max(producto.stock - enCarrito, 0) : 99;

  if (agotado) {
    return <p className="rounded-2xl bg-cacao/10 p-4 text-center font-bold">Sin stock por el momento 😕</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex items-center rounded-full bg-white ring-1 ring-cacao/15">
          <button className="p-3" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Restar">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold">{cantidad}</span>
          <button className="p-3" onClick={() => setCantidad((c) => Math.min(max || 1, c + 1))} aria-label="Sumar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          className="btn-primario flex-1"
          disabled={max === 0}
          onClick={() => {
            agregar(producto, cantidad);
            setCantidad(1);
            setOk(true);
          }}
        >
          <ShoppingCart className="h-5 w-5" /> Agregar al carrito
        </button>
      </div>
      {max === 0 && <p className="text-sm text-cacao/60">Ya tenés todo el stock disponible en tu carrito.</p>}
      {ok && (
        <Link href="/carrito" className="btn-secundario w-full">
          ✓ Agregado · Ver carrito ({enCarrito})
        </Link>
      )}
    </div>
  );
}
