import { auth } from "./firebase";

/** Pide al servidor que regenere la tienda para que los cambios se vean al instante. */
export async function refrescarTienda() {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/revalidar", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {
    console.warn("No se pudo refrescar la tienda", e);
  }
}
