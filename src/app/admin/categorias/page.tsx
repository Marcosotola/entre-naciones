"use client";

import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/format";
import { toCategoria } from "@/lib/mappers";
import type { Categoria } from "@/lib/types";

const SUGERIDAS: [string, string][] = [
  ["Comida preparada", "🍲"],
  ["Congelados", "🧊"],
  ["Harinas y granos", "🌽"],
  ["Quesos y lácteos", "🧀"],
  ["Snacks y golosinas", "🍬"],
  ["Dulces y chocolates", "🍫"],
  ["Bebidas", "🥤"],
  ["Salsas y condimentos", "🌶️"],
  ["Enlatados y almacén", "🥫"],
];

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("");

  useEffect(
    () =>
      onSnapshot(collection(db, "categorias"), (s) =>
        setCategorias(s.docs.map((d) => toCategoria(d.id, d.data())).sort((a, b) => a.orden - b.orden))
      ),
    []
  );

  const siguienteOrden = () => (categorias?.length ? Math.max(...categorias.map((c) => c.orden)) + 1 : 0);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    await addDoc(collection(db, "categorias"), {
      nombre: nombre.trim(),
      slug: slugify(nombre),
      emoji: emoji.trim() || "🍽️",
      orden: siguienteOrden(),
      activa: true,
    });
    setNombre("");
    setEmoji("");
  };

  const cargarSugeridas = async () => {
    const batch = writeBatch(db);
    SUGERIDAS.forEach(([n, em], i) =>
      batch.set(doc(collection(db, "categorias")), { nombre: n, slug: slugify(n), emoji: em, orden: i, activa: true })
    );
    await batch.commit();
  };

  const mover = async (i: number, dir: -1 | 1) => {
    if (!categorias) return;
    if (!categorias[i + dir]) return;
    const batch = writeBatch(db);
    // Reasignamos el orden según la posición para evitar empates
    categorias.forEach((c, idx) => {
      const nuevo = idx === i ? i + dir : idx === i + dir ? i : idx;
      if (c.orden !== nuevo) batch.update(doc(db, "categorias", c.id), { orden: nuevo });
    });
    await batch.commit();
  };

  const actualizar = (id: string, data: Partial<Categoria>) =>
    updateDoc(doc(db, "categorias", id), { ...data, ...(data.nombre ? { slug: slugify(data.nombre) } : {}) });

  const eliminar = async (c: Categoria) => {
    const usados = await getDocs(query(collection(db, "productos"), where("categoriaId", "==", c.id), limit(1)));
    if (!usados.empty) return alert(`"${c.nombre}" tiene productos. Movelos a otra categoría antes de eliminarla.`);
    if (confirm(`¿Eliminar la categoría "${c.nombre}"?`)) await deleteDoc(doc(db, "categorias", c.id));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Categorías</h1>

      <form onSubmit={crear} className="card flex gap-2 p-3">
        <input className="input w-16 text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🍽️" aria-label="Emoji" maxLength={4} />
        <input className="input flex-1" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva categoría" aria-label="Nombre" />
        <button className="btn-primario px-4" aria-label="Agregar"><Plus className="h-5 w-5" /></button>
      </form>

      {categorias?.length === 0 && (
        <div className="card space-y-3 p-6 text-center">
          <p>Todavía no hay categorías.</p>
          <button onClick={cargarSugeridas} className="btn-secundario">✨ Cargar categorías sugeridas</button>
        </div>
      )}

      <ul className="space-y-2">
        {categorias?.map((c, i) => (
          <li key={c.id} className={`card flex items-center gap-2 p-2 ${c.activa ? "" : "opacity-60"}`}>
            <input
              className="w-12 rounded-lg bg-transparent p-2 text-center text-xl"
              defaultValue={c.emoji}
              onBlur={(e) => e.target.value !== c.emoji && actualizar(c.id, { emoji: e.target.value || "🍽️" })}
              aria-label="Emoji"
            />
            <input
              className="min-w-0 flex-1 rounded-lg bg-transparent p-2 font-bold focus:bg-arena/50 focus:outline-none"
              defaultValue={c.nombre}
              onBlur={(e) => e.target.value.trim() && e.target.value !== c.nombre && actualizar(c.id, { nombre: e.target.value.trim() })}
              aria-label="Nombre"
            />
            <button onClick={() => mover(i, -1)} disabled={i === 0} className="rounded-full p-2 hover:bg-arena disabled:opacity-20" aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
            <button onClick={() => mover(i, 1)} disabled={i === categorias.length - 1} className="rounded-full p-2 hover:bg-arena disabled:opacity-20" aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => actualizar(c.id, { activa: !c.activa })} className="rounded-full p-2 hover:bg-arena" aria-label={c.activa ? "Ocultar" : "Mostrar"}>
              {c.activa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button onClick={() => eliminar(c)} className="rounded-full p-2 text-rojo hover:bg-rojo/10" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-cacao/50">Tocá el nombre o el emoji para editarlo.</p>
    </div>
  );
}
