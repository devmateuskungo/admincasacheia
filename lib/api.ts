/** Remove espaços, CRLF (Windows) e barra final — evita URL inválida tipo `.../api%0D/products`. */
export function normalizeBaseUrl(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/\r\n/g, "")
    .replace(/\r/g, "")
    .replace(/\/+$/, "");
}

export const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);

/** Evita `Authorization: Bearer Bearer eyJ...` se o token foi guardado com prefixo. */
export function sanitizeBearerToken(token: string): string {
  const t = token.trim();
  if (/^bearer\s+/i.test(t)) return t.replace(/^bearer\s+/i, "").trim();
  return t;
}

export async function apiFetch(path: string, options?: RequestInit) {
  if (!BASE_URL) {
    throw new Error("BASE_URL não definida no .env");
  }
  return fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, options);
}

/**
 * Usa a rota Next `/api/backend/...` para o servidor reencaminhar ao backend.
 * Evita CORS e diferenças de cabeçalhos (Origin) entre browser e Postman.
 */
export function backendProxyUrl(apiPath: string): string {
  const clean = apiPath.replace(/^\/+/, "");
  return `/api/backend/${clean}`;
}

/**
 * Nome do campo multipart só para **ficheiros** (Multer: `upload.array('images', 8)` ou o valor do .env).
 */
export const PRODUCT_FORM_IMAGE_FIELD =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCT_IMAGE_FIELD?.trim()) ||
  "images";

/**
 * Campo de texto com array de URLs (JSON) — evita misturar várias partes texto + ficheiros no mesmo nome
 * (o Multer/busboy costuma tratar mal “multi-campo” `images` com strings e binários juntos).
 */
export const PRODUCT_FORM_EXISTING_IMAGES_FIELD =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCT_EXISTING_IMAGES_FIELD?.trim()) ||
  "existingImages";

/**
 * multipart/form-data: campos de texto + imagens.
 * - **Ficheiros**: várias entradas no campo `images` (ou `NEXT_PUBLIC_PRODUCT_IMAGE_FIELD`), cada uma com nome de ficheiro.
 * - **URLs já guardadas** (edição): um campo `existingImages` com JSON `["https://...","https://..."]` (ou nome via env).
 * Não definir `Content-Type` no fetch — o browser envia o boundary.
 */
export function buildProductFormData(fields: {
  name: string;
  price: number;
  category: string;
  partner: string;
  stock: number;
  description: string;
  /** URLs já guardadas (edição) — vão em `existingImages` como JSON, não em múltiplas partes `images` */
  imageUrls?: string[];
  /** Ficheiros novos — multi-campo `images` */
  imageFiles?: File[];
}): FormData {
  const fd = new FormData();
  const fileKey = PRODUCT_FORM_IMAGE_FIELD;
  fd.append("name", fields.name);
  fd.append("price", String(fields.price));
  fd.append("category", fields.category);
  fd.append("partner", fields.partner);
  fd.append("stock", String(fields.stock));
  fd.append("description", fields.description);

  const urls = (fields.imageUrls ?? []).filter(Boolean);
  if (urls.length > 0) {
    fd.append(PRODUCT_FORM_EXISTING_IMAGES_FIELD, JSON.stringify(urls));
  }

  (fields.imageFiles ?? []).forEach((file) => {
    fd.append(fileKey, file, file.name || "image.jpg");
  });

  return fd;
}

/** Máximo de ficheiros no campo `images` em POST/PUT /banners. */
export const BANNER_MAX_IMAGES = 4;

/**
 * multipart/form-data para banners: várias partes `images`, `description` opcional, `active` como "true" | "false".
 */
export function buildBannerFormData(fields: {
  description?: string;
  active?: boolean;
  imageFiles?: File[];
}): FormData {
  const fd = new FormData();
  const desc = fields.description?.trim();
  if (desc) fd.append("description", desc);
  const active = fields.active !== false;
  fd.append("active", active ? "true" : "false");
  (fields.imageFiles ?? []).forEach((file) => {
    fd.append("images", file, file.name || "banner.jpg");
  });
  return fd;
}

/** Máximo de ficheiros no campo `images` em POST/PATCH /partners. */
export const PARTNER_MAX_IMAGES = 4;

export type PartnerApiStatus = "active" | "inactive" | "suspended";

