/**
 * Trigger del Google Form.
 * Se ejecuta automáticamente cada vez que un chofer envía el formulario diario.
 * Mapea las respuestas del Form a un CreateRegistroDTO y llama al RegistroService.
 */
namespace FormTrigger {
  /**
   * Punto de entrada del trigger onFormSubmit.
   * El evento contiene las respuestas del formulario.
   */
  export function handle(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
    // Capturar la placa antes del try para poder identificar el chofer si falla
    const placa = e.values[3]?.trim().toUpperCase() ?? '';

    try {
      AppLogger.info('FormTrigger', 'Nueva respuesta de formulario recibida');

      const dto = parseFormResponse(e);
      const registro = RegistroService.crearDesdeForm(dto);

      AppLogger.info('FormTrigger', `Registro creado desde form para chofer: ${dto.choferId}`);
      _marcarEstado(e, 'PROCESADO', `Registro ID: ${registro.registroId}`);
      _notificarAdmin(dto, registro);
    } catch (err) {
      AppLogger.error('FormTrigger', 'Error al procesar respuesta del form', err);
      const msg = err instanceof Error ? err.message : String(err);
      _marcarEstado(e, 'ERROR', msg);
      _guardarError(e, placa, msg);
      _notificarAdmin_Error(err);
    }
  }

  /**
   * Escribe el estado del procesamiento de vuelta en la fila de la hoja
   * "Form Responses 1", usando e.range para apuntar a la fila exacta.
   * Si los headers de estado no existen aún, los crea automáticamente.
   */
  function _marcarEstado(
    e: GoogleAppsScript.Events.SheetsOnFormSubmit,
    estado: 'PROCESADO' | 'ERROR',
    detalle: string
  ): void {
    try {
      const sheet = e.range.getSheet();
      const row   = e.range.getRow();

      // Buscar o crear las columnas de estado en la fila de headers
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] as string[];
      let estadoCol = headers.indexOf('Estado') + 1;

      if (estadoCol === 0) {
        // Primera vez: agregar las tres columnas de estado
        estadoCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, estadoCol, 1, 3).setValues([['Estado', 'Detalle', 'Procesado En']]);
        sheet.getRange(1, estadoCol, 1, 3)
          .setBackground('#1a73e8')
          .setFontColor('#ffffff')
          .setFontWeight('bold');
      }

