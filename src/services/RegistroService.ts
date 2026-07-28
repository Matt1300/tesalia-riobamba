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

    // Verificar que chofer y camión existen y están activos
    const chofer = ChoferesRepository.findById(dto.choferId);
    if (!chofer || !chofer.activo) {
      throw new Error(`Chofer ${dto.choferId} no encontrado o inactivo.`);
    }

    const camion = CamionesRepository.findById(dto.camionId);
    if (!camion || !camion.activo) {
      throw new Error(`Camión ${dto.camionId} no encontrado o inactivo.`);
    }

    // Snapshot de la tarifa vigente
    const tarifaAplicada = TarifaService.getValorVigente(dto.tipoRuta);

    const ahora = new Date();
    const registro: Models.Registro = {
      registroId: IdGenerator.uuid(),
      fecha: DateUtils.parseISODate(dto.fecha),
      choferId: dto.choferId,
      camionId: dto.camionId,
      tipoRuta: dto.tipoRuta,
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

    // Si cambia el tipo de ruta, recalcular tarifa
    let tarifaAplicada = anterior.tarifaAplicada;
    if (dto.tipoRuta && dto.tipoRuta !== anterior.tipoRuta) {
      tarifaAplicada = TarifaService.getValorVigente(dto.tipoRuta);
    }

    const actualizado: Models.Registro = {
      ...anterior,
      fecha: dto.fecha ? DateUtils.parseISODate(dto.fecha) : anterior.fecha,
      tipoRuta: dto.tipoRuta ?? anterior.tipoRuta,
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
      totalUrbanas: activos.filter(r => r.tipoRuta === Models.TipoRuta.URBANA).length,
      totalRurales: activos.filter(r => r.tipoRuta === Models.TipoRuta.RURAL).length,
      totalEspeciales: 0,
      montoTotal: NumberUtils.round2(activos.reduce((sum, r) => sum + r.tarifaAplicada, 0)),
      fechaCalculo: new Date(),
      recalculado: existente !== null,
    };

    ResumenMensualRepository.upsert(resumen);
  }
}