function appendPartnerAddressJson(
  fd: FormData,
  address: { street?: string; city?: string; province?: string } | undefined
): void {
  if (!address) return;
  const street = address.street?.trim();
  const city = address.city?.trim();
  const province = address.province?.trim();
  if (!street && !city && !province) return;
  const o: Record<string, string> = {};
  if (street) o.street = street;
  if (city) o.city = city;
  if (province) o.province = province;
  fd.append("address", JSON.stringify(o));
}

/**
 * POST /partners — multipart: name, email, nif, phone (obrigatórios), status opcional, address JSON opcional, images (máx. 4).
 */
export function buildPartnerCreateFormData(fields: {
  name: string;
  email: string;
  nif: string;
  phone: string;
  status?: PartnerApiStatus;
  address?: { street?: string; city?: string; province?: string };
  imageFiles?: File[];
}): FormData {
  const fd = new FormData();
  fd.append("name", fields.name.trim());
  fd.append("email", fields.email.trim());
  fd.append("nif", fields.nif.trim());
  fd.append("phone", fields.phone.trim());
  if (fields.status) fd.append("status", fields.status);
  appendPartnerAddressJson(fd, fields.address);
  (fields.imageFiles ?? [])
    .slice(0, PARTNER_MAX_IMAGES)
    .forEach((file) => fd.append("images", file, file.name || "image.jpg"));
  return fd;
}

/**
 * PATCH /partners/:id — multipart; só acrescenta campos definidos. O servidor exige pelo menos um campo.
 */
export function buildPartnerPatchFormData(fields: {
  name?: string;
  email?: string;
  nif?: string;
  phone?: string;
  status?: PartnerApiStatus;
  address?: { street?: string; city?: string; province?: string };
  imageFiles?: File[];
}): { formData: FormData; parts: number } {
  const fd = new FormData();
  let parts = 0;
  if (fields.name !== undefined && fields.name.trim()) {
    fd.append("name", fields.name.trim());
    parts++;
  }
  if (fields.email !== undefined && fields.email.trim()) {
    fd.append("email", fields.email.trim());
    parts++;
  }
  if (fields.nif !== undefined && fields.nif.trim()) {
    fd.append("nif", fields.nif.trim());
    parts++;
  }
  if (fields.phone !== undefined && fields.phone.trim()) {
    fd.append("phone", fields.phone.trim());
    parts++;
  }
  if (fields.status !== undefined && fields.status) {
    fd.append("status", fields.status);
    parts++;
  }
  const street = fields.address?.street?.trim();
  const city = fields.address?.city?.trim();
  const province = fields.address?.province?.trim();
  if (street || city || province) {
    appendPartnerAddressJson(fd, { street, city, province });
    parts++;
  }
  const files = (fields.imageFiles ?? []).slice(0, PARTNER_MAX_IMAGES);
  for (const file of files) {
    fd.append("images", file, file.name || "image.jpg");
    parts++;
  }
  return { formData: fd, parts };
}

/** Resposta típica do Express/Render quando o servidor rebenta sem handler JSON. */
function messageFromHtmlErrorPage(html: string, status: number): string {
  const pre = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)?.[1]?.trim();
  if (pre) return `Erro ${status}: ${pre.slice(0, 300)}`;
  return `O servidor respondeu com erro ${status} (página HTML, sem detalhe JSON). Veja os logs do backend no Render ou no terminal.`;
}

/**
 * Joi/Express por vezes devolvem `message` como objeto (ex.: `error.details[0]`), o que no UI vira `[object Object]`.
 */
export function normalizeApiErrorMessage(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    return normalizeApiErrorMessage(value[0]);
  }
  if (typeof value === "object" && value !== null && "message" in value) {
    const inner = (value as { message: unknown }).message;
    if (typeof inner === "string") return inner;
    if (inner != null && typeof inner === "object" && "message" in inner) {
      const nested = (inner as { message: unknown }).message;
      if (typeof nested === "string") return nested;
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Lê mensagem útil em respostas JSON; evita mostrar `<!DOCTYPE html>...` inteiro ao utilizador. */
export async function getErrorMessageFromResponse(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Erro ${res.status}`;

  const trimmed = text.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    return messageFromHtmlErrorPage(trimmed, res.status);
  }

  try {
    const j = JSON.parse(text) as {
      message?: unknown;
      error?: unknown;
      messages?: unknown;
    };
    const raw = j.message ?? j.error ?? j.messages;
    if (raw !== undefined && raw !== null) {
      const msg = normalizeApiErrorMessage(raw);
      if (msg) return msg;
    }
    return `Erro ${res.status}`;
  } catch {
    return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed;
  }
}
