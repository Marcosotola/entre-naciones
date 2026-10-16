"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where,
} from "firebase/firestore";
import { ArrowLeft, ArrowRight, Camera, ChevronLeft, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/format";
import { toCategoria, toProducto } from "@/lib/mappers";
import { borrarImagenes, subirImagen } from "@/lib/storage";
import type { Categoria, Origen } from "@/lib/types";

interface Form {
  nombre: string;
  descripcion: string;
  presentacion: string;
  precio: string;
  precioOferta: string;
  origen: Origen;
  categoriaId: string;
  imagenes: string[];
  controlStock: boolean;
  stock: string;
  activo: boolean;
  destacado: boolean;
  etiquetas: string;
}

const VACIO: Form = {
  nombre: "", descripcion: "", presentacion: "", precio: "", precioOferta: "", origen: "VE", categoriaId: "",
  imagenes: [], controlStock: false, stock: "", activo: true, destacado: false, etiquetas: "",
};

export default function EditarProducto() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const esNuevo = params.id === "nuevo";
  // Para productos nuevos generamos el id antes, así las fotos van a su carpeta
  const [id] = useState(() => (esNuevo ? doc(collection(db, "productos")).id : params.id));
  const [form, setForm] = useState<Form>(VACIO);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(!esNuevo);
  const [subiendo, setSubiendo] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const quitadas = useRef<string[]>([]);
  const inputFotos = useRef<HTMLInputElement>(null);

  useEffect(
    () =>
      onSnapshot(collection(db, "categorias"), (s) =>
        setCategorias(s.docs.map((d) => toCategoria(d.id, d.data())).sort((a, b) => a.orden - b.orden))
      ),
    []
  );

  useEffect(() => {
    if (esNuevo) return;
    getDoc(doc(db, "productos", id)).then((snap) => {
      if (!snap.exists()) {
        setError("El producto no existe");
      } else {
        const p = toProducto(snap.id, snap.data());
        setForm({
          nombre: p.nombre, descripcion: p.descripcion, presentacion: p.presentacion,
          precio: String(p.precio), precioOferta: p.precioOferta != null ? String(p.precioOferta) : "",
          origen: p.origen, categoriaId: p.categoriaId, imagenes: p.imagenes,
          controlStock: p.stock != null, stock: p.stock != null ? String(p.stock) : "",
          activo: p.activo, destacado: p.destacado, etiquetas: p.etiquetas.join(", "),
        });
      }
      setCargando(false);
    });
  }, [esNuevo, id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const agregarFotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const lista = Array.from(files);
    setSubiendo((n) => n + lista.length);
    await Promise.all(
      lista.map(async (file) => {
        try {
          const url = await subirImagen(file, `productos/${id}`);
          setForm((f) => ({ ...f, imagenes: [...f.imagenes, url] }));
        } catch (e) {
          console.error(e);
          setError(`No se pudo subir ${file.name}`);
        } finally {
          setSubiendo((n) => n - 1);
        }
      })
    );
    if (inputFotos.current) inputFotos.current.value = "";
  };

  const moverFoto = (i: number, dir: -1 | 1) => {
    const imgs = [...form.imagenes];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("imagenes", imgs);
  };

  const quitarFoto = (url: string) => {
    quitadas.current.push(url);
    set("imagenes", form.imagenes.filter((u) => u !== url));
  };

  const slugUnico = async (base: string) => {
    let slug = base || id;
    for (let n = 2; ; n++) {
      const snap = await getDocs(query(collection(db, "productos"), where("slug", "==", slug), limit(1)));
      if (snap.empty || snap.docs[0].id === id) return slug;
      slug = `${base}-${n}`;
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const precio = Number(form.precio);
    const oferta = form.precioOferta ? Number(form.precioOferta) : null;
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");
    if (!(precio > 0)) return setError("Ingresá un precio válido");
    if (oferta != null && !(oferta > 0 && oferta < precio)) return setError("El precio de oferta debe ser menor al precio normal");
    if (!form.categoriaId) return setError("Elegí una categoría");

    setGuardando(true);
    try {
      const slug = await slugUnico(slugify(form.nombre));
      await setDoc(doc(db, "productos", id), {
        nombre: form.nombre.trim(),
        slug,
        descripcion: form.descripcion.trim(),
        presentacion: form.presentacion.trim(),
        precio,
        precioOferta: oferta,
        origen: form.origen,
        categoriaId: form.categoriaId,
        imagenes: form.imagenes,
        stock: form.controlStock ? Math.max(0, Math.floor(Number(form.stock) || 0)) : null,
        activo: form.activo,
        destacado: form.destacado,
        etiquetas: form.etiquetas.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        actualizado: serverTimestamp(),
        ...(esNuevo ? { creado: serverTimestamp() } : {}),
      }, { merge: true });
      await borrarImagenes(quitadas.current);
      router.push("/admin/productos");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Revisá tu conexión e intentá de nuevo.");
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar "${form.nombre}"? Esta acción no se puede deshacer.`)) return;
    await borrarImagenes([...form.imagenes, ...quitadas.current]);
    await deleteDoc(doc(db, "productos", id));
    router.push("/admin/productos");
  };

  if (cargando) return <p className="py-10 text-center text-cacao/60">Cargando…</p>;

  return (
    <form onSubmit={guardar} className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/admin/productos" className="rounded-full p-2 hover:bg-arena" aria-label="Volver"><ChevronLeft className="h-6 w-6" /></Link>
        <h1 className="font-display text-2xl sm:text-3xl">{esNuevo ? "Nuevo producto" : "Editar producto"}</h1>
      </div>

      {/* Fotos */}
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Fotos</h2>
          <span className="text-xs text-cacao/60">Cámara, galería o archivos · la primera es la portada</span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {form.imagenes.map((url, i) => (
            <div key={url} className={`relative aspect-square overflow-hidden rounded-xl bg-arena ring-2 ${i === 0 ? "ring-rojo" : "ring-transparent"}`}>
              <Image src={url} alt="" fill sizes="150px" className="object-cover" />
              <button type="button" onClick={() => quitarFoto(url)} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow" aria-label="Quitar foto">
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" onClick={() => moverFoto(i, -1)} disabled={i === 0} className="rounded-full bg-white/90 p-1 shadow disabled:invisible" aria-label="Mover a la izquierda">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => moverFoto(i, 1)} disabled={i === form.imagenes.length - 1} className="rounded-full bg-white/90 p-1 shadow disabled:invisible" aria-label="Mover a la derecha">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: subiendo }).map((_, i) => (
            <div key={`s${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-arena">
              <Loader2 className="h-6 w-6 animate-spin text-rojo" />
            </div>
          ))}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              agregarFotos(e.dataTransfer.files);
            }}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cacao/20 p-1 text-center text-cacao/60 transition hover:border-rojo hover:text-rojo"
          >
            <Camera className="h-7 w-7" />
            <span className="text-xs font-bold">Agregar fotos</span>
            <span className="hidden text-[10px] leading-tight sm:block">Elegí o arrastrá archivos</span>
            <input ref={inputFotos} type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
          </label>
        </div>
      </section>

      {/* Datos */}
      <section className="card grid gap-4 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="nombre">Nombre *</label>
          <input id="nombre" className="input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Harina P.A.N. blanca" required />
        </div>
        <div>
          <label className="label" htmlFor="pres">Presentación</label>
          <input id="pres" className="input" value={form.presentacion} onChange={(e) => set("presentacion", e.target.value)} placeholder="1 kg · Pack x 6 · 12 unidades" />
        </div>
        <div>
          <label className="label" htmlFor="cat">Categoría *</label>
          <select id="cat" className="input" value={form.categoriaId} onChange={(e) => set("categoriaId", e.target.value)} required>
            <option value="">Elegir…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
          </select>
          {categorias.length === 0 && (
            <Link href="/admin/categorias" className="mt-1 block text-xs font-bold text-rojo">Primero creá las categorías →</Link>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="desc">Descripción</label>
          <textarea id="desc" className="input" rows={4} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Ingredientes, cómo se prepara, para cuántas personas…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="tags">Palabras clave para el buscador</label>
          <input id="tags" className="input" value={form.etiquetas} onChange={(e) => set("etiquetas", e.target.value)} placeholder="arepa, harina de maíz, sin tacc" />
        </div>
      </section>

      {/* Precio y stock */}
      <section className="card grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="precio">Precio (ARS) *</label>
          <input id="precio" className="input" type="number" inputMode="numeric" min={0} step="any" value={form.precio} onChange={(e) => set("precio", e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="oferta">Precio de oferta</label>
          <input id="oferta" className="input" type="number" inputMode="numeric" min={0} step="any" value={form.precioOferta} onChange={(e) => set("precioOferta", e.target.value)} placeholder="Vacío = sin oferta" />
        </div>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-rojo" checked={form.controlStock} onChange={(e) => set("controlStock", e.target.checked)} />
          <span className="font-bold">Controlar stock</span>
        </label>
        {form.controlStock && (
          <div>
            <label className="label" htmlFor="stock">Unidades disponibles</label>
            <input id="stock" className="input" type="number" inputMode="numeric" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </div>
        )}
      </section>

      {/* Visibilidad */}
      <section className="card space-y-3 p-4">
        <label className="flex items-center justify-between gap-3">
          <span><span className="font-bold">Visible en la tienda</span><br /><span className="text-xs text-cacao/60">Si lo apagás, el producto queda oculto</span></span>
          <input type="checkbox" className="h-6 w-6 accent-rojo" checked={form.activo} onChange={(e) => set("activo", e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span><span className="font-bold">⭐ Destacado</span><br /><span className="text-xs text-cacao/60">Aparece arriba en la portada</span></span>
          <input type="checkbox" className="h-6 w-6 accent-rojo" checked={form.destacado} onChange={(e) => set("destacado", e.target.checked)} />
        </label>
      </section>

      {error && <p className="rounded-xl bg-rojo/10 p-3 text-sm font-bold text-rojo">{error}</p>}

      <div className="sticky bottom-20 z-20 flex gap-3 md:bottom-4">
        {!esNuevo && (
          <button type="button" onClick={eliminar} className="btn bg-white text-rojo ring-1 ring-rojo/30" aria-label="Eliminar producto">
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button type="submit" disabled={guardando || subiendo > 0} className="btn-primario flex-1 shadow-lg">
          {guardando ? "Guardando…" : subiendo > 0 ? "Subiendo fotos…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
