/**
 * Servicio de reportes y totales.
 * Todas las consultas de alto nivel pasan por aquí.
 */
namespace ReporteService {
  export interface TotalPorChofer {
    chofer: Models.Chofer;
    totalRegistros: number;
    totalUrbanas: number;
    totalRurales: number;
    montoTotal: number;
  }

  export interface TotalPorTipoRuta {
    tipoRuta: Models.TipoRuta;
    totalRegistros: number;
    montoTotal: number;
  }

  export interface ResumenPeriodo {
    totalRegistros: number;
    totalUrbanas: number;
    totalRurales: number;
    montoTotal: number;
    porChofer: TotalPorChofer[];
    porTipoRuta: TotalPorTipoRuta[];
  }

  /** Reporte global por período (admin). */
  export function getResumenPeriodo(
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): ResumenPeriodo {
    RoleGuard.requirePermission(session, Auth.Permission.VER_REPORTES_GLOBALES);

    const registros = RegistrosRepository.findByFiltro(filtro)
      .filter(r => r.estado !== Models.EstadoRegistro.RECHAZADO);

    const porChoferMap = new Map<string, TotalPorChofer>();

    for (const r of registros) {
      if (!porChoferMap.has(r.choferId)) {
        const chofer = ChoferesRepository.findById(r.choferId);
        if (!chofer) continue;
        porChoferMap.set(r.choferId, {
          chofer,
          totalRegistros: 0,
          totalUrbanas: 0,
          totalRurales: 0,
          montoTotal: 0,
        });
      }

      const entry = porChoferMap.get(r.choferId)!;
      entry.totalRegistros++;
      entry.montoTotal = NumberUtils.round2(entry.montoTotal + r.tarifaAplicada);
      if (r.tipoRuta === Models.TipoRuta.URBANA) entry.totalUrbanas++;
      if (r.tipoRuta === Models.TipoRuta.RURAL) entry.totalRurales++;
    }

    const porTipoRuta: TotalPorTipoRuta[] = Object.values(Models.TipoRuta).map(tipo => ({
      tipoRuta: tipo,
      totalRegistros: registros.filter(r => r.tipoRuta === tipo).length,
      montoTotal: NumberUtils.round2(
        registros.filter(r => r.tipoRuta === tipo).reduce((s, r) => s + r.tarifaAplicada, 0)
      ),
    }));

    return {
      totalRegistros: registros.length,
      totalUrbanas: registros.filter(r => r.tipoRuta === Models.TipoRuta.URBANA).length,
      totalRurales: registros.filter(r => r.tipoRuta === Models.TipoRuta.RURAL).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      porChofer: Array.from(porChoferMap.values()),
      porTipoRuta,
    };
  }

  /** Reporte individual del chofer (para su propia vista). */
  export function getReporteChofer(
    choferId: string,
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): DTO.ResumenChoferDTO {
    RoleGuard.requireOwnDataOrAdmin(session, choferId);

    const chofer = ChoferesRepository.findById(choferId);
    if (!chofer) throw new Error(`Chofer ${choferId} no encontrado.`);

    const registros = RegistrosRepository.findByFiltro({ ...filtro, choferId })
      .filter(r => r.estado !== Models.EstadoRegistro.RECHAZADO);

    const periodo = filtro.anio && filtro.mes
      ? `${DateUtils.monthName(filtro.mes)} ${filtro.anio}`
      : filtro.fechaDesde && filtro.fechaHasta
        ? `${filtro.fechaDesde} → ${filtro.fechaHasta}`
        : 'Todo el período';

    return {
      chofer,
      totalRegistros: registros.length,
      totalUrbanas: registros.filter(r => r.tipoRuta === Models.TipoRuta.URBANA).length,
      totalRurales: registros.filter(r => r.tipoRuta === Models.TipoRuta.RURAL).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      periodo,
    };
  }

  export interface DetalleRegistro {
    registroId: string;
    fecha: string;
    camionPatente: string;
    camionModelo: string;
    tipoRuta: Models.TipoRuta;
    tarifaAplicada: number;
    estado: Models.EstadoRegistro;
    observaciones: string;
  }

  export interface DetalleChofer {
    chofer: Models.Chofer;
    periodo: string;
    totalRegistros: number;
    totalUrbanas: number;
    totalRurales: number;
    montoTotal: number;
    registros: DetalleRegistro[];
  }

  /** Detalle completo de registros de un chofer en un período. */
  export function getDetalleChofer(
    choferId: string,
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): DetalleChofer {
    RoleGuard.requireOwnDataOrAdmin(session, choferId);

    const chofer = ChoferesRepository.findById(choferId);
    if (!chofer) throw new Error(`Chofer ${choferId} no encontrado.`);

    const registros = RegistrosRepository.findByFiltro({ ...filtro, choferId })
      .filter(r => r.estado !== Models.EstadoRegistro.RECHAZADO);

    const camionesMap = new Map<string, Models.Camion>();
    CamionesRepository.findAll().forEach(c => camionesMap.set(c.camionId, c));

    const periodo = filtro.anio && filtro.mes
      ? `${DateUtils.monthName(filtro.mes)} ${filtro.anio}`
      : filtro.fechaDesde && filtro.fechaHasta
        ? `${filtro.fechaDesde} - ${filtro.fechaHasta}`
        : 'Todo el período';

    const detalleRegistros: DetalleRegistro[] = registros.map(r => {
      const camion = camionesMap.get(r.camionId);
      return {
        registroId: r.registroId,
        fecha: DateUtils.toISODate(r.fecha),
        camionPatente: camion ? camion.patente : r.camionId,
        camionModelo: camion ? camion.modelo : '',
        tipoRuta: r.tipoRuta,
        tarifaAplicada: r.tarifaAplicada,
        estado: r.estado,
        observaciones: r.observaciones,
      };
    });

    return {
      chofer,
      periodo,
      totalRegistros: registros.length,
      totalUrbanas: registros.filter(r => r.tipoRuta === Models.TipoRuta.URBANA).length,
      totalRurales: registros.filter(r => r.tipoRuta === Models.TipoRuta.RURAL).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      registros: detalleRegistros,
    };
  }
}
