"use client";

import Image from "next/image";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { formatPrecio } from "@/lib/format";
import { toPedido } from "@/lib/mappers";
import type { EstadoPedido, Pedido } from "@/lib/types";
import { linkWhatsApp, telefonoWhatsAppAR } from "@/lib/whatsapp";

const ESTADOS: Record<EstadoPedido, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-amarillo text-cacao" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  pagado: { label: "Pagado", color: "bg-green-100 text-green-800" },
  preparando: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  entregado: { label: "Entregado", color: "bg-cacao/10 text-cacao" },
  cancelado: { label: "Cancelado", color: "bg-rojo/10 text-rojo" },
};

type Filtro = "pendientes" | EstadoPedido | "todos";
const PENDIENTES: EstadoPedido[] = ["nuevo", "confirmado", "pagado", "preparando", "enviado"];

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(
    () =>
      onSnapshot(query(collection(db, "pedidos"), orderBy("creado", "desc"), limit(200)), (s) =>
        setPedidos(s.docs.map((d) => toPedido(d.id, d.data())))
      ),
    []
  );

  const lista = (pedidos ?? []).filter((p) =>
    filtro === "todos" ? true : filtro === "pendientes" ? PENDIENTES.includes(p.estado) : p.estado === filtro
  );

  const eliminar = async (p: Pedido) => {
    if (confirm(`¿Eliminar el pedido #${p.codigo}?`)) await deleteDoc(doc(db, "pedidos", p.id));
  };

  const fecha = (ms: number) =>
    ms ? new Date(ms).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">Pedidos</h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(["pendientes", ...Object.keys(ESTADOS), "todos"] as Filtro[]).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} className={`chip ${filtro === f ? "bg-cacao text-crema" : "bg-white"}`}>
            {f in ESTADOS ? ESTADOS[f as EstadoPedido].label : f === "pendientes" ? "En curso" : "Todos"}
            {f === "nuevo" && pedidos && pedidos.some((p) => p.estado === "nuevo") && (
              <span className="rounded-full bg-rojo px-1.5 text-xs text-white">{pedidos.filter((p) => p.estado === "nuevo").length}</span>
            )}
          </button>
        ))}
      </div>

      {pedidos === null ? (
        <p className="py-10 text-center text-cacao/60">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="card p-10 text-center"><p className="text-4xl">🧾</p><p className="mt-2 font-bold">No hay pedidos acá</p></div>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              <button onClick={() => setAbierto(abierto === p.id ? null : p.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">#{p.codigo} · {p.cliente.nombre}</p>
                  <p className="text-xs text-cacao/60">
                    {fecha(p.creado)} · {p.entrega === "envio" ? `🛵 ${p.zona}` : "🏪 Retiro"} · {p.items.reduce((s, i) => s + i.cantidad, 0)} productos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold">{formatPrecio(p.total)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADOS[p.estado]?.color}`}>{ESTADOS[p.estado]?.label}</span>
                </div>
              </button>

              {abierto === p.id && (
                <div className="space-y-4 border-t border-cacao/10 p-4">
                  <ul className="space-y-2">
                    {p.items.map((i) => (
                      <li key={i.productoId} className="flex items-center gap-3 text-sm">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-arena">
                          {i.imagen && <Image src={i.imagen} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <span className="flex-1">{i.cantidad} × {i.nombre} {i.presentacion && <span className="text-cacao/50">({i.presentacion})</span>}</span>
                        <span className="font-bold">{formatPrecio(i.precio * i.cantidad)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-1 rounded-xl bg-crema p-3 text-sm">
                    <p>Subtotal: {formatPrecio(p.subtotal)}{p.entrega === "envio" && ` · Envío: ${formatPrecio(p.envio)}`}</p>
                    <p>📞 {p.cliente.telefono}</p>
                    {p.cliente.direccion && <p>📍 {p.cliente.direccion}</p>}
                    <p>💳 {p.pago}</p>
                    {p.cliente.notas && <p>📝 {p.cliente.notas}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="input flex-1"
                      value={p.estado}
                      onChange={(e) => updateDoc(doc(db, "pedidos", p.id), { estado: e.target.value })}
                      aria-label="Estado"
                    >
                      {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <a
                      href={linkWhatsApp(telefonoWhatsAppAR(p.cliente.telefono), `¡Hola ${p.cliente.nombre}! Te escribimos de Entre Naciones por tu pedido #${p.codigo}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp"
                    >
                      <MessageCircle className="h-5 w-5" /> Escribir
                    </a>
                    <button onClick={() => eliminar(p)} className="btn bg-white text-rojo ring-1 ring-rojo/30" aria-label="Eliminar pedido">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
