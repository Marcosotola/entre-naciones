import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import AgregarAlCarrito from "@/components/AgregarAlCarrito";
import Galeria from "@/components/Galeria";
import Precio from "@/components/Precio";
import ProductCard from "@/components/ProductCard";
import { getCategorias, getProductoPorSlug, getProductos } from "@/lib/data";
import { pais, precioFinal, sinStock } from "@/lib/format";

export const revalidate = 60;

// Las páginas de producto se generan a demanda y se cachean (ISR)
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductoPorSlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.nombre,
    description: p.descripcion.slice(0, 160) || `${p.nombre} de ${pais(p.origen).label} - Entre Naciones`,
    openGraph: { images: p.imagenes.slice(0, 1) },
  };
}

export default async function ProductoPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const producto = await getProductoPorSlug(slug);
  if (!producto) notFound();

  const [categorias, todos] = await Promise.all([getCategorias(), getProductos()]);
  const categoria = categorias.find((c) => c.id === producto.categoriaId);
  const relacionados = todos
    .filter((p) => p.id !== producto.id && p.categoriaId === producto.categoriaId && !sinStock(p))
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    image: producto.imagenes,
    description: producto.descripcion,
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: precioFinal(producto),
      availability: sinStock(producto) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-cacao/70 hover:text-rojo">
        <ChevronLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Galeria imagenes={producto.imagenes} alt={producto.nombre} />
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="chip bg-white">{pais(producto.origen).bandera} {pais(producto.origen).label}</span>
            {categoria && <span className="chip bg-white">{categoria.emoji} {categoria.nombre}</span>}
          </div>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{producto.nombre}</h1>
          {producto.presentacion && <p className="text-cacao/60">{producto.presentacion}</p>}
          <Precio producto={producto} grande />
          <AgregarAlCarrito producto={producto} />
          {producto.descripcion && (
            <div className="card p-4">
              <h2 className="mb-2 font-bold">Descripción</h2>
              <p className="whitespace-pre-line text-cacao/80">{producto.descripcion}</p>
            </div>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl text-rojo">También te puede gustar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relacionados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
