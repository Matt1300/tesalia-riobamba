/**
 * Repositorio de la hoja Registros.
 * Es la hoja más consultada del sistema.
 */
namespace RegistrosRepository {
  const SHEET = Constants.SHEETS.REGISTROS;
  const C = Constants.COLS.REGISTROS;

  function rowToRegistro(row: unknown[]): Models.Registro {
    return {
      registroId: String(row[C.REGISTRO_ID]),
      fecha: DateUtils.fromSheetValue(row[C.FECHA]),
      choferId: String(row[C.CHOFER_ID]),
      camionId: String(row[C.CAMION_ID]),
      tipoRuta: String(row[C.TIPO_RUTA]) as Models.TipoRuta,
      tarifaAplicada: NumberUtils.fromSheetValue(row[C.TARIFA_APLICADA]),
      observaciones: String(row[C.OBSERVACIONES] ?? ''),
      origen: String(row[C.ORIGEN]) as Models.OrigenRegistro,
      formResponseId: row[C.FORM_RESPONSE_ID] ? String(row[C.FORM_RESPONSE_ID]) : null,
      estado: String(row[C.ESTADO]) as Models.EstadoRegistro,
      validadoPor: row[C.VALIDADO_POR] ? String(row[C.VALIDADO_POR]) : null,
      fechaValidacion: row[C.FECHA_VALIDACION]
        ? DateUtils.fromSheetValue(row[C.FECHA_VALIDACION])
        : null,
      creadoEn: DateUtils.fromSheetValue(row[C.CREADO_EN]),
      modificadoEn: DateUtils.fromSheetValue(row[C.MODIFICADO_EN]),
    };
  }

  function registroToRow(r: Models.Registro): unknown[] {
    return [
      r.registroId,
      DateUtils.toISODate(r.fecha),
      r.choferId,
      r.camionId,
      r.tipoRuta,
      r.tarifaAplicada,
      r.observaciones,
      r.origen,
      r.formResponseId ?? '',
      r.estado,
      r.validadoPor ?? '',
      r.fechaValidacion ? DateUtils.toISODate(r.fechaValidacion) : '',
      DateUtils.toISODate(r.creadoEn),
      DateUtils.toISODate(r.modificadoEn),
    ];
  }

  export function findAll(): Models.Registro[] {
    return BaseRepository.getAllRows(SHEET).map(rowToRegistro);
  }

  export function findById(registroId: string): Models.Registro | null {
    const row = BaseRepository.findRow(SHEET, C.REGISTRO_ID, registroId);
    return row ? rowToRegistro(row) : null;
  }

  export function findByChoferId(choferId: string): Models.Registro[] {
    return BaseRepository.filterRows(SHEET, row => String(row[C.CHOFER_ID]) === choferId)
      .map(rowToRegistro);
  }

  export function findByFormResponseId(responseId: string): Models.Registro | null {
    const row = BaseRepository.findRow(SHEET, C.FORM_RESPONSE_ID, responseId);
    return row ? rowToRegistro(row) : null;
  }

  export function findByFiltro(filtro: DTO.FiltroReporteDTO): Models.Registro[] {
    return findAll().filter(r => {
      if (filtro.choferId && r.choferId !== filtro.choferId) return false;
      if (filtro.camionId && r.camionId !== filtro.camionId) return false;
      if (filtro.tipoRuta && r.tipoRuta !== filtro.tipoRuta) return false;
      if (filtro.estado && r.estado !== filtro.estado) return false;
      if (filtro.fechaDesde && r.fecha < DateUtils.parseISODate(filtro.fechaDesde)) return false;
      if (filtro.fechaHasta && r.fecha > DateUtils.parseISODate(filtro.fechaHasta)) return false;
      if (filtro.anio) {
        const { anio } = DateUtils.getYearMonth(r.fecha);
        if (anio !== filtro.anio) return false;
      }
      if (filtro.mes) {
        const { mes } = DateUtils.getYearMonth(r.fecha);
        if (mes !== filtro.mes) return false;
      }
      return true;
    });
  }

  export function create(registro: Models.Registro): void {
    BaseRepository.appendRow(SHEET, registroToRow(registro));
  }

  export function update(registro: Models.Registro): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.REGISTRO_ID, registro.registroId);
    if (idx === -1) throw new Error(`Registro ${registro.registroId} no encontrado.`);
    registro.modificadoEn = new Date();
    BaseRepository.updateRow(SHEET, idx, registroToRow(registro));
  }

  /** Marca un registro como eliminado cambiando su estado. */
  export function markDeleted(registroId: string): void {
    const registro = findById(registroId);
    if (!registro) throw new Error(`Registro ${registroId} no encontrado.`);
    registro.estado = Models.EstadoRegistro.RECHAZADO;
    update(registro);
  }
}
