/**
 * Servicio de registros de rutas.
 * Contiene la lógica central del negocio:
 * - Crear registros (desde form o manual)
 * - Calcular y fijar la tarifa al momento del registro (snapshot)
 * - Validar / rechazar registros
 * - Recalcular el resumen mensual
 */
namespace RegistroService {
  export function getAll(session: Auth.UserSession): Models.Registro[] {
    if (session.rol === Models.Rol.ADMIN) {
      RoleGuard.requirePermission(session, Auth.Permission.VER_TODOS_REGISTROS);
      return RegistrosRepository.findAll();
    }

    RoleGuard.requirePermission(session, Auth.Permission.VER_PROPIOS_REGISTROS);
    if (!session.choferId) return [];
    return RegistrosRepository.findByChoferId(session.choferId);
  }

  export function getById(registroId: string, session: Auth.UserSession): Models.Registro {
    const registro = RegistrosRepository.findById(registroId);
    if (!registro) throw new Error(`Registro ${registroId} no encontrado.`);

    if (session.rol !== Models.Rol.ADMIN) {
      RoleGuard.requireOwnDataOrAdmin(session, registro.choferId);
    }

    return registro;
  }

  export function getByFiltro(
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): Models.Registro[] {
    // Chofer solo puede filtrar sus propios registros
    if (session.rol !== Models.Rol.ADMIN) {
      filtro.choferId = session.choferId ?? undefined;
    }

    return RegistrosRepository.findByFiltro(filtro);
  }

