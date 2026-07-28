/**
 * Repositorio de la hoja ResumenMensual.
 */
namespace ResumenMensualRepository {
  const SHEET = Constants.SHEETS.RESUMEN_MENSUAL;
  const C = Constants.COLS.RESUMEN_MENSUAL;

  function rowToResumen(row: unknown[]): Models.ResumenMensual {
    return {
      resumenId: String(row[C.RESUMEN_ID]),
      anio: NumberUtils.fromSheetInt(row[C.ANIO]),
      mes: NumberUtils.fromSheetInt(row[C.MES]),
      choferId: String(row[C.CHOFER_ID]),
      camionId: String(row[C.CAMION_ID]),
      totalRegistros: NumberUtils.fromSheetInt(row[C.TOTAL_REGISTROS]),
      totalUrbanas: NumberUtils.fromSheetInt(row[C.TOTAL_URBANAS]),
      totalRurales: NumberUtils.fromSheetInt(row[C.TOTAL_RURALES]),
      totalEspeciales: NumberUtils.fromSheetInt(row[C.TOTAL_ESPECIALES]),
      montoTotal: NumberUtils.fromSheetValue(row[C.MONTO_TOTAL]),
      fechaCalculo: DateUtils.fromSheetValue(row[C.FECHA_CALCULO]),
      recalculado: row[C.RECALCULADO] === true || row[C.RECALCULADO] === 'TRUE',
    };
  }

  function resumenToRow(r: Models.ResumenMensual): unknown[] {
    return [
      r.resumenId, r.anio, r.mes, r.choferId, r.camionId,
      r.totalRegistros, r.totalUrbanas, r.totalRurales, r.totalEspeciales,
      r.montoTotal, DateUtils.toISODate(r.fechaCalculo), r.recalculado,
    ];
  }

  export function findAll(): Models.ResumenMensual[] {
    return BaseRepository.getAllRows(SHEET).map(rowToResumen);
  }

  export function findByChoferAndPeriodo(
    choferId: string, anio: number, mes: number
  ): Models.ResumenMensual | null {
    const rows = BaseRepository.filterRows(
      SHEET,
      row =>
        String(row[C.CHOFER_ID]) === choferId &&
        NumberUtils.fromSheetInt(row[C.ANIO]) === anio &&
        NumberUtils.fromSheetInt(row[C.MES]) === mes
    );
    return rows.length > 0 ? rowToResumen(rows[0]) : null;
  }

  export function upsert(resumen: Models.ResumenMensual): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.RESUMEN_ID, resumen.resumenId);
    if (idx === -1) {
      BaseRepository.appendRow(SHEET, resumenToRow(resumen));
    } else {
      BaseRepository.updateRow(SHEET, idx, resumenToRow(resumen));
    }
  }
}
