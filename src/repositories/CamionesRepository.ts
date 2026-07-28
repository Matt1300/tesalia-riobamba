/**
 * Repositorio de la hoja Camiones.
 */
namespace CamionesRepository {
  const SHEET = Constants.SHEETS.CAMIONES;
  const C = Constants.COLS.CAMIONES;

  function rowToCamion(row: unknown[]): Models.Camion {
    return {
      camionId: String(row[C.CAMION_ID]),
      patente: String(row[C.PATENTE]),
      modelo: String(row[C.MODELO]),
      anio: NumberUtils.fromSheetInt(row[C.ANIO]),
      choferId: String(row[C.CHOFER_ID]),
      activo: row[C.ACTIVO] === true || row[C.ACTIVO] === 'TRUE',
      notas: String(row[C.NOTAS] ?? ''),
    };
  }

  function camionToRow(c: Models.Camion): unknown[] {
    return [
      c.camionId,
      c.patente,
      c.modelo,
      c.anio,
      c.choferId,
      c.activo,
      c.notas,
    ];
  }

  export function findAll(): Models.Camion[] {
    return BaseRepository.getAllRows(SHEET).map(rowToCamion);
  }

  export function findActive(): Models.Camion[] {
    return findAll().filter(c => c.activo);
  }

  export function findById(camionId: string): Models.Camion | null {
    const row = BaseRepository.findRow(SHEET, C.CAMION_ID, camionId);
    return row ? rowToCamion(row) : null;
  }

  export function findByPatente(patente: string): Models.Camion | null {
    const row = BaseRepository.findRow(SHEET, C.PATENTE, patente.toUpperCase());
    return row ? rowToCamion(row) : null;
  }

  export function findByChoferId(choferId: string): Models.Camion[] {
    return BaseRepository.filterRows(SHEET, row => String(row[C.CHOFER_ID]) === choferId)
      .map(rowToCamion);
  }

  export function create(camion: Models.Camion): void {
    BaseRepository.appendRow(SHEET, camionToRow(camion));
  }

  export function update(camion: Models.Camion): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.CAMION_ID, camion.camionId);
    if (idx === -1) throw new Error(`Camión ${camion.camionId} no encontrado.`);
    BaseRepository.updateRow(SHEET, idx, camionToRow(camion));
  }

  export function deactivate(camionId: string): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.CAMION_ID, camionId);
    if (idx === -1) throw new Error(`Camión ${camionId} no encontrado.`);
    BaseRepository.softDelete(SHEET, idx, C.ACTIVO);
  }
}
