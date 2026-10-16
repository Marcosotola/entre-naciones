"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { toConfig } from "@/lib/mappers";
import type { ConfigTienda } from "@/lib/types";
import { refrescarTienda } from "@/lib/refrescar";

export default function AdminConfiguracion() {
  const [config, setConfig] = useState<ConfigTienda | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    getDoc(doc(db, "configuracion", "tienda")).then((s) => setConfig(toConfig(s.data())));
  }, []);

  if (!config) return <p className="py-10 text-center text-cacao/60">Cargando…</p>;

  const set = <K extends keyof ConfigTienda>(k: K, v: ConfigTienda[K]) => setConfig({ ...config, [k]: v });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    try {
      await setDoc(doc(db, "configuracion", "tienda"), {
        ...config,
        whatsapp: config.whatsapp.replace(/\D/g, ""),
        zonas: config.zonas.filter((z) => z.nombre.trim()).map((z) => ({ ...z, nombre: z.nombre.trim(), costo: Number(z.costo) || 0 })),
      });
      await refrescarTienda();
      setMensaje("✓ Guardado. Ya se ve en la tienda.");
    } catch {
      setMensaje("No se pudo guardar");
    }
    setGuardando(false);
  };

  return (
    <form onSubmit={guardar} className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Ajustes de la tienda</h1>

      <section className="card space-y-4 p-4">
        <h2 className="font-bold">Contacto y redes</h2>
        <div>
          <label className="label" htmlFor="wa">WhatsApp donde llegan los pedidos *</label>
          <input id="wa" className="input" inputMode="tel" required value={config.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="5493511234567" />
          <p className="mt-1 text-xs text-cacao/60">Con código de país y área, sin 0 ni 15. Ej: 54 9 351 1234567</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="ig">Instagram</label>
            <input id="ig" className="input" value={config.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@entrenaciones" />
          </div>
          <div>
            <label className="label" htmlFor="fb">Facebook</label>
            <input id="fb" className="input" value={config.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="entrenaciones" />
          </div>
          <div>
            <label className="label" htmlFor="tt">TikTok</label>
            <input id="tt" className="input" value={config.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="@entrenaciones" />
          </div>
        </div>
        <p className="-mt-2 text-xs text-cacao/60">Usuario o link del perfil. Las que dejes vacías no se muestran.</p>
        <div>
          <label className="label" htmlFor="banner">Frase de la portada</label>
          <input id="banner" className="input" value={config.mensajeBanner} onChange={(e) => set("mensajeBanner", e.target.value)} />
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <h2 className="font-bold">🏪 Retiro en el local</h2>
        <div>
          <label className="label" htmlFor="dir">Dirección</label>
          <input id="dir" className="input" value={config.direccionRetiro} onChange={(e) => set("direccionRetiro", e.target.value)} placeholder="Av. Siempre Viva 123, Córdoba" />
        </div>
        <div>
          <label className="label" htmlFor="hor">Horarios</label>
          <textarea id="hor" className="input" rows={2} value={config.horarios} onChange={(e) => set("horarios", e.target.value)} placeholder="Lun a Sáb de 10 a 20 hs" />
        </div>
      </section>

      <section className="card space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">🛵 Zonas de envío</h2>
          <button
            type="button"
            className="btn-secundario px-3 py-2 text-sm"
            onClick={() => set("zonas", [...config.zonas, { id: Math.random().toString(36).slice(2, 9), nombre: "", costo: 0 }])}
          >
            <Plus className="h-4 w-4" /> Zona
          </button>
        </div>
        {config.zonas.length === 0 && <p className="text-sm text-cacao/60">Sin zonas = solo retiro en el local.</p>}
        {config.zonas.map((z, i) => (
          <div key={z.id} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Barrio / zona"
              value={z.nombre}
              onChange={(e) => set("zonas", config.zonas.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
            />
            <input
              className="input w-28"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="$"
              value={z.costo || ""}
              onChange={(e) => set("zonas", config.zonas.map((x, j) => (j === i ? { ...x, costo: Number(e.target.value) } : x)))}
              aria-label="Costo"
            />
            <button type="button" onClick={() => set("zonas", config.zonas.filter((_, j) => j !== i))} className="rounded-full p-2 text-rojo hover:bg-rojo/10" aria-label="Quitar zona">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="gratis">Envío gratis desde ($)</label>
            <input id="gratis" className="input" type="number" inputMode="numeric" min={0} value={config.envioGratisDesde ?? ""} onChange={(e) => set("envioGratisDesde", e.target.value ? Number(e.target.value) : null)} placeholder="Vacío = nunca" />
          </div>
          <div>
            <label className="label" htmlFor="min">Pedido mínimo ($)</label>
            <input id="min" className="input" type="number" inputMode="numeric" min={0} value={config.pedidoMinimo || ""} onChange={(e) => set("pedidoMinimo", Number(e.target.value) || 0)} placeholder="0" />
          </div>
        </div>
      </section>

      {mensaje && <p className="text-center text-sm font-bold">{mensaje}</p>}
      <button className="btn-primario sticky bottom-20 w-full shadow-lg md:bottom-4" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
}
