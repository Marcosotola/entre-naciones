import Catalogo from "@/components/Catalogo";
import { getCategorias, getConfig, getProductos } from "@/lib/data";

// El catálogo se regenera como máximo cada 60 segundos
export const revalidate = 60;

export default async function Home() {
  const [productos, categorias, config] = await Promise.all([getProductos(), getCategorias(), getConfig()]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rojo via-naranja to-amarillo px-6 py-8 text-white shadow-lg sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-bold uppercase tracking-wider text-white/90">🇻🇪 Venezuela · Argentina 🇦🇷</p>
          <h1 className="mt-2 font-display text-4xl leading-tight drop-shadow sm:text-5xl">
            {config.mensajeBanner || "Sabores que unen naciones"}
          </h1>
          <p className="mt-3 text-white/90">
            Pedí online y recibí en tu casa o retirá en el local.
          </p>
        </div>
        <span aria-hidden className="pointer-events-none absolute -bottom-6 -right-4 select-none text-[9rem] leading-none opacity-30 sm:text-[12rem]">
          🫓
        </span>
      </section>

      <Catalogo productos={productos} categorias={categorias} />
    </div>
  );
}
