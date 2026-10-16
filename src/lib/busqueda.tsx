"use client";

import { createContext, useContext, useState } from "react";

// Texto del buscador del header, compartido con el catálogo
const Ctx = createContext<{ busqueda: string; setBusqueda: (v: string) => void } | null>(null);

export function BusquedaProvider({ children }: { children: React.ReactNode }) {
  const [busqueda, setBusqueda] = useState("");
  return <Ctx.Provider value={{ busqueda, setBusqueda }}>{children}</Ctx.Provider>;
}

export function useBusqueda() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBusqueda debe usarse dentro de <BusquedaProvider>");
  return ctx;
}
