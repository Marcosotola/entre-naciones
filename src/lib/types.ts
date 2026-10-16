export type Origen = "VE" | "AR" | "OTRO";

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  /** Ej: "1 kg", "500 g", "Pack x 6" */
  presentacion: string;
  precio: number;
  /** Precio promocional; null si no hay oferta */
  precioOferta: number | null;
  origen: Origen;
  categoriaId: string;
  /** URLs de Firebase Storage; la primera es la portada */
  imagenes: string[];
  /** null = sin control de stock */
  stock: number | null;
  activo: boolean;
  destacado: boolean;
  etiquetas: string[];
  actualizado: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  emoji: string;
  orden: number;
  activa: boolean;
}

export interface Zona {
  id: string;
  nombre: string;
  costo: number;
}

export interface ConfigTienda {
  nombre: string;
  /** Solo números con código de país, ej: 5493511234567 */
  whatsapp: string;
  direccionRetiro: string;
  horarios: string;
  mensajeBanner: string;
  zonas: Zona[];
  envioGratisDesde: number | null;
  pedidoMinimo: number;
  instagram: string;
  facebook: string;
  tiktok: string;
}

export type EstadoPedido =
  | "nuevo"
  | "confirmado"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

export interface ItemPedido {
  productoId: string;
  nombre: string;
  presentacion: string;
  precio: number;
  cantidad: number;
  imagen: string | null;
}

export interface Pedido {
  id: string;
  codigo: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  total: number;
  entrega: "retiro" | "envio";
  zona: string | null;
  cliente: {
    nombre: string;
    telefono: string;
    direccion: string;
    notas: string;
  };
  pago: "transferencia" | "efectivo" | "mercadopago";
  estado: EstadoPedido;
  creado: number;
}

export const CONFIG_DEFAULT: ConfigTienda = {
  nombre: "Entre Naciones",
  whatsapp: "",
  direccionRetiro: "",
  horarios: "",
  mensajeBanner: "El sabor de Venezuela, cerca tuyo",
  zonas: [],
  envioGratisDesde: null,
  pedidoMinimo: 0,
  instagram: "",
  facebook: "",
  tiktok: "",
};
