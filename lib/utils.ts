import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** API usa `images`; legado pode vir como `image`. */
export function productImageList(product: {
  images?: string[] | null;
  image?: string[] | null;
}): string[] {
  const raw = product.images ?? product.image;
  return Array.isArray(raw) ? raw : [];
}
