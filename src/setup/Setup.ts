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
    try {
      SpreadsheetApp.getUi().alert('✅ Sistema inicializado correctamente.\n\nTodas las hojas han sido creadas.');
    } catch (_) { /* Sin UI disponible al ejecutar desde el editor */ }
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
    const appNombre = Environment.getAppNombre();

    // Si ya existe un form en config, editarlo en lugar de crear uno nuevo.
    let form: GoogleAppsScript.Forms.Form;
    const existingId = Environment.getFormId();
    if (existingId) {
      try {
        form = FormApp.openById(existingId);
        // Limpiar todas las preguntas existentes para reconstruirlas
        form.getItems().slice().reverse().forEach(item => form.deleteItem(item));
        AppLogger.info('Setup', `Actualizando formulario existente: ${existingId}`);
      } catch (_) {
        AppLogger.warn('Setup', 'Form ID en config no accesible. Creando uno nuevo...');
        form = FormApp.create(`${appNombre} — Registro de Ruta`);
        form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
        _setConfigValue(ss, Constants.CONFIG_KEYS.FORM_ID, form.getId());
        Environment.clearCache();
      }
    } else {
      form = FormApp.create(`${appNombre} — Registro de Ruta`);
      form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
      _setConfigValue(ss, Constants.CONFIG_KEYS.FORM_ID, form.getId());
      Environment.clearCache();
    }

    form.setDescription('Formulario para que los choferes registren sus rutas diarias.');
    form.setCollectEmail(false);
    form.setShowLinkToRespondAgain(true);
    form.setConfirmationMessage('¡Registro enviado correctamente! Será revisado por el administrador.');

    const validacionNum = FormApp.createTextValidation()
      .requireNumberGreaterThan(0)
      .build();

    // ── Sección 1: Datos de identificación ───────────────────────────────────
    // (la sección 1 existe por defecto al crear el form)

    (form.addTextItem() as GoogleAppsScript.Forms.TextItem)
      .setTitle('Transporte')
      .setRequired(true)
      .setValidation(validacionNum)
      .setHelpText('Número de transporte');

    (form.addTextItem() as GoogleAppsScript.Forms.TextItem)
      .setTitle('Ruta')
      .setRequired(true)
      .setValidation(validacionNum)
      .setHelpText('Número de ruta');

    (form.addTextItem() as GoogleAppsScript.Forms.TextItem)
      .setTitle('Placa')
      .setRequired(true)
      .setHelpText('Ingrese la placa. Ej: RBH-1239');

    // ── Sección 2 (condicional): Solo para Recargue ───────────────────────────
    const seccionRecargue = form.addPageBreakItem()
      .setTitle('Recargue — Cantidad');

    form.addMultipleChoiceItem()
      .setTitle('Cantidad de recargues')
      .setChoiceValues(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'])
      .setRequired(true);

    // ── Sección 3: Datos del recorrido ────────────────────────────────────────
    const seccionResto = form.addPageBreakItem()
      .setTitle('Datos del recorrido');

    form.addMultipleChoiceItem()
      .setTitle('Tipo de zona')
      .setChoiceValues(['Urbano', 'Foráneo', 'Extraforáneo', 'Full'])
      .setRequired(true);

    (form.addTextItem() as GoogleAppsScript.Forms.TextItem)
      .setTitle('Kilometraje')
      .setRequired(true)
      .setValidation(validacionNum)
      .setHelpText('Km recorridos en el día');

    form.addMultipleChoiceItem()
      .setTitle('¿Tuvo rechazos en el día?')
      .setChoiceValues(['Sí', 'No'])
      .setRequired(true);

    form.addParagraphTextItem()
      .setTitle('Observaciones')
      .setRequired(false)
      .setHelpText('Opcional: novedades del recorrido');

    // ── Navegación condicional desde Sección 1 ────────────────────────────────
    // Insertar "Tipo de operación" en sección 1 (antes de los page breaks).
    // Lo creamos al final y lo movemos a la posición correcta (índice 3, tras Placa).
    const itemTipoOp = form.addMultipleChoiceItem();
    itemTipoOp
      .setTitle('Tipo de operación')
      .setRequired(true)
      .setChoices([
        itemTipoOp.createChoice('Entrega',  seccionResto),
        itemTipoOp.createChoice('Recargue', seccionRecargue),
      ]);

    // Mover "Tipo de operación" a posición 3 (justo después de Placa).
    // Buscamos por título para no depender de que sea el último item.
    const allItems = form.getItems();
    const tipoOpIdx = allItems.map(i => i.getTitle()).indexOf('Tipo de operación');
    if (tipoOpIdx > 3) {
      form.moveItem(tipoOpIdx, 3);
    }
    AppLogger.info('Setup', `Items del form tras moveItem: ${form.getItems().map((i, idx) => idx + ':' + i.getTitle()).join(', ')}`);

    // Al final de la sección 2 redirigir a sección 3 (no al siguiente por defecto)
    seccionRecargue.setGoToPage(seccionResto);

    const url = form.getPublishedUrl();
    AppLogger.info('Setup', `Formulario creado: ${url}`);
    try {
      SpreadsheetApp.getUi().alert(
        `✅ Formulario creado exitosamente.\n\n` +
        `URL para compartir con los choferes:\n${url}\n\n` +
        `Próximo paso: ejecuta installTriggers() para activar el procesamiento automático.`
      );
    } catch (_) { /* Sin UI disponible al ejecutar desde el editor */ }
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

  /**
   * Migra las hojas existentes agregando columnas faltantes al final.
   * NO elimina columnas ni toca datos existentes.
   * Ejecutar cuando se agreguen nuevas columnas a Constants.HEADERS.
   */
  export function migrateSheets(): void {
    AppLogger.info('Setup', 'Iniciando migración de hojas...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let totalAgregadas = 0;

    const hojas: Array<{ nombre: string; cabeceras: readonly string[] }> = [
      { nombre: Constants.SHEETS.USUARIOS,       cabeceras: Constants.HEADERS.USUARIOS },
      { nombre: Constants.SHEETS.CHOFERES,       cabeceras: Constants.HEADERS.CHOFERES },
      { nombre: Constants.SHEETS.CAMIONES,       cabeceras: Constants.HEADERS.CAMIONES },
      { nombre: Constants.SHEETS.TARIFAS,        cabeceras: Constants.HEADERS.TARIFAS },
      { nombre: Constants.SHEETS.REGISTROS,      cabeceras: Constants.HEADERS.REGISTROS },
      { nombre: Constants.SHEETS.RESUMEN_MENSUAL,cabeceras: Constants.HEADERS.RESUMEN_MENSUAL },
      { nombre: Constants.SHEETS.CONFIGURACION,  cabeceras: Constants.HEADERS.CONFIGURACION },
      { nombre: Constants.SHEETS.AUDITORIA,      cabeceras: Constants.HEADERS.AUDITORIA },
      { nombre: Constants.SHEETS.FORM_ERRORES,   cabeceras: Constants.HEADERS.FORM_ERRORES },
    ];

    for (const { nombre, cabeceras } of hojas) {
      totalAgregadas += _migrarHoja(ss, nombre, cabeceras);
    }

    const msg = totalAgregadas === 0
      ? 'Migración completada. No hubo cambios (todas las hojas ya tienen las columnas correctas).'
      : `Migración completada. Se agregaron ${totalAgregadas} columna(s) nueva(s).`;

    AppLogger.info('Setup', msg);
    try { SpreadsheetApp.getUi().alert(`✅ ${msg}`); } catch (_) {}
  }

  function _migrarHoja(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    nombre: string,
    cabecerasEsperadas: readonly string[]
  ): number {
    const sheet = ss.getSheetByName(nombre);
    if (!sheet) {
      AppLogger.warn('Setup', `Hoja no encontrada, omitiendo: ${nombre}`);
      return 0;
    }

    const lastCol = sheet.getLastColumn();
    const cabecerasActuales: string[] = lastCol > 0
      ? (sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[])
      : [];

    let agregadas = 0;
    for (const cabecera of cabecerasEsperadas) {
      if (!cabecerasActuales.includes(cabecera)) {
        const newCol = cabecerasActuales.length + agregadas + 1;
        const cell = sheet.getRange(1, newCol);
        cell.setValue(cabecera);
        cell.setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11);
        agregadas++;
        AppLogger.info('Setup', `  [${nombre}] Columna agregada: ${cabecera} (col ${newCol})`);
      }
    }

    if (agregadas > 0) {
      sheet.setFrozenRows(1);
    }

    return agregadas;
  }

  function insertarTarifasIniciales(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet
  ): void {
    const sheet = ss.getSheetByName(Constants.SHEETS.TARIFAS);
    if (!sheet || sheet.getLastRow() > 1) return; // Ya tiene datos

    const ahora = new Date().toISOString();

    const tarifas: [string, string, number, string][] = [
      [Models.TipoOperacion.ENTREGA,  Models.TipoZona.URBANO,       140, 'Entrega Urbano'],
      [Models.TipoOperacion.ENTREGA,  Models.TipoZona.FORANEO,      148, 'Entrega Foráneo'],
      [Models.TipoOperacion.ENTREGA,  Models.TipoZona.EXTRAFORANEO, 174, 'Entrega Extraforáneo'],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.URBANO,       105, 'Recargue Urbano (por recargue)'],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.FORANEO,      115, 'Recargue Foráneo (por recargue)'],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.EXTRAFORANEO, 150, 'Recargue Extraforáneo (por recargue)'],
      [Models.TipoOperacion.RECARGUE, Models.TipoZona.FULL,         140, 'Recargue Full (por recargue)'],
    ];

    tarifas.forEach(([op, zona, valor, desc]) => {
      sheet.appendRow([IdGenerator.uuid(), op, zona, valor, desc, ahora, '', true, 'system', ahora]);
    });

    // Insertar monto de rechazo en Configuracion
    const configSheet = ss.getSheetByName(Constants.SHEETS.CONFIGURACION);
    if (configSheet) {
      const data = configSheet.getDataRange().getValues();
      const existe = data.some(row => String(row[0]) === Constants.CONFIG_KEYS.MONTO_RECHAZO);
      if (!existe) {
        configSheet.appendRow([Constants.CONFIG_KEYS.MONTO_RECHAZO, '5', 'Descuento por rechazos en el día ($)', 'system', ahora]);
      }
    }

    AppLogger.info('Setup', 'Tarifas iniciales insertadas con valores reales.');
  }
}
