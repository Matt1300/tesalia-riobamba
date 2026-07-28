/**
 * Script de inicialización del sistema.
 * Crea todas las hojas de Google Sheets con sus cabeceras.
 * Se ejecuta UNA SOLA VEZ al iniciar el proyecto o al resetear la base de datos.
 *
 * Para ejecutar: Setup.initialize() desde el editor de Apps Script.
 */
namespace Setup {
  /**
   * Inicializa todas las hojas del Spreadsheet.
   * Si una hoja ya existe, la respeta (no borra datos).
   * Si no existe, la crea con sus cabeceras.
   */
  export function initialize(): void {
    AppLogger.info('Setup', 'Iniciando configuración del Spreadsheet...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    crearHoja(ss, Constants.SHEETS.USUARIOS, Constants.HEADERS.USUARIOS);
    crearHoja(ss, Constants.SHEETS.CHOFERES, Constants.HEADERS.CHOFERES);
    crearHoja(ss, Constants.SHEETS.CAMIONES, Constants.HEADERS.CAMIONES);
    crearHoja(ss, Constants.SHEETS.TARIFAS, Constants.HEADERS.TARIFAS);
    crearHoja(ss, Constants.SHEETS.REGISTROS, Constants.HEADERS.REGISTROS);
    crearHoja(ss, Constants.SHEETS.RESUMEN_MENSUAL, Constants.HEADERS.RESUMEN_MENSUAL);
    crearHoja(ss, Constants.SHEETS.CONFIGURACION, Constants.HEADERS.CONFIGURACION);
    crearHoja(ss, Constants.SHEETS.AUDITORIA, Constants.HEADERS.AUDITORIA);

    insertarConfiguracionPorDefecto(ss);
    insertarTarifasIniciales(ss);

    // Eliminar hoja "Hoja 1" por defecto si existe y está vacía
    const hoja1 = ss.getSheetByName('Hoja 1') ?? ss.getSheetByName('Sheet1');
    if (hoja1 && ss.getSheets().length > 1) {
      ss.deleteSheet(hoja1);
    }

    AppLogger.info('Setup', 'Configuración completada. El sistema está listo.');
    SpreadsheetApp.getUi().alert('✅ Sistema inicializado correctamente.\n\nTodas las hojas han sido creadas.');
  }

  function crearHoja(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    nombre: string,
    cabeceras: readonly string[]
  ): void {
    let sheet = ss.getSheetByName(nombre);

    if (!sheet) {
      sheet = ss.insertSheet(nombre);
      AppLogger.info('Setup', `Hoja creada: ${nombre}`);
    } else {
      AppLogger.info('Setup', `Hoja ya existe: ${nombre} (respetando datos existentes)`);
    }

    // Poner cabeceras solo si la fila 1 está vacía
    const primeraFila = sheet.getRange(1, 1, 1, cabeceras.length).getValues()[0];
    const estaVacia = primeraFila.every(v => v === '' || v === null);

    if (estaVacia) {
      sheet.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras as string[]]);
      formatearCabecera(sheet, cabeceras.length);
    }
  }

  function formatearCabecera(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    numCols: number
  ): void {
    const rango = sheet.getRange(1, 1, 1, numCols);
    rango.setBackground('#1a73e8');
    rango.setFontColor('#ffffff');
    rango.setFontWeight('bold');
    rango.setFontSize(11);
    sheet.setFrozenRows(1);
  }

  function insertarConfiguracionPorDefecto(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet
  ): void {
    const sheet = ss.getSheetByName(Constants.SHEETS.CONFIGURACION);
    if (!sheet || sheet.getLastRow() > 1) return; // Ya tiene datos

    const ahora = new Date().toISOString();
    const C = Constants.COLS.CONFIGURACION;

    const configs: Record<string, string> = {
      [Constants.CONFIG_KEYS.APP_NOMBRE]: 'Tesalia Riobamba - Control de Rutas',
      [Constants.CONFIG_KEYS.MONEDA]: 'USD',
      [Constants.CONFIG_KEYS.TIMEZONE]: 'America/Guayaquil',
      [Constants.CONFIG_KEYS.EMAIL_NOTIFICACIONES]: '',
    };

    const descripciones: Record<string, string> = {
      [Constants.CONFIG_KEYS.APP_NOMBRE]: 'Nombre de la aplicación',
      [Constants.CONFIG_KEYS.MONEDA]: 'Moneda del sistema (USD, EUR, etc.)',
      [Constants.CONFIG_KEYS.TIMEZONE]: 'Zona horaria',
      [Constants.CONFIG_KEYS.EMAIL_NOTIFICACIONES]: 'Email para notificaciones del sistema',
    };

    Object.entries(configs).forEach(([clave, valor]) => {
      sheet.appendRow([clave, valor, descripciones[clave] ?? '', 'system', ahora]);
    });

    AppLogger.info('Setup', 'Configuración por defecto insertada.');
  }

  function insertarTarifasIniciales(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet
  ): void {
    const sheet = ss.getSheetByName(Constants.SHEETS.TARIFAS);
    if (!sheet || sheet.getLastRow() > 1) return; // Ya tiene datos

    const ahora = new Date().toISOString();

    const tarifas = [
      [IdGenerator.uuid(), Models.TipoRuta.URBANA, 0, 'Ruta Urbana', ahora, '', true, 'system', ahora],
      [IdGenerator.uuid(), Models.TipoRuta.RURAL, 0, 'Ruta Rural', ahora, '', true, 'system', ahora],
    ];

    tarifas.forEach(fila => sheet.appendRow(fila));

    AppLogger.warn(
      'Setup',
      'Tarifas iniciales creadas con valor $0. ' +
      'Configure los valores reales desde la sección Administración > Tarifas.'
    );
  }
}
