"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ClipboardList, LogOut, Package, Settings, Store, Tags } from "lucide-react";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

const NAV = [
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/configuracion", label: "Ajustes", icon: Settings },
];

type Estado = "cargando" | "sin-sesion" | "sin-permiso" | "ok";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u?.email) return setEstado("sin-sesion");
      try {
        // Un usuario es admin si existe admins/{email}
        const snap = await getDoc(doc(db, "admins", u.email.toLowerCase()));
        setEstado(snap.exists() ? "ok" : "sin-permiso");
      } catch {
        setEstado("sin-permiso");
      }
    });
  }, []);

  const ingresar = async () => {
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <Pantalla>
        <p className="font-bold">Firebase no está configurado.</p>
        <p className="text-sm text-cacao/70">Completá las variables de <code>.env.local</code> (ver README).</p>
      </Pantalla>
    );
  }

  if (estado === "cargando") {
    return <Pantalla><div className="h-8 w-8 animate-spin rounded-full border-4 border-rojo border-t-transparent" /></Pantalla>;
  }

  if (estado === "sin-sesion") {
    return (
      <Pantalla>
        <h1 className="font-display text-2xl">Panel de administración</h1>
        <button onClick={ingresar} className="btn-primario w-full">Ingresar con Google</button>
        {error && <p className="text-sm text-rojo">{error}</p>}
      </Pantalla>
    );
  }

  if (estado === "sin-permiso") {
    return (
      <Pantalla>
        <p className="font-bold">La cuenta {user?.email} no tiene acceso al panel.</p>
        <p className="text-sm text-cacao/70">Pedile al administrador que te agregue.</p>
        <button onClick={() => signOut(auth)} className="btn-secundario w-full">Usar otra cuenta</button>
      </Pantalla>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-crema md:flex-row">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-cacao/10 bg-white p-4 md:flex">
        <Link href="/admin/productos" className="mb-6 block">
          <Image src="/logo.png" alt="Entre Naciones" width={120} height={94} className="mx-auto h-16 w-auto" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold transition ${
                pathname.startsWith(n.href) ? "bg-rojo text-white" : "hover:bg-arena"
              }`}
            >
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-arena">
          <Store className="h-4 w-4" /> Ver tienda
        </Link>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-arena">
          <LogOut className="h-4 w-4" /> Salir
        </button>
        <p className="mt-2 truncate px-3 text-xs text-cacao/50">{user?.email}</p>
      </aside>

      {/* Header móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cacao/10 bg-white px-4 md:hidden">
        <Link href="/" aria-label="Ir a la tienda">
          <Image src="/logo.png" alt="Entre Naciones" width={60} height={47} className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-1.5 rounded-full bg-arena px-3 py-2 text-sm font-bold hover:bg-arena/70">
            <Store className="h-4 w-4" /> Ver tienda
          </Link>
          <button onClick={() => signOut(auth)} className="rounded-full p-2 hover:bg-arena" aria-label="Salir"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="w-full flex-1 p-4 pb-24 md:p-8">{children}</main>

      {/* Navegación inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-cacao/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-bold ${pathname.startsWith(n.href) ? "text-rojo" : "text-cacao/60"}`}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-crema p-4">
      <div className="card flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
        <Image src="/logo.png" alt="Entre Naciones" width={160} height={125} className="h-24 w-auto" />
        {children}
      </div>
    </div>
  );
}
