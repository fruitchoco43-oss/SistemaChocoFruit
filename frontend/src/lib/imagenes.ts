import { api, API_URL } from "./api";

/** Las imágenes subidas se guardan como ruta relativa de la API (/api/imagenes/...). */
export function urlImagen(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return src.startsWith("/") ? `${API_URL}${src}` : src;
}

const LADO_MAX = 1600;
const CALIDAD = 0.85;

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, tipo, CALIDAD));
}

/**
 * Reduce la foto a máx. 1600 px por lado y la recomprime (WebP, o JPEG si el
 * navegador no sabe generar WebP). Una foto de celular de ~5 MB queda en ~150 KB.
 */
export async function comprimir(archivo: File): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`No se pudo leer «${archivo.name}». Usa una foto JPG, PNG o WebP.`);
  }
  const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  const webp = await aBlob(canvas, "image/webp");
  if (webp && webp.type === "image/webp") return webp;

  // JPEG no tiene transparencia: fondo blanco para PNG con transparencia.
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const jpg = await aBlob(canvas, "image/jpeg");
  if (!jpg) throw new Error(`No se pudo procesar «${archivo.name}».`);
  return jpg;
}

export async function subirImagen(archivo: File): Promise<string> {
  const blob = await comprimir(archivo);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.append("archivo", blob, `${archivo.name.replace(/\.[^.]+$/, "")}.${ext}`);
  const r = await api<{ url: string }>("/api/imagenes", { method: "POST", body: form });
  return r.url;
}
