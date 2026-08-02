/**
 * Repositorio de la hoja Tarifas.
 * Maneja el historial de tarifas y la obtención de la tarifa vigente.
 */
namespace TarifasRepository {
  const SHEET = Constants.SHEETS.TARIFAS;
  const C = Constants.COLS.TARIFAS;

  function rowToTarifa(row: unknown[]): Models.Tarifa {
    return {
      tarifaId: String(row[C.TARIFA_ID]),
      tipoOperacion: String(row[C.TIPO_OPERACION]) as Models.TipoOperacion,
      tipoZona: String(row[C.TIPO_ZONA]) as Models.TipoZona,
      valor: NumberUtils.fromSheetValue(row[C.VALOR]),
      descripcion: String(row[C.DESCRIPCION] ?? ''),
      fechaVigencia: DateUtils.fromSheetValue(row[C.FECHA_VIGENCIA]),
      fechaVencimiento: row[C.FECHA_VENCIMIENTO]
        ? DateUtils.fromSheetValue(row[C.FECHA_VENCIMIENTO])
        : null,
      activo: row[C.ACTIVO] === true || String(row[C.ACTIVO]).toUpperCase() === 'TRUE' || row[C.ACTIVO] === 1 || String(row[C.ACTIVO]).toUpperCase() === 'VERDADERO',
      creadoPor: String(row[C.CREADO_POR]),
      fechaCreacion: DateUtils.fromSheetValue(row[C.FECHA_CREACION]),
    };
  }

  function tarifaToRow(t: Models.Tarifa): unknown[] {
    return [
      t.tarifaId,
      t.tipoOperacion,
      t.tipoZona,
      t.valor,
      t.descripcion,
      DateUtils.toISODate(t.fechaVigencia),
      t.fechaVencimiento ? DateUtils.toISODate(t.fechaVencimiento) : '',
      t.activo,
      t.creadoPor,
      DateUtils.toISODate(t.fechaCreacion),
    ];
  }

  export function findAll(): Models.Tarifa[] {
    return BaseRepository.getAllRows(SHEET).map(rowToTarifa);
  }

  /** Retorna la tarifa activa para un tipo de operación y zona. */
  export function findVigente(tipoOperacion: Models.TipoOperacion, tipoZona: Models.TipoZona): Models.Tarifa | null {
    const rows = BaseRepository.filterRows(
      SHEET,
      row =>
        String(row[C.TIPO_OPERACION]) === tipoOperacion &&
        String(row[C.TIPO_ZONA]) === tipoZona &&
        (row[C.ACTIVO] === true || row[C.ACTIVO] === 'TRUE')
    );
    if (rows.length === 0) return null;
    return rowToTarifa(rows[rows.length - 1]); // La más reciente
  }

  export function findAllActive(): Models.Tarifa[] {
    return findAll().filter(t => t.activo);
  }

  export function create(tarifa: Models.Tarifa): void {
    BaseRepository.appendRow(SHEET, tarifaToRow(tarifa));
  }

  /** Desactiva todas las tarifas del mismo tipo+zona antes de agregar una nueva. */
  export function deactivateByTipo(tipoOperacion: Models.TipoOperacion, tipoZona: Models.TipoZona): void {
    const rows = BaseRepository.getAllRows(SHEET);
    const C_local = C;
    rows.forEach((row, idx) => {
      if (
        String(row[C_local.TIPO_OPERACION]) === tipoOperacion &&
        String(row[C_local.TIPO_ZONA]) === tipoZona &&
        (row[C_local.ACTIVO] === true || row[C_local.ACTIVO] === 'TRUE')
      ) {
        BaseRepository.softDelete(SHEET, idx, C_local.ACTIVO);
      }
    });
  }
}
