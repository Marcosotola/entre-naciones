import type { ConfigTienda } from "@/lib/types";
import Link from "next/link";
import { Clock, Lock, MapPin } from "lucide-react";
import RedesSociales from "./RedesSociales";

export default function Footer({ config }: { config: ConfigTienda }) {
  return (
    <footer className="mt-12 bg-cacao text-crema">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-amarillo">Entre Naciones</p>
          <p className="mt-1 text-sm text-crema/70">Comida y productos internacionales 🌎</p>
        </div>
        {(config.direccionRetiro || config.horarios) && (
          <div className="space-y-2 text-sm">
            {config.direccionRetiro && (
              <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-amarillo" />{config.direccionRetiro}</p>
            )}
            {config.horarios && (
              <p className="flex gap-2 whitespace-pre-line"><Clock className="h-4 w-4 shrink-0 text-amarillo" />{config.horarios}</p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <RedesSociales config={config} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-crema/10 py-4 text-xs text-crema/50">
        <span>© {new Date().getFullYear()} Entre Naciones</span>
        <span aria-hidden>·</span>
        <Link href="/admin" className="inline-flex items-center gap-1 hover:text-amarillo">
          <Lock className="h-3 w-3" /> Administración
        </Link>
      </div>
    </footer>
  );
}
