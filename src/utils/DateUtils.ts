/**
 * Utilidades para manejo y formateo de fechas.
 * Zona horaria: America/Guayaquil (UTC-5).
 */
namespace DateUtils {
  const TIMEZONE = 'America/Guayaquil';

  /** Convierte un valor de celda de Sheets a Date. */
  export function fromSheetValue(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.trim() !== '') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return new Date();
  }

  /** Convierte Date a string ISO YYYY-MM-DD. */
  export function toISODate(date: Date): string {
    return Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd');
  }

  /** Convierte Date a string de visualización: DD/MM/YYYY. */
  export function toDisplayDate(date: Date): string {
    return Utilities.formatDate(date, TIMEZONE, 'dd/MM/yyyy');
  }

  /** Convierte Date a datetime completo: DD/MM/YYYY HH:mm. */
  export function toDisplayDateTime(date: Date): string {
    return Utilities.formatDate(date, TIMEZONE, 'dd/MM/yyyy HH:mm');
  }

  /** Parsea string YYYY-MM-DD a Date. */
  export function parseISODate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d;
  }

  /** Obtiene el año y mes de una fecha. */
  export function getYearMonth(date: Date): { anio: number; mes: number } {
    return {
      anio: date.getFullYear(),
      mes: date.getMonth() + 1,
    };
  }

  /** Retorna true si la fecha está en el rango [desde, hasta] inclusive. */
  export function isInRange(date: Date, desde: Date, hasta: Date): boolean {
    const d = date.getTime();
    return d >= desde.getTime() && d <= hasta.getTime();
  }

  /** Nombre del mes en español. */
  export function monthName(mes: number): string {
    const nombres = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return nombres[mes] ?? String(mes);
  }
}
