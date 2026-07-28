/**
 * Servicio de auditoría.
 * Toda acción relevante en el sistema pasa por aquí antes de persistirse.
 * Este servicio es el único punto de escritura en la hoja Auditoria.
 */
namespace AuditoriaService {
  interface LogParams {
    session: Auth.UserSession;
    accion: Models.AccionAuditoria;
    entidad: string;
    entidadId: string;
    valorAnterior?: unknown;
    valorNuevo?: unknown;
    resultado?: Models.ResultadoAuditoria;
    detalle?: string;
  }

  export function log(params: LogParams): void {
    try {
      const auditoria: Models.Auditoria = {
        auditoriaId: IdGenerator.uuid(),
        timestamp: new Date(),
        usuarioEmail: params.session.email,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        valorAnterior: params.valorAnterior ? JSON.stringify(params.valorAnterior) : null,
        valorNuevo: params.valorNuevo ? JSON.stringify(params.valorNuevo) : null,
        ipOrigen: '',
        resultado: params.resultado ?? Models.ResultadoAuditoria.EXITO,
        detalle: params.detalle ?? '',
      };

      AuditoriaRepository.append(auditoria);
    } catch (e) {
      // La auditoría no debe bloquear la operación principal
      AppLogger.error('AuditoriaService', 'No se pudo registrar en auditoría', e);
    }
  }

  export function logError(
    session: Auth.UserSession,
    accion: Models.AccionAuditoria,
    entidad: string,
    entidadId: string,
    error: string
  ): void {
    log({
      session,
      accion,
      entidad,
      entidadId,
      resultado: Models.ResultadoAuditoria.ERROR,
      detalle: error,
    });
  }
}
