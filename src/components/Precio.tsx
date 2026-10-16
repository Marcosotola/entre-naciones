import { formatPrecio, precioFinal } from "@/lib/format";
import type { Producto } from "@/lib/types";

export default function Precio({ producto, grande = false }: { producto: Producto; grande?: boolean }) {
  const final = precioFinal(producto);
  const enOferta = final < producto.precio;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-extrabold text-rojo ${grande ? "text-3xl" : "text-lg"}`}>{formatPrecio(final)}</span>
      {enOferta && (
        <span className={`text-cacao/50 line-through ${grande ? "text-lg" : "text-sm"}`}>
          {formatPrecio(producto.precio)}
        </span>
      )}
    </div>
  );
}
