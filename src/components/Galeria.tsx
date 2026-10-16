"use client";

import Image from "next/image";
import { useState } from "react";

export default function Galeria({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const [activa, setActiva] = useState(0);
  if (imagenes.length === 0) {
    return <div className="card flex aspect-square items-center justify-center text-8xl">🍽️</div>;
  }
  return (
    <div className="space-y-3">
      {/* En celular: carrusel deslizable. En desktop: imagen + miniaturas */}
      <div
        className="no-scrollbar card flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActiva(Math.round(el.scrollLeft / el.clientWidth));
        }}
        id="galeria"
      >
        {imagenes.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0 snap-center">
            <Image src={src} alt={`${alt} - foto ${i + 1}`} fill priority={i === 0} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
      {imagenes.length > 1 && (
        <div className="flex justify-center gap-2">
          {imagenes.map((src, i) => (
            <button
              key={src}
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => {
                const el = document.getElementById("galeria");
                el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`relative h-14 w-14 overflow-hidden rounded-xl ring-2 transition ${i === activa ? "ring-rojo" : "ring-transparent opacity-60"}`}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
