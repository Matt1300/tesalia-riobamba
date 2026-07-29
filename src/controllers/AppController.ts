/**
 * Controlador principal de la aplicación web.
 * Maneja doGet() (sirve el HTML) y doPost() (API REST).
 * Enruta las peticiones POST al controlador correspondiente según la acción.
 */
namespace AppController {
  /** Sirve la aplicación web principal. */
  export function handleGet(
    _e: GoogleAppsScript.Events.DoGet
  ): GoogleAppsScript.HTML.HtmlOutput {
    try {
      const session = AuthService.getSessionSilent();
      const appNombre = Environment.getAppNombre();
      const moneda = Environment.getMoneda();

      // Inyectar datos de sesión como script antes del </body>
      // Usamos createHtmlOutputFromFile (sin evaluación de plantillas) para evitar
      // conflictos con el motor de templates de GAS y contenido JS complejo.
      const debugEmail = Session.getActiveUser().getEmail();
      const initScript = `<script>
        window.__SESSION__=${session ? JSON.stringify(session) : 'null'};
        window.__APP_NOMBRE__=${JSON.stringify(appNombre)};
        window.__MONEDA__=${JSON.stringify(moneda)};
        window.__DEBUG_EMAIL__=${JSON.stringify(debugEmail)};
      </script>`;

      return HtmlService.createHtmlOutputFromFile('views/index')
        .append(initScript)
        .setTitle(appNombre)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      AppLogger.error('AppController', `Error en doGet: ${msg}`, e);
      return HtmlService.createHtmlOutput(
        `<h1>Error al cargar la aplicación.</h1><p>${msg}</p>`
      );
    }
  }

  /**
   * Maneja todas las llamadas API del frontend.
   * El body JSON debe tener { action: string, payload: object }.
   */
  export function handlePost(
    e: GoogleAppsScript.Events.DoPost
  ): GoogleAppsScript.Content.TextOutput {
    try {
      const body = JSON.parse(e.postData.contents) as { action: string; payload: unknown };
      const { action, payload } = body;

      AppLogger.info('AppController', `POST action: ${action}`);

      const response = route(action, payload);
      return ErrorHandler.toContentOutput(response);
    } catch (e) {
      const response = ErrorHandler.handle(e);
      return ErrorHandler.toContentOutput(response);
    }
  }

  /**
   * Función dedicada para llamadas desde google.script.run en el frontend.
   * Retorna string JSON directamente porque google.script.run no puede serializar
   * objetos GAS como ContentService.TextOutput (devolvería null al cliente).
   */
  export function handleApiCall(action: string, payload: unknown): string {
    try {
      AppLogger.info('AppController', `apiCall action: ${action}`);
      const response = route(action, payload);
      return API.toJson(response);
    } catch (e) {
      return API.toJson(ErrorHandler.handle(e));
    }
  }

  /** Enruta la acción al controlador correcto. */
  function route(action: string, payload: unknown): API.ApiResponse<unknown> {
    const [entity, method] = action.split('.');

    switch (entity) {
      case 'registros':   return RegistroController.handle(method, payload);
      case 'choferes':    return ChoferController.handle(method, payload);
      case 'camiones':    return CamionController.handle(method, payload);
      case 'tarifas':     return TarifaController.handle(method, payload);
      case 'reportes':    return ReporteController.handle(method, payload);
      case 'usuarios':    return UsuarioController.handle(method, payload);
      case 'auditoria':    return AuditoriaController.handle(method, payload);
      case 'formErrores':  return FormErroresController.handle(method, payload);
      default:
        return API.fail(`Acción desconocida: ${action}`);
    }
  }

  /** Helper para incluir archivos HTML parciales en las plantillas. */
  export function include(filename: string): string {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
}
