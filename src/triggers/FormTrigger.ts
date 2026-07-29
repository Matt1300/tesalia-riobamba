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
    // Capturar el email antes del try para poder notificar al chofer si falla
    const emailChofer = e.values[1]?.trim() ?? '';

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
      _guardarError(e, emailChofer, msg);
      _notificarAdmin_Error(err);
      _notificarChofer_Error(emailChofer, err);
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
    emailChofer: string,
    mensajeError: string
  ): void {
    try {
      const usuario = emailChofer ? UsuariosRepository.findByEmail(emailChofer) : null;
      const formError: Models.FormError = {
        errorId: IdGenerator.uuid(),
        timestamp: new Date(),
        emailChofer,
        choferId: usuario?.choferId ?? null,
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
      subject: `[Tesalia] Nuevo registro: ${nombreChofer} — ${dto.tipoRuta} — ${fechaStr}`,
      body: [
        `Se recibió un nuevo registro de ruta vía formulario.`,
        ``,
        `Chofer:         ${nombreChofer}`,
        `Fecha:          ${fechaStr}`,
        `Tipo de ruta:   ${dto.tipoRuta}`,
        `Tarifa aplicada: $${registro.tarifaAplicada.toFixed(2)}`,
        `Estado:         PENDIENTE (requiere validación)`,
        dto.observaciones ? `Observaciones:  ${dto.observaciones}` : '',
        ``,
        `Ingresa al sistema para validarlo.`,
      ].filter(line => line !== undefined && line !== null).join('\n'),
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
   * Notifica al chofer que su envío falló, con el motivo y datos de ayuda.
   * El chofer puede así corregir y re-enviar el formulario.
   */
  function _notificarChofer_Error(emailChofer: string, err: unknown): void {
    if (!emailChofer) return;

    const msg = err instanceof Error ? err.message : String(err);

    // Intentar obtener las placas asignadas al chofer para ayudarlo a re-enviar
    let ayudaPlacas = '';
    try {
      const usuario = UsuariosRepository.findByEmail(emailChofer);
      if (usuario?.choferId) {
        const camiones = CamionesRepository.findByChoferId(usuario.choferId)
          .filter(c => c.activo);
        if (camiones.length > 0) {
          ayudaPlacas = '\n\nTus camiones asignados:\n' +
            camiones.map(c => `  - ${c.patente}${c.modelo ? ' (' + c.modelo + ')' : ''}`).join('\n');
        }
      }
    } catch (_) {
      // Si no se puede obtener los camiones, no bloquear la notificación
    }

    MailApp.sendEmail({
      to: emailChofer,
      subject: `[Tesalia] Tu registro de ruta no pudo ser procesado`,
      body: [
        `Hola,`,
        ``,
        `Tu respuesta del formulario fue recibida, pero no pudo ser procesada por el siguiente motivo:`,
        ``,
        `  ${msg}`,
        ayudaPlacas,
        ``,
        `Por favor vuelve a llenar el formulario con los datos correctos.`,
        `Si crees que es un error del sistema, comunícate con el administrador.`,
        ``,
        `Sistema Tesalia Riobamba`,
      ].filter(l => l !== undefined && l !== null).join('\n'),
    });
  }

  /**
   * Convierte el evento del form a un DTO.
   * Los índices de los campos dependen del orden de preguntas en el Form.
   *
   * Orden esperado del Form:
   *   0: Timestamp (automático de Sheets)
   *   1: Email (captura automática)
   *   2: Fecha del recorrido
   *   3: Placa del camión (opcional si el chofer tiene un único camión activo)
   *   4: Tipo de ruta
   *   5: Observaciones
   */
  function parseFormResponse(e: GoogleAppsScript.Events.SheetsOnFormSubmit): DTO.CreateRegistroDTO {
    const values = e.values;

    const emailChofer   = values[1]?.trim() ?? '';
    const fechaRaw      = values[2]?.trim() ?? '';
    const patente       = values[3]?.trim().toUpperCase() ?? '';
    const tipoRutaRaw   = values[4]?.trim().toUpperCase() ?? '';
    const observaciones = values[5]?.trim() ?? '';

    // Resolver chofer por email del respondente
    const usuario = UsuariosRepository.findByEmail(emailChofer);
    if (!usuario || !usuario.choferId) {
      throw new Error(
        `No se encontró un chofer asociado al email "${emailChofer}". ` +
        `Verifique que el usuario esté registrado con rol CHOFER.`
      );
    }

    const camion = _resolverCamion(patente, usuario.choferId);
    const tipoRuta = normalizarTipoRuta(tipoRutaRaw);
    const fecha = normalizarFecha(fechaRaw);
    const responseId = `form_${e.namedValues['Timestamp']?.[0] ?? Date.now()}`;

    return {
      fecha,
      choferId: usuario.choferId,
      camionId: camion.camionId,
      tipoRuta,
      observaciones,
      origen: Models.OrigenRegistro.FORM,
      formResponseId: responseId,
    };
  }

  /**
   * Resuelve el camión a partir de la placa ingresada o auto-detecta si el
   * chofer tiene exactamente un camión activo y no ingresó placa.
   *
   * Siempre valida que el camión resuelto pertenezca al chofer que envió
   * el formulario, evitando registros con datos de otro chofer.
   */
  function _resolverCamion(patente: string, choferId: string): Models.Camion {
    if (patente) {
      const camion = CamionesRepository.findByPatente(patente);
      if (!camion || !camion.activo) {
        throw new Error(`No se encontró un camión activo con placa "${patente}".`);
      }
      if (camion.choferId !== choferId) {
        throw new Error(
          `La placa "${patente}" no está asignada a tu perfil. ` +
          `Verifica la placa o contacta al administrador.`
        );
      }
      return camion;
    }

    // Sin placa: auto-resolver por los camiones activos del chofer
    const misCamiones = CamionesRepository.findByChoferId(choferId).filter(c => c.activo);
    if (misCamiones.length === 0) {
      throw new Error(
        'No tienes camiones activos asignados. Contacta al administrador.'
      );
    }
    if (misCamiones.length > 1) {
      const placas = misCamiones.map(c => c.patente).join(', ');
      throw new Error(
        `Tienes ${misCamiones.length} camiones asignados (${placas}). ` +
        `Debes especificar la placa en el formulario.`
      );
    }
    // Exactamente un camión activo → se usa automáticamente
    return misCamiones[0];
  }

  function normalizarTipoRuta(raw: string): Models.TipoRuta {
    const mapa: Record<string, Models.TipoRuta> = {
      'URBANA': Models.TipoRuta.URBANA,
      'RURAL': Models.TipoRuta.RURAL,
    };

    const normalizado = mapa[raw];
    if (!normalizado) {
      throw new Error(
        `Tipo de ruta "${raw}" no reconocido. Valores válidos: ${Object.keys(mapa).join(', ')}`
      );
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
