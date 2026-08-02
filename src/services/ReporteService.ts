/**
 * Servicio de reportes y totales.
 * Todas las consultas de alto nivel pasan por aquí.
 */
namespace ReporteService {
  export interface TotalPorChofer {
    chofer: Models.Chofer;
    totalRegistros: number;
    totalEntregas: number;
    totalRecargues: number;
    montoTotal: number;
  }

  export interface TotalPorOperacion {
    tipoOperacion: Models.TipoOperacion;
    tipoZona: Models.TipoZona;
    totalRegistros: number;
    montoTotal: number;
  }

  export interface ResumenPeriodo {
    totalRegistros: number;
    totalEntregas: number;
    totalRecargues: number;
    montoTotal: number;
    porChofer: TotalPorChofer[];
    porOperacion: TotalPorOperacion[];
  }

  /** Reporte global por período (admin). */
  export function getResumenPeriodo(
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): ResumenPeriodo {
    RoleGuard.requirePermission(session, Auth.Permission.VER_REPORTES_GLOBALES);

    const registros = RegistrosRepository.findByFiltro(filtro);

    const porChoferMap = new Map<string, TotalPorChofer>();

    for (const r of registros) {
      if (!porChoferMap.has(r.choferId)) {
        const chofer = ChoferesRepository.findById(r.choferId);
        if (!chofer) continue;
        porChoferMap.set(r.choferId, {
          chofer,
          totalRegistros: 0,
          totalEntregas: 0,
          totalRecargues: 0,
          montoTotal: 0,
        });
      }

      const entry = porChoferMap.get(r.choferId)!;
      entry.totalRegistros++;
      entry.montoTotal = NumberUtils.round2(entry.montoTotal + r.tarifaAplicada);
      if (r.tipoOperacion === Models.TipoOperacion.ENTREGA) entry.totalEntregas++;
      if (r.tipoOperacion === Models.TipoOperacion.RECARGUE) entry.totalRecargues++;
    }

    const combos: Array<[Models.TipoOperacion, Models.TipoZona]> = [
      [Models.TipoOperacion.ENTREGA, Models.TipoZona.URBANO],
      [Models.TipoOperacion.ENTREGA, Models.TipoZona.FORANEO],
      [Models.TipoOperacion.ENTREGA, Models.TipoZona.EXTRAFORANEO],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.URBANO],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.FORANEO],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.EXTRAFORANEO],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.FULL],
    ];
    const porOperacion: TotalPorOperacion[] = combos.map(([op, zona]) => ({
      tipoOperacion: op,
      tipoZona: zona,
      totalRegistros: registros.filter(r => r.tipoOperacion === op && r.tipoZona === zona).length,
      montoTotal: NumberUtils.round2(
        registros.filter(r => r.tipoOperacion === op && r.tipoZona === zona)
          .reduce((s, r) => s + r.tarifaAplicada, 0)
      ),
    }));

    return {
      totalRegistros: registros.length,
      totalEntregas: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.ENTREGA).length,
      totalRecargues: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.RECARGUE).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      porChofer: Array.from(porChoferMap.values()),
      porOperacion,
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

    const registros = RegistrosRepository.findByFiltro({ ...filtro, choferId });

    const periodo = filtro.anio && filtro.mes
      ? `${DateUtils.monthName(filtro.mes)} ${filtro.anio}`
      : filtro.fechaDesde && filtro.fechaHasta
        ? `${filtro.fechaDesde} → ${filtro.fechaHasta}`
        : 'Todo el período';

    return {
      chofer,
      totalRegistros: registros.length,
      totalEntregas: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.ENTREGA).length,
      totalRecargues: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.RECARGUE).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      periodo,
    };
  }

  export interface DetalleRegistro {
    registroId: string;
    fecha: string;
    placa: string;
    camionPatente: string;
    tipoOperacion: Models.TipoOperacion;
    tipoZona: Models.TipoZona;
    cantidadRecargues: number;
    kilometraje: number;
    tieneRechazos: boolean;
    tarifaAplicada: number;
    estado: Models.EstadoRegistro;
    observaciones: string;
  }

  export interface DetalleChofer {
    chofer: Models.Chofer;
    periodo: string;
    totalRegistros: number;
    totalEntregas: number;
    totalRecargues: number;
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

    const registros = RegistrosRepository.findByFiltro({ ...filtro, choferId });

    const periodo = filtro.anio && filtro.mes
      ? `${DateUtils.monthName(filtro.mes)} ${filtro.anio}`
      : filtro.fechaDesde && filtro.fechaHasta
        ? `${filtro.fechaDesde} - ${filtro.fechaHasta}`
        : 'Todo el período';

    const detalleRegistros: DetalleRegistro[] = registros.map(r => ({
      registroId: r.registroId,
      fecha: DateUtils.toISODate(r.fecha),
      placa: r.placa,
      camionPatente: r.placa, // alias para compatibilidad con el frontend
      tipoOperacion: r.tipoOperacion,
      tipoZona: r.tipoZona,
      cantidadRecargues: r.cantidadRecargues,
      kilometraje: r.kilometraje,
      tieneRechazos: r.tieneRechazos,
      tarifaAplicada: r.tarifaAplicada,
      estado: r.estado,
      observaciones: r.observaciones,
    }));

    return {
      chofer,
      periodo,
      totalRegistros: registros.length,
      totalEntregas: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.ENTREGA).length,
      totalRecargues: registros.filter(r => r.tipoOperacion === Models.TipoOperacion.RECARGUE).length,
      montoTotal: NumberUtils.round2(registros.reduce((s, r) => s + r.tarifaAplicada, 0)),
      registros: detalleRegistros,
    };
  }
}
