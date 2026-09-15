/** Kwanza angolano (ISO 4217: AOA). */
const LOCALE = 'pt-AO';
const CURRENCY = 'AOA';

/**
 * Formata valores monetários para o painel (Kwanza).
 * O símbolo "Kz" é aposto manualmente para garantir consistência em todos os motores.
 */
export function formatKwanza(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  const amount = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${amount} Kz`;
}

/** Rótulo curto para campos (ex.: formulários de produto). */
export const KWANZA_SHORT = 'Kz';
