import Image from "next/image";
import Catalogo from "@/components/Catalogo";
import OcultarAlBuscar from "@/components/OcultarAlBuscar";
import { getCategorias, getConfig, getProductos } from "@/lib/data";

// El catálogo se regenera como máximo cada 60 segundos
export const revalidate = 60;

export default async function Home() {
  const [productos, categorias, config] = await Promise.all([getProductos(), getCategorias(), getConfig()]);

  return (
    <div className="space-y-6">
      <OcultarAlBuscar>
      <section className="relative overflow-hidden rounded-3xl bg-white px-6 pb-7 pt-6 text-center shadow-sm ring-1 ring-cacao/5 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,194,14,0.3),transparent_65%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-amarillo via-naranja to-rojo" />
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Entre Naciones"
            width={714}
            height={558}
            priority
            className="h-auto w-full max-w-[300px] drop-shadow-md sm:max-w-[380px]"
          />
          <h1 className="mt-3 max-w-md font-display text-2xl leading-tight text-cacao sm:text-3xl">
            {config.mensajeBanner || "Sabores del mundo, cerca tuyo"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-cacao/70">
            🌎 Comida y productos internacionales · Envío a domicilio o retiro en el local
          </p>
        </div>
      </section>
      </OcultarAlBuscar>

      <Catalogo productos={productos} categorias={categorias} />
    </div>
  );
}
