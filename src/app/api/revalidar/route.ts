import { revalidatePath } from "next/cache";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Regenera la tienda al instante después de un cambio en el admin.
 * Solo lo puede llamar un admin: se valida el token de Firebase y que su
 * email exista en la colección "admins" (leído con el propio token del usuario,
 * así lo controlan las mismas reglas de Firestore).
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token || !API_KEY || !PROJECT_ID) return new Response("No autorizado", { status: 401 });

  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  const usuario = lookup.ok ? (await lookup.json()).users?.[0] : null;
  const email: string | undefined = usuario?.email?.toLowerCase();
  if (!email || !usuario.emailVerified) return new Response("No autorizado", { status: 401 });

  const admin = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!admin.ok) return new Response("No autorizado", { status: 403 });

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
