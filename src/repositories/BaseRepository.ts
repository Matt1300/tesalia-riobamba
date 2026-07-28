/**
 * Repositorio base con operaciones CRUD genéricas sobre Google Sheets.
 * Todos los repositorios específicos delegan aquí para leer/escribir datos.
 * La fila 1 siempre es el encabezado; los datos empiezan en la fila 2.
 */
namespace BaseRepository {
  /** Obtiene la hoja por nombre. Lanza error si no existe. */
  export function getSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(
        `Hoja "${sheetName}" no encontrada. Ejecute initializeSheets() primero.`
      );
    }
    return sheet;
  }

  /**
   * Retorna todas las filas de datos (sin cabecera).
   * Retorna array vacío si solo hay cabecera o la hoja está vacía.
   */
  export function getAllRows(sheetName: string): unknown[][] {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return [];
    return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  /** Agrega una nueva fila al final de la hoja. */
  export function appendRow(sheetName: string, row: unknown[]): void {
    const sheet = getSheet(sheetName);
    sheet.appendRow(row);
  }

  /**
   * Actualiza una fila existente.
   * @param rowIndex Índice 0-based de la fila de datos (sin contar cabecera).
   */
  export function updateRow(sheetName: string, rowIndex: number, row: unknown[]): void {
    const sheet = getSheet(sheetName);
    const sheetRow = rowIndex + 2; // +1 cabecera, +1 base-1
    sheet.getRange(sheetRow, 1, 1, row.length).setValues([row]);
  }

  /**
   * Elimina lógicamente una fila (no la borra físicamente).
   * Pone 'false' en la columna Activo indicada.
   */
  export function softDelete(sheetName: string, rowIndex: number, activoColIndex: number): void {
    const sheet = getSheet(sheetName);
    const sheetRow = rowIndex + 2;
    sheet.getRange(sheetRow, activoColIndex + 1).setValue(false);
  }

  /**
   * Busca el índice de la fila (0-based) donde una columna tiene el valor dado.
   * Retorna -1 si no encuentra.
   */
  export function findRowIndex(sheetName: string, colIndex: number, value: string): number {
    const rows = getAllRows(sheetName);
    return rows.findIndex(row => String(row[colIndex]).trim() === value.trim());
  }

  /** Busca y retorna la primera fila que coincide. Retorna null si no encuentra. */
  export function findRow(sheetName: string, colIndex: number, value: string): unknown[] | null {
    const rows = getAllRows(sheetName);
    return rows.find(row => String(row[colIndex]).trim() === value.trim()) ?? null;
  }

  /** Filtra filas con un predicado personalizado. */
  export function filterRows(
    sheetName: string,
    predicate: (row: unknown[]) => boolean
  ): unknown[][] {
    return getAllRows(sheetName).filter(predicate);
  }

  /**
   * Actualiza una celda específica por rowIndex y colIndex (ambos 0-based para datos).
   */
  export function updateCell(
    sheetName: string,
    rowIndex: number,
    colIndex: number,
    value: unknown
  ): void {
    const sheet = getSheet(sheetName);
    const sheetRow = rowIndex + 2;
    const sheetCol = colIndex + 1;
    sheet.getRange(sheetRow, sheetCol).setValue(value);
  }
}
