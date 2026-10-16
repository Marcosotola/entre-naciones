import imageCompression from "browser-image-compression";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/** Comprime la foto a WebP (máx. 1200px) y la sube a Storage. Devuelve la URL pública. */
export async function subirImagen(archivo: File, carpeta: string): Promise<string> {
  const comprimida = await imageCompression(archivo, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.35,
    fileType: "image/webp",
    useWebWorker: true,
  });
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const destino = ref(storage, `${carpeta}/${nombre}`);
  await uploadBytes(destino, comprimida, {
    contentType: "image/webp",
    cacheControl: "public, max-age=31536000, immutable",
  });
  return getDownloadURL(destino);
}

/** Borra archivos de Storage ignorando los que ya no existan. */
export async function borrarImagenes(urls: string[]) {
  await Promise.all(
    // Las imágenes de ejemplo (/ejemplos/...) viven en el sitio, no en Storage
    urls.filter((u) => u.startsWith("https://")).map(async (url) => {
      try {
        await deleteObject(ref(storage, url));
      } catch (e) {
        console.warn("No se pudo borrar", url, e);
      }
    })
  );
}
