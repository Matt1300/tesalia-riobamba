/**
 * Middleware de autenticación.
 * Envuelve los handlers de controllers para garantizar que
 * siempre exista una sesión válida antes de ejecutar la lógica.
 */
namespace AuthMiddleware {
  /**
   * Ejecuta una función protegida.
   * Si la sesión no es válida, retorna un ApiResponse de error.
   */
  export function protect<T>(
    handler: (session: Auth.UserSession) => T
  ): API.ApiResponse<T> | API.ApiResponse<null> {
    try {
      const session = AuthService.getCurrentSession();
      const result = handler(session);
      return API.ok(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de autenticación.';
      AppLogger.error('AuthMiddleware', message);
      return API.fail(message);
    }
  }

  /**
   * Igual que protect() pero para handlers que ya retornan ApiResponse.
   * Usa unknown como tipo de retorno para permitir respuestas polimórficas
   * en los controllers (cada método puede retornar un tipo diferente).
   */
  export function protectRaw(
    handler: (session: Auth.UserSession) => API.ApiResponse<unknown>
  ): API.ApiResponse<unknown> {
    try {
      const session = AuthService.getCurrentSession();
      return handler(session);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de autenticación.';
      AppLogger.error('AuthMiddleware', message);
      return API.fail(message);
    }
  }
}
