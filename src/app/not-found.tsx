import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl">🥟</p>
      <h1 className="font-display text-3xl text-rojo">¡Ups! No encontramos esa página</h1>
      <p className="text-cacao/70">Puede que el producto ya no esté disponible.</p>
      <Link href="/" className="btn-primario">Volver al catálogo</Link>
    </main>
  );
}
