import type { ConfigTienda } from "@/lib/types";
import { Clock, AtSign, MapPin } from "lucide-react";

export default function Footer({ config }: { config: ConfigTienda }) {
  return (
    <footer className="mt-12 bg-cacao text-crema">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-amarillo">Entre Naciones</p>
          <p className="mt-1 text-sm text-crema/70">Sabores de Venezuela 🇻🇪 y Argentina 🇦🇷</p>
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
        {config.instagram && (
          <a
            href={`https://instagram.com/${config.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-amarillo"
          >
            <AtSign className="h-4 w-4" /> @{config.instagram.replace("@", "")}
          </a>
        )}
      </div>
      <p className="border-t border-crema/10 py-4 text-center text-xs text-crema/50">
        © {new Date().getFullYear()} Entre Naciones
      </p>
    </footer>
  );
}
