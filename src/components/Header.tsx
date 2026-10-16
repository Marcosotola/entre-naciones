"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { cantidadTotal, listo } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-cacao/5 bg-crema/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Entre Naciones - inicio" className="flex items-center">
          <Image src="/logo.png" alt="Entre Naciones" width={92} height={72} priority className="h-12 w-auto" />
        </Link>
        <Link
          href="/carrito"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-cacao/10 transition hover:bg-arena"
          aria-label={`Carrito (${cantidadTotal} productos)`}
        >
          <ShoppingBag className="h-5 w-5" />
          {listo && cantidadTotal > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rojo px-1 text-xs font-bold text-white">
              {cantidadTotal}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