  /**
   * Crea un registro manual desde el dashboard.
   * Calcula y fija la tarifa vigente en el momento de creación.
   */
  export function crear(dto: DTO.CreateRegistroDTO, session: Auth.UserSession): Models.Registro {
    RoleGuard.requirePermission(session, Auth.Permission.CREAR_REGISTRO);

    // CHOFER solo puede crear registros a su propio nombre
    if (session.rol === Models.Rol.CHOFER) {
      if (!session.choferId || dto.choferId !== session.choferId) {
        throw new Error('Solo puede crear registros a su propio nombre.');
      }
    }

    // Verificar que chofer y camión existen y están activos
    const chofer = ChoferesRepository.findById(dto.choferId);
    if (!chofer || !chofer.activo) {
      throw new Error(`Chofer ${dto.choferId} no encontrado o inactivo.`);
    }

    const camion = CamionesRepository.findById(dto.camionId);
    if (!camion || !camion.activo) {
      throw new Error(`Camión ${dto.camionId} no encontrado o inactivo.`);
    }

    // Snapshot de la tarifa vigente (con cálculo completo)
    const cantidadRecargues = dto.tipoOperacion === Models.TipoOperacion.RECARGUE
      ? (dto.cantidadRecargues ?? 1)
      : 1;
    const tarifaAplicada = TarifaService.calcularTarifa(
      dto.tipoOperacion, dto.tipoZona, cantidadRecargues, dto.tieneRechazos
    );

    const ahora = new Date();
    const registro: Models.Registro = {
      registroId: IdGenerator.uuid(),
      fecha: DateUtils.parseISODate(dto.fecha),
      choferId: dto.choferId,
      camionId: dto.camionId,
      placa: dto.placa,
      transporte: dto.transporte,
      ruta: dto.ruta,
      tipoOperacion: dto.tipoOperacion,
      tipoZona: dto.tipoZona,
      cantidadRecargues,
      kilometraje: dto.kilometraje,
      tieneRechazos: dto.tieneRechazos,
      tarifaAplicada,
      observaciones: dto.observaciones ?? '',
      origen: dto.origen ?? Models.OrigenRegistro.MANUAL,
      formResponseId: dto.formResponseId ?? null,
      estado: Models.EstadoRegistro.PENDIENTE,
      validadoPor: null,
      fechaValidacion: null,
      creadoEn: ahora,
      modificadoEn: ahora,
    };

    RegistrosRepository.create(registro);
    recalcularResumen(dto.choferId, dto.camionId, registro.fecha);

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.CREAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: registro.registroId,
      valorNuevo: registro,
    });

    return registro;
  }

  /**
   * Crea un registro desde una respuesta de Google Form.
   * Evita duplicados usando el formResponseId.
   */
  export function crearDesdeForm(dto: DTO.CreateRegistroDTO): Models.Registro {
    if (dto.formResponseId && RegistrosRepository.findByFormResponseId(dto.formResponseId)) {
      throw new Error(`Respuesta de formulario ${dto.formResponseId} ya fue procesada.`);
    }

    const systemSession: Auth.UserSession = {
      email: 'system@form',
      rol: Models.Rol.ADMIN,
      choferId: null,
      usuarioId: 'system',
    };

    return crear({ ...dto, origen: Models.OrigenRegistro.FORM }, systemSession);
  }

  export function actualizar(
    registroId: string,
    dto: DTO.UpdateRegistroDTO,
    session: Auth.UserSession
  ): Models.Registro {
    RoleGuard.requirePermission(session, Auth.Permission.EDITAR_REGISTRO);

    const anterior = RegistrosRepository.findById(registroId);
    if (!anterior) throw new Error(`Registro ${registroId} no encontrado.`);

    // Si cambia algo que afecta la tarifa, recalcular
    const tipoOperacion = dto.tipoOperacion ?? anterior.tipoOperacion;
    const tipoZona = dto.tipoZona ?? anterior.tipoZona;
    const cantidadRecargues = tipoOperacion === Models.TipoOperacion.RECARGUE
      ? (dto.cantidadRecargues ?? anterior.cantidadRecargues)
      : 1;
    const tieneRechazos = dto.tieneRechazos !== undefined ? dto.tieneRechazos : anterior.tieneRechazos;

    const recalcular = dto.tipoOperacion || dto.tipoZona || dto.cantidadRecargues !== undefined || dto.tieneRechazos !== undefined;
    const tarifaAplicada = recalcular
      ? TarifaService.calcularTarifa(tipoOperacion, tipoZona, cantidadRecargues, tieneRechazos)
      : anterior.tarifaAplicada;

    const actualizado: Models.Registro = {
      ...anterior,
      fecha: dto.fecha ? DateUtils.parseISODate(dto.fecha) : anterior.fecha,
      transporte: dto.transporte ?? anterior.transporte,
      ruta: dto.ruta ?? anterior.ruta,
      tipoOperacion,
      tipoZona,
      cantidadRecargues,
      kilometraje: dto.kilometraje !== undefined ? dto.kilometraje : anterior.kilometraje,
      tieneRechazos,
      tarifaAplicada,
      observaciones: dto.observaciones ?? anterior.observaciones,
    };

    RegistrosRepository.update(actualizado);
    recalcularResumen(actualizado.choferId, actualizado.camionId, actualizado.fecha);

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.EDITAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: registroId,
      valorAnterior: anterior,
      valorNuevo: actualizado,
    });

    return actualizado;
  }

  export function validar(dto: DTO.ValidarRegistroDTO, session: Auth.UserSession): Models.Registro {
    RoleGuard.requirePermission(session, Auth.Permission.VALIDAR_REGISTRO);

    const registro = RegistrosRepository.findById(dto.registroId);
    if (!registro) throw new Error(`Registro ${dto.registroId} no encontrado.`);

    const actualizado: Models.Registro = {
      ...registro,
      estado: dto.estado,
      validadoPor: session.email,
      fechaValidacion: new Date(),
    };

    RegistrosRepository.update(actualizado);
    AuditoriaService.log({
      session,
      accion: dto.estado === Models.EstadoRegistro.VALIDADO
        ? Models.AccionAuditoria.VALIDAR
        : Models.AccionAuditoria.RECHAZAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: dto.registroId,
      valorAnterior: { estado: registro.estado },
      valorNuevo: { estado: dto.estado, motivo: dto.motivo },
    });

    return actualizado;
  }

  export function eliminar(registroId: string, session: Auth.UserSession): void {
    RoleGuard.requirePermission(session, Auth.Permission.ELIMINAR_REGISTRO);

    const registro = RegistrosRepository.findById(registroId);
    if (!registro) throw new Error(`Registro ${registroId} no encontrado.`);

    RegistrosRepository.markDeleted(registroId);
    recalcularResumen(registro.choferId, registro.camionId, registro.fecha);

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.ELIMINAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: registroId,
      valorAnterior: registro,
    });
  }

  /** Recalcula y persiste el resumen mensual para un chofer/camion/mes. */
  function recalcularResumen(choferId: string, camionId: string, fecha: Date): void {
    const { anio, mes } = DateUtils.getYearMonth(fecha);

    const registros = RegistrosRepository.findByFiltro({
      choferId,
      camionId,
      anio,
      mes,
      estado: undefined, // incluir todos los estados para el resumen
    });

    const activos = registros.filter(r => r.estado !== Models.EstadoRegistro.RECHAZADO);

    const existente = ResumenMensualRepository.findByChoferAndPeriodo(choferId, anio, mes);

    const resumen: Models.ResumenMensual = {
      resumenId: existente?.resumenId ?? IdGenerator.uuid(),
      anio,
      mes,
      choferId,
      camionId,
      totalRegistros: activos.length,
      totalEntregas: activos.filter(r => r.tipoOperacion === Models.TipoOperacion.ENTREGA).length,
      totalRecargues: activos.filter(r => r.tipoOperacion === Models.TipoOperacion.RECARGUE).length,
      montoTotal: NumberUtils.round2(activos.reduce((sum, r) => sum + r.tarifaAplicada, 0)),
      fechaCalculo: new Date(),
      recalculado: existente !== null,
    };

    ResumenMensualRepository.upsert(resumen);
  }
}
