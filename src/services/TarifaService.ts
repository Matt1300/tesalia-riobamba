/**
 * Servicio de tarifas.
 * Gestiona la obtención de tarifas vigentes y el historial de cambios.
 */
namespace TarifaService {
  /**
   * Obtiene el valor base vigente para un tipo de operación y zona.
   * Lanza error si no hay tarifa configurada.
   */
  export function getValorVigente(tipoOperacion: Models.TipoOperacion, tipoZona: Models.TipoZona): number {
    const tarifa = TarifasRepository.findVigente(tipoOperacion, tipoZona);
    if (!tarifa) {
      throw new Error(
        `No existe tarifa activa para ${tipoOperacion} / ${tipoZona}. Configure las tarifas primero.`
      );
    }
    return tarifa.valor;
  }

  /**
   * Calcula la tarifa final aplicada a un registro.
   * Para RECARGUE multiplica el valor base por la cantidad de recargues.
   * Descuenta el monto de rechazo si aplica.
   */
  export function calcularTarifa(
    tipoOperacion: Models.TipoOperacion,
    tipoZona: Models.TipoZona,
    cantidadRecargues: number,
    tieneRechazos: boolean
  ): number {
    const valorBase = getValorVigente(tipoOperacion, tipoZona);
    const total = tipoOperacion === Models.TipoOperacion.RECARGUE
      ? valorBase * cantidadRecargues
      : valorBase;
    const descuento = tieneRechazos ? Environment.getMontoRechazo() : 0;
    return NumberUtils.round2(total - descuento);
  }

  /** Retorna todas las tarifas activas. */
  export function getTarifasActivas(): Models.Tarifa[] {
    return TarifasRepository.findAllActive();
  }

  /** Retorna todo el historial de tarifas. */
  export function getHistorial(): Models.Tarifa[] {
    return TarifasRepository.findAll();
  }

  /**
   * Crea una nueva tarifa para un tipo de operación y zona.
   * Desactiva automáticamente la tarifa anterior del mismo tipo+zona.
   */
  export function crear(dto: DTO.CreateTarifaDTO, session: Auth.UserSession): Models.Tarifa {
    RoleGuard.requirePermission(session, Auth.Permission.CREAR_TARIFA);

    const anterior = TarifasRepository.findVigente(dto.tipoOperacion, dto.tipoZona);

    TarifasRepository.deactivateByTipo(dto.tipoOperacion, dto.tipoZona);

    const nueva: Models.Tarifa = {
      tarifaId: IdGenerator.uuid(),
      tipoOperacion: dto.tipoOperacion,
      tipoZona: dto.tipoZona,
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

    AppLogger.info('TarifaService', `Tarifa creada: ${dto.tipoOperacion}/${dto.tipoZona} → $${dto.valor}`);
    return nueva;
  }
}
