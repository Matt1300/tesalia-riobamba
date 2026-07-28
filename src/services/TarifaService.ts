/**
 * Servicio de tarifas.
 * Gestiona la obtención de tarifas vigentes y el historial de cambios.
 */
namespace TarifaService {
  /**
   * Obtiene el valor vigente para un tipo de ruta.
   * Lanza error si no hay tarifa configurada.
   */
  export function getValorVigente(tipoRuta: Models.TipoRuta): number {
    const tarifa = TarifasRepository.findVigente(tipoRuta);
    if (!tarifa) {
      throw new Error(
        `No existe tarifa activa para el tipo de ruta "${tipoRuta}". Configure las tarifas primero.`
      );
    }
    return tarifa.valor;
  }

  /** Retorna todas las tarifas activas (una por tipo de ruta). */
  export function getTarifasActivas(): Models.Tarifa[] {
    return TarifasRepository.findAllActive();
  }

  /** Retorna todo el historial de tarifas. */
  export function getHistorial(): Models.Tarifa[] {
    return TarifasRepository.findAll();
  }

  /**
   * Crea una nueva tarifa para un tipo de ruta.
   * Desactiva automáticamente la tarifa anterior del mismo tipo.
   */
  export function crear(dto: DTO.CreateTarifaDTO, session: Auth.UserSession): Models.Tarifa {
    RoleGuard.requirePermission(session, Auth.Permission.CREAR_TARIFA);

    const anterior = TarifasRepository.findVigente(dto.tipoRuta);

    // Desactivar tarifa anterior
    TarifasRepository.deactivateByTipoRuta(dto.tipoRuta);

    const nueva: Models.Tarifa = {
      tarifaId: IdGenerator.uuid(),
      tipoRuta: dto.tipoRuta,
      valor: NumberUtils.round2(dto.valor),
      descripcion: dto.descripcion,
      fechaVigencia: dto.fechaVigencia
        ? DateUtils.parseISODate(dto.fechaVigencia)
        : new Date(),
      fechaVencimiento: null,
      activo: true,
      creadoPor: session.email,
      fechaCreacion: new Date(),
    };

    TarifasRepository.create(nueva);

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.CREAR,
      entidad: Constants.SHEETS.TARIFAS,
      entidadId: nueva.tarifaId,
      valorAnterior: anterior,
      valorNuevo: nueva,
    });

    AppLogger.info('TarifaService', `Tarifa creada: ${dto.tipoRuta} → $${dto.valor}`);
    return nueva;
  }
}
