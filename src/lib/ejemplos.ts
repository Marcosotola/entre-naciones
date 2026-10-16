import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./format";
import type { Origen } from "./types";

// Productos de ejemplo para arrancar. Las imágenes son ilustraciones en
// /public/ejemplos: reemplazalas por fotos reales desde el admin.

const CATEGORIAS: [string, string][] = [
  ["Comida preparada", "🍲"],
  ["Harinas y granos", "🌽"],
  ["Bebidas", "🥤"],
  ["Dulces y repostería", "🍰"],
  ["Yerba e infusiones", "🧉"],
];

interface Ejemplo {
  nombre: string;
  presentacion: string;
  descripcion: string;
  precio: number;
  precioOferta?: number;
  origen: Origen;
  categoria: string;
  imagen: string;
  destacado?: boolean;
  etiquetas: string[];
}

const EJEMPLOS: Ejemplo[] = [
  {
    nombre: "Pabellón criollo",
    presentacion: "Plato individual",
    descripcion: "El plato nacional de Venezuela: carne mechada, caraotas negras, arroz blanco y tajadas de plátano maduro frito.",
    precio: 14500, origen: "VE", categoria: "Comida preparada", imagen: "pabellon-criollo", destacado: true,
    etiquetas: ["carne mechada", "caraotas", "plato", "almuerzo"],
  },
  {
    nombre: "Arepa reina pepiada",
    presentacion: "1 unidad",
    descripcion: "Arepa recién hecha rellena de pollo desmechado con palta y mayonesa. Un clásico de las areperas venezolanas.",
    precio: 7500, origen: "VE", categoria: "Comida preparada", imagen: "arepa-reina-pepiada", destacado: true,
    etiquetas: ["arepa", "pollo", "palta", "aguacate"],
  },
  {
    nombre: "Tequeños de queso",
    presentacion: "Docena · listos para freír",
    descripcion: "Bastones de masa crocante rellenos de queso blanco. Vienen congelados: freír 3-4 minutos en aceite bien caliente.",
    precio: 9800, precioOferta: 8900, origen: "VE", categoria: "Comida preparada", imagen: "tequenos", destacado: true,
    etiquetas: ["tequeño", "queso", "congelado", "picada"],
  },
  {
    nombre: "Empanadas criollas",
    presentacion: "Media docena",
    descripcion: "Empanadas argentinas de carne cortada a cuchillo, al horno. Masa casera y repulgue a mano.",
    precio: 9000, origen: "AR", categoria: "Comida preparada", imagen: "empanadas-criollas",
    etiquetas: ["empanada", "carne", "horno"],
  },
  {
    nombre: "Milanesa napolitana con papas fritas",
    presentacion: "Plato individual",
    descripcion: "Milanesa de ternera con salsa de tomate, jamón y muzzarella gratinada, acompañada de papas fritas.",
    precio: 15900, origen: "AR", categoria: "Comida preparada", imagen: "milanesa-napolitana",
    etiquetas: ["milanesa", "napo", "papas fritas", "plato"],
  },
  {
    nombre: "Harina P.A.N. blanca",
    presentacion: "1 kg",
    descripcion: "Harina de maíz blanco precocida, ideal para arepas, empanadas venezolanas y hallacas. Sin TACC.",
    precio: 3900, origen: "VE", categoria: "Harinas y granos", imagen: "harina-pan", destacado: true,
    etiquetas: ["harina", "maiz", "arepas", "sin tacc"],
  },
  {
    nombre: "Malta venezolana",
    presentacion: "Lata 355 ml",
    descripcion: "Bebida de malta sin alcohol, dulce y bien fría. La compañera perfecta de una arepa.",
    precio: 2200, origen: "VE", categoria: "Bebidas", imagen: "malta",
    etiquetas: ["malta", "bebida", "gaseosa"],
  },
  {
    nombre: "Dulce de leche clásico",
    presentacion: "400 g",
    descripcion: "Dulce de leche argentino, cremoso y con el punto justo. Para untar, rellenar alfajores o comer a cucharadas.",
    precio: 3200, precioOferta: 2800, origen: "AR", categoria: "Dulces y repostería", imagen: "dulce-de-leche",
    etiquetas: ["dulce de leche", "postre", "untable"],
  },
  {
    nombre: "Alfajores de chocolate",
    presentacion: "Caja x 6",
    descripcion: "Alfajores rellenos de dulce de leche y bañados en chocolate semiamargo.",
    precio: 8400, origen: "AR", categoria: "Dulces y repostería", imagen: "alfajores",
    etiquetas: ["alfajor", "chocolate", "golosina"],
  },
  {
    nombre: "Yerba mate con palo",
    presentacion: "1 kg",
    descripcion: "Yerba mate tradicional, molienda equilibrada y sabor intenso. Para el mate de todos los días.",
    precio: 5200, origen: "AR", categoria: "Yerba e infusiones", imagen: "yerba-mate",
    etiquetas: ["yerba", "mate", "infusion"],
  },
];

/** Crea las categorías que falten y los 10 productos de ejemplo. */
export async function cargarEjemplos() {
  const snap = await getDocs(collection(db, "categorias"));
  const porSlug = new Map(snap.docs.map((d) => [d.data().slug as string, d.id]));
  let orden = snap.size;
  const batch = writeBatch(db);

  for (const [nombre, emoji] of CATEGORIAS) {
    const slug = slugify(nombre);
    if (porSlug.has(slug)) continue;
    const ref = doc(collection(db, "categorias"));
    batch.set(ref, { nombre, slug, emoji, orden: orden++, activa: true });
    porSlug.set(slug, ref.id);
  }

  for (const e of EJEMPLOS) {
    const slug = slugify(e.nombre);
    batch.set(doc(db, "productos", `ejemplo-${slug}`), {
      nombre: e.nombre,
      slug,
      descripcion: e.descripcion,
      presentacion: e.presentacion,
      precio: e.precio,
      precioOferta: e.precioOferta ?? null,
      origen: e.origen,
      categoriaId: porSlug.get(slugify(e.categoria)),
      imagenes: [`/ejemplos/${e.imagen}.webp`],
      stock: null,
      activo: true,
      destacado: Boolean(e.destacado),
      etiquetas: e.etiquetas,
      creado: serverTimestamp(),
      actualizado: serverTimestamp(),
    });
  }
  await batch.commit();
}
