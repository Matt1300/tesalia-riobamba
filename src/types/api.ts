/**
 * Tipos para las respuestas de la API entre frontend y backend.
 * Todos los controllers retornan ApiResponse<T>.
 */
namespace API {
  export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    timestamp: string;
  }

  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  /** Respuesta exitosa con datos. */
  export function ok<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      error: null,
      timestamp: new Date().toISOString(),
    };
  }

  /** Respuesta de error. */
  export function fail(message: string): ApiResponse<null> {
    return {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }

  /** Serializa la respuesta a JSON string para ContentService. */
  export function toJson<T>(response: ApiResponse<T>): string {
    return JSON.stringify(response);
  }

  /** Deserializa el body de un doPost request. */
  export function parseBody<T>(body: string): T {
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error('Body de la petición no es JSON válido.');
    }
  }
}
