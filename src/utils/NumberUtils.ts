/**
 * Utilidades para formateo de números y moneda.
 */
namespace NumberUtils {
  /** Formatea un número como moneda USD. Ej: 140 → "$140.00" */
  export function toCurrency(amount: number): string {
    const moneda = Environment.getMoneda() || 'USD';
    const symbol = moneda === 'USD' ? '$' : moneda;
    return `${symbol}${amount.toFixed(2)}`;
  }

  /** Redondea a 2 decimales. */
  export function round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Convierte un valor de celda a número, retorna 0 si no es válido. */
  export function fromSheetValue(value: unknown): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  /** Convierte un valor de celda a entero. */
  export function fromSheetInt(value: unknown): number {
    return Math.floor(NumberUtils.fromSheetValue(value));
  }
}
