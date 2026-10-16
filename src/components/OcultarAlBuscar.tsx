"use client";

import { useBusqueda } from "@/lib/busqueda";

/** Oculta su contenido mientras hay una búsqueda activa, para que los resultados queden arriba. */
export default function OcultarAlBuscar({ children }: { children: React.ReactNode }) {
  const { busqueda } = useBusqueda();
  return busqueda.trim() ? null : <>{children}</>;
}
