/** Kwanza angolano (ISO 4217: AOA). */
const LOCALE = 'pt-AO';
const CURRENCY = 'AOA';

/**
 * Formata valores monetários para o painel (Kwanza).
 * Usa locale angolano; o símbolo exibido depende do motor (geralmente Kz / AOA).
 */
export function formatKwanza(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Rótulo curto para campos (ex.: formulários de produto). */
export const KWANZA_SHORT = 'Kz';
