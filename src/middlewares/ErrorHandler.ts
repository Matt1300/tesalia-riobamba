/**
 * Manejador centralizado de errores.
 * Convierte cualquier error en una ApiResponse estandarizada.
 * Garantiza que el frontend siempre reciba JSON, nunca un error sin manejar.
 */
namespace ErrorHandler {
  /**
   * Envuelve la ejecución de cualquier función y captura errores.
   * Retorna ApiResponse<T> en ambos casos (éxito o error).
   */
  export function run<T>(fn: () => T): API.ApiResponse<T> | API.ApiResponse<null> {
    try {
      const result = fn();
      return API.ok(result);
    } catch (e) {
      return handle(e);
    }
  }

  /** Convierte un error capturado en ApiResponse de error. */
  export function handle(e: unknown): API.ApiResponse<null> {
    const message = e instanceof Error ? e.message : 'Error interno del servidor.';
    AppLogger.error('ErrorHandler', message, e);
    return API.fail(message);
  }

  /**
   * Convierte un ApiResponse a ContentService output (para doPost).
   * El frontend puede parsear este JSON confiablemente.
   */
  export function toContentOutput(
    response: API.ApiResponse<unknown>
  ): GoogleAppsScript.Content.TextOutput {
    return ContentService
      .createTextOutput(API.toJson(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
