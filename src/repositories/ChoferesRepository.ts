/**
 * Repositorio de la hoja Choferes.
 */
namespace ChoferesRepository {
  const SHEET = Constants.SHEETS.CHOFERES;
  const C = Constants.COLS.CHOFERES;

  function rowToChofer(row: unknown[]): Models.Chofer {
    return {
      choferId: String(row[C.CHOFER_ID]),
      nombre: String(row[C.NOMBRE]),
      telefono: String(row[C.TELEFONO]),
      dni: String(row[C.DNI]),
      fechaIngreso: DateUtils.fromSheetValue(row[C.FECHA_INGRESO]),
      activo: row[C.ACTIVO] === true || row[C.ACTIVO] === 'TRUE',
      notas: String(row[C.NOTAS] ?? ''),
    };
  }

  function choferToRow(c: Models.Chofer): unknown[] {
    return [
      c.choferId,
      c.nombre,
      c.telefono,
      c.dni,
      DateUtils.toISODate(c.fechaIngreso),
      c.activo,
      c.notas,
    ];
  }

  export function findAll(): Models.Chofer[] {
    return BaseRepository.getAllRows(SHEET).map(rowToChofer);
  }

  export function findActive(): Models.Chofer[] {
    return findAll().filter(c => c.activo);
  }

  export function findById(choferId: string): Models.Chofer | null {
    const row = BaseRepository.findRow(SHEET, C.CHOFER_ID, choferId);
    return row ? rowToChofer(row) : null;
  }

  export function findByDni(dni: string): Models.Chofer | null {
    const row = BaseRepository.findRow(SHEET, C.DNI, dni);
    return row ? rowToChofer(row) : null;
  }

  export function create(chofer: Models.Chofer): void {
    BaseRepository.appendRow(SHEET, choferToRow(chofer));
  }

  export function update(chofer: Models.Chofer): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.CHOFER_ID, chofer.choferId);
    if (idx === -1) throw new Error(`Chofer ${chofer.choferId} no encontrado.`);
    BaseRepository.updateRow(SHEET, idx, choferToRow(chofer));
  }

  export function deactivate(choferId: string): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.CHOFER_ID, choferId);
    if (idx === -1) throw new Error(`Chofer ${choferId} no encontrado.`);
    BaseRepository.softDelete(SHEET, idx, C.ACTIVO);
  }
}
