"use client";

import Image from "next/image";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "entre-naciones:instalar-cerrado";
const DIAS_OCULTO = 14;

function cerradoHace() {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return Date.now() - t < DIAS_OCULTO * 864e5;
  } catch {
    return false;
  }
}

/** Registra el service worker y ofrece instalar la app (Android/PC) o explica cómo hacerlo en iPhone. */
export default function InstalarApp() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [esIOS, setEsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }

    const instalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (instalada || cerradoHace()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iPhone/iPad no tienen botón automático: mostramos instrucciones
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      timer = setTimeout(() => {
        setEsIOS(true);
        setVisible(true);
      }, 4000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const cerrar = () => {
    setVisible(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md sm:bottom-6">
      <div className="card flex items-start gap-3 p-4 shadow-xl ring-1 ring-cacao/10">
        <Image src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-cacao/10" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">Instalá Entre Naciones</p>
          {esIOS ? (
            <p className="mt-1 text-sm text-cacao/70">
              Tocá <Share className="inline h-4 w-4 align-text-bottom text-blue-600" /> <b>Compartir</b> y después{" "}
              <SquarePlus className="inline h-4 w-4 align-text-bottom" /> <b>Agregar a inicio</b>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-cacao/70">Tené la tienda en tu pantalla de inicio, como una app.</p>
              <button onClick={instalar} className="btn-primario mt-3 px-4 py-2 text-sm">
                <Download className="h-4 w-4" /> Instalar
              </button>
            </>
          )}
        </div>
        <button onClick={cerrar} aria-label="Cerrar" className="-m-1 rounded-full p-1 text-cacao/50 hover:bg-arena">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
