import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./format";

// Productos de ejemplo para arrancar. Las imágenes son ilustraciones en
// /public/ejemplos: reemplazalas por fotos reales desde el admin.

const CATEGORIAS: [string, string][] = [
  ["Comida preparada", "🍲"],
  ["Harinas y granos", "🌽"],
  ["Bebidas", "🥤"],
  ["Dulces y chocolates", "🍫"],
  ["Enlatados y almacén", "🥫"],
];

interface Ejemplo {
  nombre: string;
  presentacion: string;
  descripcion: string;
  precio: number;
  precioOferta?: number;
  categoria: string;
  imagen: string;
  destacado?: boolean;
  etiquetas: string[];
}

const EJEMPLOS: Ejemplo[] = [
  // Menús
  {
    nombre: "Pabellón criollo",
    presentacion: "Plato individual",
    descripcion: "El plato nacional de Venezuela: carne mechada, caraotas negras, arroz blanco y tajadas de plátano maduro frito.",
    precio: 14500, categoria: "Comida preparada", imagen: "pabellon-criollo", destacado: true,
    etiquetas: ["carne mechada", "caraotas", "plato", "almuerzo"],
  },
  {
    nombre: "Arepa reina pepiada",
    presentacion: "1 unidad",
    descripcion: "Arepa recién hecha rellena de pollo desmechado con aguacate y mayonesa. Un clásico de las areperas.",
    precio: 7500, categoria: "Comida preparada", imagen: "arepa-reina-pepiada", destacado: true,
    etiquetas: ["arepa", "pollo", "aguacate", "palta"],
  },
  {
    nombre: "Tequeños de queso",
    presentacion: "Docena",
    descripcion: "Bastones de masa crocante rellenos de queso blanco, con salsa de ajo. También los tenemos congelados para freír en casa.",
    precio: 9800, precioOferta: 8900, categoria: "Comida preparada", imagen: "tequenos", destacado: true,
    etiquetas: ["tequeño", "queso", "picada", "pasapalo"],
  },
  {
    nombre: "Empanadas venezolanas",
    presentacion: "3 unidades",
    descripcion: "Empanadas fritas de harina de maíz, crocantes por fuera. Elegí el relleno: carne mechada, pollo, queso o pabellón.",
    precio: 7200, categoria: "Comida preparada", imagen: "empanadas-venezolanas",
    etiquetas: ["empanada", "maiz", "frita", "desayuno"],
  },
  {
    nombre: "Cachapa con queso de mano",
    presentacion: "1 unidad",
    descripcion: "Cachapa de maíz tierno dulce, a la plancha, con queso de mano y mantequilla.",
    precio: 9500, categoria: "Comida preparada", imagen: "cachapa",
    etiquetas: ["cachapa", "maiz", "queso de mano", "desayuno"],
  },
  // Productos
  {
    nombre: "Harina P.A.N. blanca",
    presentacion: "1 kg",
    descripcion: "Harina de maíz blanco precocida, ideal para arepas, empanadas y hallacas. Sin TACC.",
    precio: 3900, categoria: "Harinas y granos", imagen: "harina-pan", destacado: true,
    etiquetas: ["harina", "maiz", "arepas", "sin tacc"],
  },
  {
    nombre: "Malta",
    presentacion: "Lata 355 ml",
    descripcion: "Bebida de malta sin alcohol, dulce y bien fría. La compañera perfecta de una arepa.",
    precio: 2200, categoria: "Bebidas", imagen: "malta",
    etiquetas: ["malta", "bebida", "refresco"],
  },
  {
    nombre: "Toddy",
    presentacion: "400 g",
    descripcion: "Cacao en polvo venezolano para preparar la merengada o la leche chocolatada de siempre.",
    precio: 6800, precioOferta: 5900, categoria: "Bebidas", imagen: "toddy",
    etiquetas: ["toddy", "cacao", "chocolate", "merengada"],
  },
  {
    nombre: "Chocolate Savoy con maní",
    presentacion: "Barra 130 g",
    descripcion: "El chocolate de leche venezolano de toda la vida, con maní.",
    precio: 3500, categoria: "Dulces y chocolates", imagen: "chocolate-savoy",
    etiquetas: ["savoy", "chocolate", "golosina", "mani"],
  },
  {
    nombre: "Diablitos Underwood",
    presentacion: "Lata 115 g",
    descripcion: "Jamón endiablado para untar en arepas, pan o galletas. Infaltable en la despensa venezolana.",
    precio: 2600, categoria: "Enlatados y almacén", imagen: "diablitos",
    etiquetas: ["diablitos", "jamon", "untable", "enlatado"],
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
      origen: "VE",
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
