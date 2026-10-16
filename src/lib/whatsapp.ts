import type { ConfigTienda, Pedido } from "./types";
import { formatPrecio } from "./format";

export function linkWhatsApp(numero: string, mensaje: string) {
  const n = numero.replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajePedido(p: Omit<Pedido, "id" | "creado">, config: ConfigTienda) {
  const lineas = [
    `¡Hola ${config.nombre}! 👋 Quiero hacer este pedido:`,
    `*Pedido #${p.codigo}*`,
    "",
    ...p.items.map(
      (i) =>
        `• ${i.cantidad} x ${i.nombre}${i.presentacion ? ` (${i.presentacion})` : ""} — ${formatPrecio(i.precio * i.cantidad)}`
    ),
    "",
    `Subtotal: ${formatPrecio(p.subtotal)}`,
  ];
  if (p.entrega === "envio") {
    lineas.push(`Envío (${p.zona}): ${p.envio === 0 ? "Gratis" : formatPrecio(p.envio)}`);
  }
  lineas.push(
    `*Total: ${formatPrecio(p.total)}*`,
    "",
    `👤 ${p.cliente.nombre}`,
    `📞 ${p.cliente.telefono}`,
    p.entrega === "envio" ? `🛵 Envío a: ${p.cliente.direccion}` : `🏪 Retiro en el local`,
    `💳 Pago: ${p.pago === "transferencia" ? "Transferencia" : p.pago === "efectivo" ? "Efectivo" : "Mercado Pago"}`
  );
  if (p.cliente.notas) lineas.push(`📝 ${p.cliente.notas}`);
  return lineas.join("\n");
}

/** Convierte un teléfono argentino cargado a mano (ej: "0351 155-123456") al formato de wa.me */
export function telefonoWhatsAppAR(tel: string) {
  let n = tel.replace(/\D/g, "");
  if (n.startsWith("54")) return n;
  n = n.replace(/^0/, "");
  return `549${n}`;
}
