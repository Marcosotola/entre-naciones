import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./format";

// Productos de ejemplo para arrancar. Las imágenes son ilustraciones en
// /public/ejemplos: reemplazalas por fotos reales desde el admin.

const CATEGORIAS: [string, string][] = [
  ["Comida preparada", "🍲"],
  ["Harinas y granos", "🌽"],
  ["Dulces y chocolates", "🍫"],
  ["Enlatados y almacén", "🥫"],
  ["Bebidas", "🥤"],
];

interface Ejemplo {
  /** Id fijo del documento (si no, se deriva del nombre) */
  id?: string;
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
    id: "ejemplo-chocolate-savoy-con-mani", // id original, antes de renombrarlo
    nombre: "Chocolate Savoy con leche",
    presentacion: "Barra 130 g",
    descripcion: "El chocolate con leche venezolano de toda la vida.",
    precio: 3500, categoria: "Dulces y chocolates", imagen: "chocolate-savoy",
    etiquetas: ["savoy", "chocolate", "golosina", "nestle"],
  },
  {
    nombre: "Té frío Fresh Tea limón",
    presentacion: "Botella 500 ml",
    descripcion: "Té helado sabor limón, listo para tomar. Servilo bien frío.",
    precio: 2500, categoria: "Bebidas", imagen: "fresh-tea-limon",
    etiquetas: ["te", "té frío", "ice tea", "nestea", "limon", "bebida"],
  },
  {
    nombre: "Té frío Fresh Tea durazno",
    presentacion: "Botella 500 ml",
    descripcion: "Té helado sabor durazno, listo para tomar. Servilo bien frío.",
    precio: 2500, categoria: "Bebidas", imagen: "fresh-tea-durazno",
    etiquetas: ["te", "té frío", "ice tea", "nestea", "durazno", "bebida"],
  },
  {
    nombre: "Papelón con limón",
    presentacion: "Vaso 500 ml",
    descripcion: "La bebida más refrescante de Venezuela: papelón (panela) con limón recién exprimido, bien frío. Hecho en casa, sin conservantes.",
    precio: 2000, categoria: "Bebidas", imagen: "papelon-con-limon", destacado: true,
    etiquetas: ["papelon", "panela", "limon", "limonada", "bebida", "refresco", "casero"],
  },
  {
    nombre: "Diablitos Underwood",
    presentacion: "Lata 115 g",
    descripcion: "Jamón endiablado para untar en arepas, pan o galletas. Infaltable en la despensa venezolana.",
    precio: 2600, categoria: "Enlatados y almacén", imagen: "diablitos",
    etiquetas: ["diablitos", "jamon", "untable", "enlatado"],
  },
];

const idEjemplo = (e: Ejemplo) => e.id ?? `ejemplo-${slugify(e.nombre)}`;

async function categoriasPorSlug(batch: ReturnType<typeof writeBatch>) {
  const snap = await getDocs(collection(db, "categorias"));
  const porSlug = new Map(snap.docs.map((d) => [d.data().slug as string, d.id]));
  let orden = snap.size;
  for (const [nombre, emoji] of CATEGORIAS) {
    const slug = slugify(nombre);
    if (porSlug.has(slug)) continue;
    const ref = doc(collection(db, "categorias"));
    batch.set(ref, { nombre, slug, emoji, orden: orden++, activa: true });
    porSlug.set(slug, ref.id);
  }
  return porSlug;
}

function datosProducto(e: Ejemplo, categoriaId: string | undefined) {
  return {
    nombre: e.nombre,
    slug: slugify(e.nombre),
    descripcion: e.descripcion,
    presentacion: e.presentacion,
    precio: e.precio,
    precioOferta: e.precioOferta ?? null,
    origen: "VE",
    categoriaId,
    imagenes: [`/ejemplos/${e.imagen}.webp`],
    stock: null,
    activo: true,
    destacado: Boolean(e.destacado),
    etiquetas: e.etiquetas,
    creado: serverTimestamp(),
    actualizado: serverTimestamp(),
  };
}

/** Crea las categorías que falten y todos los productos de ejemplo. */
export async function cargarEjemplos() {
  const batch = writeBatch(db);
  const porSlug = await categoriasPorSlug(batch);
  for (const e of EJEMPLOS) {
    batch.set(doc(db, "productos", idEjemplo(e)), datosProducto(e, porSlug.get(slugify(e.categoria))));
  }
  batch.set(doc(db, "configuracion", "ejemplos"), { aplicados: [...EJEMPLOS.map(idEjemplo), ...Object.keys(CAMBIOS)] });
  await batch.commit();
}

// Cambios puntuales que se aplican una sola vez sobre los ejemplos ya cargados
const CAMBIOS: Record<string, () => Promise<void>> = {
  "borrar-malta-toddy": async () => {
    await Promise.all(["ejemplo-malta", "ejemplo-toddy"].map((id) => deleteDoc(doc(db, "productos", id))));
  },
  "portada-internacional": async () => {
    const ref = doc(db, "configuracion", "tienda");
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().mensajeBanner === "El sabor de Venezuela, cerca tuyo") {
      await updateDoc(ref, { mensajeBanner: "Sabores del mundo, cerca tuyo" });
    }
  },
  "savoy-con-leche": async () => {
    const ref = doc(db, "productos", "ejemplo-chocolate-savoy-con-mani");
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().nombre === "Chocolate Savoy con maní") {
      await updateDoc(ref, {
        nombre: "Chocolate Savoy con leche",
        slug: "chocolate-savoy-con-leche",
        descripcion: "El chocolate con leche venezolano de toda la vida.",
        etiquetas: ["savoy", "chocolate", "golosina", "nestle"],
        actualizado: serverTimestamp(),
      });
    }
  },
};

/**
 * Si la tienda usa los ejemplos, agrega los productos de ejemplo nuevos y aplica
 * los cambios pendientes. Cada cosa se aplica una sola vez (queda registrada en
 * configuracion/ejemplos), así que si el admin borra o edita un ejemplo no vuelve.
 * Devuelve true si cambió algo.
 */
export async function sincronizarEjemplos(): Promise<boolean> {
  const regRef = doc(db, "configuracion", "ejemplos");
  const reg = await getDoc(regRef);
  let aplicados: string[] = reg.data()?.aplicados ?? [];

  if (!reg.exists()) {
    // Solo si ya se cargaron los ejemplos alguna vez (tiendas sin ejemplos no se tocan)
    const usados = await getDoc(doc(db, "productos", "ejemplo-pabellon-criollo"));
    if (!usados.exists()) return false;
    // Los ejemplos que ya existen cuentan como aplicados
    const existentes = await Promise.all(
      EJEMPLOS.map(async (e) => ((await getDoc(doc(db, "productos", idEjemplo(e)))).exists() ? idEjemplo(e) : null))
    );
    aplicados = existentes.filter((x): x is string => Boolean(x));
  }

  const nuevos = EJEMPLOS.filter((e) => !aplicados.includes(idEjemplo(e)));
  const cambios = Object.keys(CAMBIOS).filter((c) => !aplicados.includes(c));
  if (nuevos.length === 0 && cambios.length === 0) return false;

  for (const c of cambios) await CAMBIOS[c]();

  if (nuevos.length) {
    const batch = writeBatch(db);
    const porSlug = await categoriasPorSlug(batch);
    for (const e of nuevos) {
      batch.set(doc(db, "productos", idEjemplo(e)), datosProducto(e, porSlug.get(slugify(e.categoria))));
    }
    await batch.commit();
  }

  await setDoc(regRef, { aplicados: [...aplicados, ...nuevos.map(idEjemplo), ...cambios] });
  return true;
}
