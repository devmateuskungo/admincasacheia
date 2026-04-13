/** Morada conforme API (POST/PATCH partners). */
export interface PartnerAddress {
  street?: string;
  city?: string;
  province?: string;
}

export type PartnerStatus = 'active' | 'inactive' | 'suspended';

/** Resposta da API pode variar; normalizamos na UI. */
export interface Partner {
  _id: string;
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  telefone?: string;
  status?: PartnerStatus | string;
  images?: string[];
  /** Objeto estruturado ou legado em string. */
  address?: PartnerAddress | string;
  morada?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function partnerPhone(p: Partner): string {
  return p.phone ?? p.telefone ?? '';
}

/** Texto único para listagens (ex.: tabela). */
export function partnerAddressSummary(p: Partner): string {
  const a = p.address;
  if (a == null) return p.morada ?? '';
  if (typeof a === 'string') return a;
  const parts = [a.street, a.city, a.province].filter(Boolean);
  return parts.join(', ');
}

export function partnerCity(p: Partner): string {
  const a = p.address;
  if (a && typeof a === 'object' && a.city) return a.city;
  return '';
}

export function partnerImageUrls(p: Partner): string[] {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images;
  return [];
}

export function partnerStatusLabel(s: string | undefined): string {
  switch (s) {
    case 'active':
      return 'Activo';
    case 'inactive':
      return 'Inactivo';
    case 'suspended':
      return 'Suspenso';
    default:
      return s?.trim() ? String(s) : '—';
  }
}

export function extractPartnersList(data: unknown): Partner[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as Partner[];
  if (typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.partners)) return o.partners as Partner[];
  if (Array.isArray(o.data)) return o.data as Partner[];
  if (Array.isArray(o.formatted)) return o.formatted as Partner[];
  return [];
}

export function extractPartnerOne(data: unknown): Partner | null {
  if (data == null || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.partner && typeof o.partner === 'object') return o.partner as Partner;
  if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) return o.data as Partner;
  if ('_id' in o && 'name' in o) return o as unknown as Partner;
  return null;
}
