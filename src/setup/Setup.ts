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
    crearHoja(ss, Constants.SHEETS.FORM_ERRORES, Constants.HEADERS.FORM_ERRORES);

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

    const configs: [string, string, string][] = [
      [Constants.CONFIG_KEYS.APP_NOMBRE,           'Tesalia Riobamba - Control de Rutas', 'Nombre de la aplicación'],
      [Constants.CONFIG_KEYS.MONEDA,               'USD',                                  'Moneda del sistema (USD, EUR, etc.)'],
      [Constants.CONFIG_KEYS.TIMEZONE,             'America/Guayaquil',                    'Zona horaria'],
      [Constants.CONFIG_KEYS.EMAIL_NOTIFICACIONES, '',                                     'Email del admin para notificaciones (dejar vacío para deshabilitar)'],
      [Constants.CONFIG_KEYS.FORM_ID,              '',                                     'ID del Google Form (se llena automáticamente al ejecutar setupForm)'],
    ];

    configs.forEach(([clave, valor, desc]) => {
      sheet.appendRow([clave, valor, desc, 'system', ahora]);
    });

    AppLogger.info('Setup', 'Configuración por defecto insertada.');
  }

  /**
   * Crea el Google Form de registro de rutas y lo vincula al Spreadsheet.
   * Ejecutar UNA SOLA VEZ después de initialize().
   * Guarda el ID del form en la hoja Configuracion.
   */
  export function crearFormulario(): void {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Verificar si ya existe
    const existingId = Environment.getFormId();
    if (existingId) {
      try {
        const existing = FormApp.openById(existingId);
        const msg = `El formulario ya existe.\n\nURL para choferes:\n${existing.getPublishedUrl()}`;
        AppLogger.info('Setup', msg);
        SpreadsheetApp.getUi().alert(msg);
        return;
      } catch (_) {
        AppLogger.warn('Setup', 'Form ID en config no encontrado. Creando uno nuevo...');
      }
    }

    const appNombre = Environment.getAppNombre();
    const form = FormApp.create(`${appNombre} — Registro de Ruta`);

    form.setDescription('Formulario para que los choferes registren sus rutas diarias.');
    form.setCollectEmail(true);
    form.setShowLinkToRespondAgain(true);
    form.setConfirmationMessage('¡Registro enviado correctamente! Será revisado por el administrador.');

    // Pregunta 1: Fecha del recorrido
    form.addDateItem()
      .setTitle('Fecha del recorrido')
      .setRequired(true);

    // Pregunta 2: Placa del camión
    (form.addTextItem() as GoogleAppsScript.Forms.TextItem)
      .setTitle('Placa del camión')
      .setRequired(true)
      .setHelpText('Ingrese la placa en mayúsculas. Ej: ABC-1234');

    // Pregunta 3: Tipo de ruta
    form.addMultipleChoiceItem()
      .setTitle('Tipo de ruta')
      .setChoiceValues(['URBANA', 'RURAL'])
      .setRequired(true);

    // Pregunta 4: Observaciones (opcional)
    form.addParagraphTextItem()
      .setTitle('Observaciones')
      .setRequired(false)
      .setHelpText('Opcional: novedades del recorrido');

    // Vincular al Spreadsheet actual (crea hoja "Form Responses 1")
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    // Guardar el ID en Configuracion
    _setConfigValue(ss, Constants.CONFIG_KEYS.FORM_ID, form.getId());
    Environment.clearCache();

    const url = form.getPublishedUrl();
    AppLogger.info('Setup', `Formulario creado: ${url}`);
    SpreadsheetApp.getUi().alert(
      `✅ Formulario creado exitosamente.\n\n` +
      `URL para compartir con los choferes:\n${url}\n\n` +
      `Próximo paso: ejecuta installTriggers() para activar el procesamiento automático.`
    );
  }

  function _setConfigValue(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    clave: string,
    valor: string
  ): void {
    const sheet = ss.getSheetByName(Constants.SHEETS.CONFIGURACION);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][Constants.COLS.CONFIGURACION.CLAVE]) === clave) {
        sheet.getRange(i + 1, Constants.COLS.CONFIGURACION.VALOR + 1).setValue(valor);
        sheet.getRange(i + 1, Constants.COLS.CONFIGURACION.FECHA_MODIFICACION + 1)
          .setValue(new Date().toISOString());
        return;
      }
    }
    // Si no existe la fila, la agrega
    sheet.appendRow([clave, valor, '', 'setup', new Date().toISOString()]);
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
