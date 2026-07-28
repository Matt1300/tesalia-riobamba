/**
 * Generador de identificadores únicos.
 * Google Apps Script no tiene crypto.randomUUID(), se implementa manualmente.
 */
namespace IdGenerator {
  /**
   * Genera un UUID v4 compatible.
   * Usa Utilities.getUuid() de GAS que retorna un UUID real.
   */
  export function uuid(): string {
    return Utilities.getUuid();
  }

  /**
   * Genera un ID corto legible para logs o referencias rápidas.
   * Formato: 8 caracteres alfanuméricos en mayúscula.
   */
  export function shortId(): string {
    return uuid().replace(/-/g, '').substring(0, 8).toUpperCase();
  }
}
