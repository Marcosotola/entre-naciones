"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useBusqueda } from "@/lib/busqueda";

export default function Header() {
  const { cantidadTotal, listo } = useCart();
  const { busqueda, setBusqueda } = useBusqueda();
  const pathname = usePathname();
  const router = useRouter();

  const onChange = (v: string) => {
    setBusqueda(v);
    // Si busca desde otra página, lo llevamos al catálogo
    if (pathname !== "/") router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-cacao/5 bg-crema/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/40" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => pathname !== "/" && router.prefetch("/")}
            placeholder="Buscá arepas, tequeños, harina P.A.N.…"
            className="input rounded-full! py-2.5 pl-11 pr-10 shadow-sm [&::-webkit-search-cancel-button]:hidden"
            aria-label="Buscar productos"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-cacao/50 hover:bg-arena"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Link
          href="/carrito"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-cacao/10 transition hover:bg-arena"
          aria-label={`Carrito (${cantidadTotal} productos)`}
        >
          <ShoppingCart className="h-5 w-5" />
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
