"use client";

import Image from "next/image";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Bike, Minus, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { formatPrecio } from "@/lib/format";
import type { ConfigTienda, Pedido } from "@/lib/types";
import { linkWhatsApp, mensajePedido } from "@/lib/whatsapp";

const generarCodigo = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export default function Checkout({ config }: { config: ConfigTienda }) {
  const { items, subtotal, listo, cambiarCantidad, quitar, vaciar } = useCart();
  const hayEnvio = config.zonas.length > 0;
  const [entrega, setEntrega] = useState<"retiro" | "envio">("retiro");
  const [zonaId, setZonaId] = useState("");
  const [pago, setPago] = useState<"transferencia" | "efectivo">("transferencia");
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "", notas: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const zona = config.zonas.find((z) => z.id === zonaId);
  const envioGratis = config.envioGratisDesde != null && config.envioGratisDesde > 0 && subtotal >= config.envioGratisDesde;
  const envio = entrega === "envio" && zona ? (envioGratis ? 0 : zona.costo) : 0;
  const total = subtotal + envio;
  const faltaMinimo = config.pedidoMinimo > 0 && subtotal < config.pedidoMinimo;

  if (!listo) return <div className="h-64 animate-pulse rounded-3xl bg-arena/60" />;

  if (items.length === 0) {
    return (
      <div className="card mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="font-display text-2xl">Tu carrito está vacío</h1>
        <p className="text-cacao/70">¡Date una vuelta por el catálogo y llevate algo rico!</p>
        <Link href="/" className="btn-primario">Ver productos</Link>
      </div>
    );
  }

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (entrega === "envio" && !zona) return setError("Elegí la zona de envío.");
    if (!config.whatsapp) return setError("La tienda todavía no configuró su WhatsApp. Probá más tarde.");

    setEnviando(true);
    const pedido: Omit<Pedido, "id" | "creado"> = {
      codigo: generarCodigo(),
      items: items.map((i) => ({
        productoId: i.productoId,
        nombre: i.nombre,
        presentacion: i.presentacion,
        precio: i.precio,
        cantidad: i.cantidad,
        imagen: i.imagen,
      })),
      subtotal,
      envio,
      total,
      entrega,
      zona: entrega === "envio" && zona ? zona.nombre : null,
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        direccion: entrega === "envio" ? cliente.direccion.trim() : "",
        notas: cliente.notas.trim(),
      },
      pago,
      estado: "nuevo",
    };

    // Guardamos el pedido para que aparezca en el panel admin.
    // Si falla, igual mandamos el WhatsApp para no perder la venta.
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, "pedidos"), { ...pedido, creado: serverTimestamp() });
      } catch (err) {
        console.error("No se pudo guardar el pedido", err);
      }
    }

    const url = linkWhatsApp(config.whatsapp, mensajePedido(pedido, config));
    vaciar();
    window.location.assign(url);
  };

  return (
    <form onSubmit={confirmar} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Tu pedido</h1>

        {/* Items */}
        <ul className="card divide-y divide-cacao/5">
          {items.map((i) => (
            <li key={i.productoId} className="flex gap-3 p-3">
              <Link href={`/producto/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-arena">
                {i.imagen ? <Image src={i.imagen} alt={i.nombre} fill sizes="80px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-3xl">🍽️</span>}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <p className="line-clamp-2 font-bold leading-tight">{i.nombre}</p>
                  <button type="button" onClick={() => quitar(i.productoId)} aria-label="Quitar" className="p-1 text-cacao/40 hover:text-rojo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {i.presentacion && <p className="text-xs text-cacao/60">{i.presentacion}</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full ring-1 ring-cacao/15">
                    <button type="button" className="p-2" onClick={() => cambiarCantidad(i.productoId, i.cantidad - 1)} aria-label="Restar">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{i.cantidad}</span>
                    <button type="button" className="p-2" onClick={() => cambiarCantidad(i.productoId, i.cantidad + 1)} aria-label="Sumar">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-extrabold">{formatPrecio(i.precio * i.cantidad)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Entrega */}
        <section className="space-y-3">
          <h2 className="font-display text-xl">¿Cómo lo recibís?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: "retiro" as const, icon: Store, t: "Retiro en el local", s: "Sin costo" },
              ...(hayEnvio ? [{ v: "envio" as const, icon: Bike, t: "Envío a domicilio", s: "Según zona" }] : []),
            ].map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setEntrega(o.v)}
                className={`card flex flex-col items-start gap-1 p-4 text-left ring-2 transition ${entrega === o.v ? "ring-rojo" : "ring-transparent"}`}
              >
                <o.icon className="h-6 w-6 text-rojo" />
                <span className="font-bold leading-tight">{o.t}</span>
                <span className="text-xs text-cacao/60">{o.s}</span>
              </button>
            ))}
          </div>
          {entrega === "retiro" && config.direccionRetiro && (
            <p className="text-sm text-cacao/70">📍 {config.direccionRetiro}{config.horarios && ` · ${config.horarios}`}</p>
          )}
          {entrega === "envio" && (
            <div className="space-y-3">
              <select className="input" value={zonaId} onChange={(e) => setZonaId(e.target.value)} required>
                <option value="">Elegí tu zona…</option>
                {config.zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} — {envioGratis ? "Gratis" : formatPrecio(z.costo)}
                  </option>
                ))}
              </select>
              {config.envioGratisDesde != null && config.envioGratisDesde > 0 && !envioGratis && (
                <p className="text-sm text-cacao/70">
                  🎉 Te faltan {formatPrecio(config.envioGratisDesde - subtotal)} para envío gratis
                </p>
              )}
            </div>
          )}
        </section>

        {/* Datos */}
        <section className="space-y-3">
          <h2 className="font-display text-xl">Tus datos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="nombre">Nombre y apellido</label>
              <input id="nombre" className="input" required autoComplete="name" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="tel">Teléfono</label>
              <input id="tel" className="input" required type="tel" autoComplete="tel" inputMode="tel" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            </div>
            {entrega === "envio" && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="dir">Dirección de entrega</label>
                <input id="dir" className="input" required autoComplete="street-address" placeholder="Calle, número, piso/depto, barrio" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notas">Notas (opcional)</label>
              <textarea id="notas" className="input" rows={2} placeholder="Ej: tocar timbre 2B, horario preferido…" value={cliente.notas} onChange={(e) => setCliente({ ...cliente, notas: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">¿Cómo pagás?</h2>
          <div className="grid grid-cols-2 gap-3">
            {(["transferencia", "efectivo"] as const).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPago(p)}
                className={`card p-4 font-bold ring-2 transition ${pago === p ? "ring-rojo" : "ring-transparent"}`}
              >
                {p === "transferencia" ? "🏦 Transferencia" : "💵 Efectivo"}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-3 p-5">
          <h2 className="font-display text-xl">Resumen</h2>
          <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{formatPrecio(subtotal)}</span></div>
          {entrega === "envio" && (
            <div className="flex justify-between">
              <span>Envío</span>
              <span className="font-bold">{zona ? (envio === 0 ? "Gratis" : formatPrecio(envio)) : "—"}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-cacao/10 pt-3 text-lg">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-rojo">{formatPrecio(total)}</span>
          </div>
          {faltaMinimo && (
            <p className="rounded-xl bg-amarillo/30 p-3 text-sm">El pedido mínimo es de {formatPrecio(config.pedidoMinimo)}.</p>
          )}
          {error && <p className="rounded-xl bg-rojo/10 p-3 text-sm font-bold text-rojo">{error}</p>}
          <button type="submit" className="btn-whatsapp w-full" disabled={enviando || faltaMinimo}>
            {enviando ? "Enviando…" : "Enviar pedido por WhatsApp"}
          </button>
          <p className="text-center text-xs text-cacao/60">
            Te vamos a confirmar el pedido y los datos de pago por WhatsApp.
          </p>
        </div>
      </aside>
    </form>
  );
}