      const esProcesado = estado === 'PROCESADO';
      sheet.getRange(row, estadoCol)
        .setValue(estado)
        .setBackground(esProcesado ? '#e6f4ea' : '#fce8e6')
        .setFontColor(esProcesado ? '#1e6b35' : '#b71c1c')
        .setFontWeight('bold');
      sheet.getRange(row, estadoCol + 1).setValue(detalle);
      sheet.getRange(row, estadoCol + 2).setValue(new Date());
    } catch (writeErr) {
      AppLogger.warn('FormTrigger', 'No se pudo escribir estado en la hoja de respuestas');
    }
  }

  function _guardarError(
    e: GoogleAppsScript.Events.SheetsOnFormSubmit,
    placa: string,
    mensajeError: string
  ): void {
    try {
      const camion = placa ? CamionesRepository.findByPatente(placa) : null;
      const formError: Models.FormError = {
        errorId: IdGenerator.uuid(),
        timestamp: new Date(),
        emailChofer: placa, // guardamos la placa en este campo para referencia
        choferId: camion?.choferId ?? null,
        rawValues: JSON.stringify(e.values),
        mensajeError,
        estado: Models.EstadoFormError.PENDIENTE,
        resueltoEn: null,
        resueltoPor: null,
        registroId: null,
      };
      FormErroresRepository.append(formError);
    } catch (saveErr) {
      AppLogger.warn('FormTrigger', 'No se pudo guardar el error en FormErrores');
    }
  }

  function _notificarAdmin(dto: DTO.CreateRegistroDTO, registro: Models.Registro): void {
    const emailAdmin = Environment.getEmailNotificaciones();
    if (!emailAdmin) return;

    const chofer = ChoferesRepository.findById(dto.choferId);
    const nombreChofer = chofer ? chofer.nombre : dto.choferId;
    const fechaStr = DateUtils.toISODate(registro.fecha);

    MailApp.sendEmail({
      to: emailAdmin,
      subject: `[Tesalia] Nuevo registro: ${nombreChofer} — ${dto.tipoOperacion}/${dto.tipoZona} — ${fechaStr}`,
      body: [
        `Se recibió un nuevo registro de ruta vía formulario.`,
        ``,
        `Chofer:           ${nombreChofer}`,
        `Placa:            ${dto.placa}`,
        `Transporte:       ${dto.transporte}`,
        `Ruta:             ${dto.ruta}`,
        `Fecha:            ${fechaStr}`,
        `Tipo operación:   ${dto.tipoOperacion}`,
        `Tipo zona:        ${dto.tipoZona}`,
        dto.tipoOperacion === Models.TipoOperacion.RECARGUE ? `Cantidad:         ${dto.cantidadRecargues}` : '',
        `Kilometraje:      ${dto.kilometraje} km`,
        `Rechazos:         ${dto.tieneRechazos ? 'Sí' : 'No'}`,
        `Tarifa aplicada:  $${registro.tarifaAplicada.toFixed(2)}`,
        `Estado:           PENDIENTE (requiere validación)`,
        dto.observaciones ? `Observaciones:    ${dto.observaciones}` : '',
        ``,
        `Ingresa al sistema para validarlo.`,
      ].filter(Boolean).join('\n'),
    });
  }

  function _notificarAdmin_Error(err: unknown): void {
    const emailAdmin = Environment.getEmailNotificaciones();
    if (!emailAdmin) return;

    const msg = err instanceof Error ? err.message : String(err);
    MailApp.sendEmail({
      to: emailAdmin,
      subject: `[Tesalia] Error al procesar respuesta del formulario`,
      body: `Se recibió una respuesta del formulario pero no pudo ser procesada.\n\nError: ${msg}\n\nRevisa los logs en Apps Script > Executions para más detalles.\nEl dato crudo está en la hoja "Form Responses 1" del Spreadsheet.`,
    });
  }


  /**
   * Convierte el evento del form a un DTO.
   * Los índices de los campos dependen del orden de preguntas en el Form.
   *
   * Orden esperado del Form (con secciones condicionales):
   *   0: Timestamp (automático de Sheets)
   *   1: Transporte (número)
   *   2: Ruta (número)
   *   3: Placa (ej: RBH-1239)
   *   4: Tipo de operación (Entrega / Recargue)
   *   5: Cantidad de recargues (1-5, vacío si es Entrega — sección 2 condicional)
   *   6: Tipo de zona (Urbano / Foráneo / Extraforáneo — sección 3)
   *   7: Kilometraje (número)
   *   8: ¿Tuvo rechazos? (Sí / No)
   *   9: Observaciones (opcional)
   */
  function parseFormResponse(e: GoogleAppsScript.Events.SheetsOnFormSubmit): DTO.CreateRegistroDTO {
    const values = e.values;
    AppLogger.info('FormTrigger', `Raw values (${values.length}): ${JSON.stringify(values)}`);

    const transporte     = values[1]?.trim() ?? '';
    const ruta           = values[2]?.trim() ?? '';
    const placa          = values[3]?.trim().toUpperCase() ?? '';
    const operacionRaw   = values[4]?.trim().toUpperCase() ?? '';
    const cantidadRaw    = values[5]?.trim() ?? '';
    const zonaRaw        = values[6]?.trim().toUpperCase() ?? '';
    const kilometrajeRaw = values[7]?.trim() ?? '';
    const rechazosRaw    = values[8]?.trim().toUpperCase() ?? '';
    const observaciones  = values[9]?.trim() ?? '';

    if (!placa) throw new Error('La placa es requerida.');

    // Resolver camión y chofer por placa
    const camion = CamionesRepository.findByPatente(placa);
    if (!camion || !camion.activo) {
      throw new Error(`No se encontró un camión activo con placa "${placa}".`);
    }

    const tipoOperacion = normalizarTipoOperacion(operacionRaw);
    const tipoZona = normalizarTipoZona(zonaRaw);
    const cantidadRecargues = tipoOperacion === Models.TipoOperacion.RECARGUE
      ? (parseInt(cantidadRaw) || 1)
      : 1;
    const kilometraje = parseFloat(kilometrajeRaw) || 0;
    const tieneRechazos = rechazosRaw === 'SÍ' || rechazosRaw === 'SI' || rechazosRaw === 'S';
    const fecha = normalizarFecha(values[0]?.trim() ?? '');
    const responseId = `form_${e.namedValues['Timestamp']?.[0] ?? Date.now()}`;

    return {
      fecha,
      choferId: camion.choferId,
      camionId: camion.camionId,
      placa,
      transporte,
      ruta,
      tipoOperacion,
      tipoZona,
      cantidadRecargues,
      kilometraje,
      tieneRechazos,
      observaciones,
      origen: Models.OrigenRegistro.FORM,
      formResponseId: responseId,
    };
  }

  function normalizarTipoOperacion(raw: string): Models.TipoOperacion {
    const mapa: Record<string, Models.TipoOperacion> = {
      'ENTREGA': Models.TipoOperacion.ENTREGA,
      'RECARGUE': Models.TipoOperacion.RECARGUE,
    };
    const normalizado = mapa[raw];
    if (!normalizado) {
      throw new Error(`Tipo de operación "${raw}" no reconocido. Valores válidos: ENTREGA, RECARGUE`);
    }
    return normalizado;
  }

  function normalizarTipoZona(raw: string): Models.TipoZona {
    const mapa: Record<string, Models.TipoZona> = {
      'URBANO': Models.TipoZona.URBANO,
      'FORANEO': Models.TipoZona.FORANEO,
      'FORÁNEO': Models.TipoZona.FORANEO,
      'EXTRAFORANEO': Models.TipoZona.EXTRAFORANEO,
      'EXTRAFORÁNEO': Models.TipoZona.EXTRAFORANEO,
    };
    const normalizado = mapa[raw];
    if (!normalizado) {
      throw new Error(`Tipo de zona "${raw}" no reconocido. Valores válidos: URBANO, FORANEO, EXTRAFORANEO`);
    }
    return normalizado;
  }

  function normalizarFecha(raw: string): string {
    if (!raw) throw new Error('Fecha del recorrido es requerida.');

    // Intentar parsear DD/MM/YYYY (formato de Forms en Ecuador)
    const partes = raw.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes;
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Si ya viene en YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    throw new Error(`Formato de fecha no reconocido: "${raw}". Use DD/MM/YYYY.`);
  }
}
