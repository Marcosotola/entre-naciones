"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/whatsapp";

export default function WhatsAppFlotante({ numero }: { numero: string }) {
  const pathname = usePathname();
  if (!numero || pathname === "/carrito") return null;
  return (
    <a
      href={linkWhatsApp(numero, "¡Hola! Tengo una consulta 😊")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
