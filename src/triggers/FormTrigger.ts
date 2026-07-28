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
    try {
      AppLogger.info('FormTrigger', 'Nueva respuesta de formulario recibida');

      const dto = parseFormResponse(e);
      RegistroService.crearDesdeForm(dto);

      AppLogger.info('FormTrigger', `Registro creado desde form para chofer: ${dto.choferId}`);
    } catch (err) {
      AppLogger.error('FormTrigger', 'Error al procesar respuesta del form', err);
      // TODO Fase 5: Notificar al admin por email si falla el procesamiento
    }
  }

  /**
   * Convierte el evento del form a un DTO.
   * Los índices de los campos dependen del orden de preguntas en el Form.
   *
   * Orden esperado del Form:
   *   0: Timestamp (automático de Sheets)
   *   1: Email (captura automática)
   *   2: Fecha del recorrido
   *   3: Placa del camión
   *   4: Tipo de ruta
   *   5: Observaciones
   */
  function parseFormResponse(e: GoogleAppsScript.Events.SheetsOnFormSubmit): DTO.CreateRegistroDTO {
    const values = e.values;

    const emailChofer = values[1]?.trim() ?? '';
    const fechaRaw = values[2]?.trim() ?? '';
    const patente = values[3]?.trim().toUpperCase() ?? '';
    const tipoRutaRaw = values[4]?.trim().toUpperCase() ?? '';
    const observaciones = values[5]?.trim() ?? '';

    // Resolver chofer por email
    const usuario = UsuariosRepository.findByEmail(emailChofer);
    if (!usuario || !usuario.choferId) {
      throw new Error(
        `No se encontró un chofer asociado al email "${emailChofer}". ` +
        `Verifique que el usuario esté registrado con rol CHOFER.`
      );
    }

    // Resolver camión por patente
    const camion = CamionesRepository.findByPatente(patente);
    if (!camion || !camion.activo) {
      throw new Error(
        `No se encontró un camión activo con patente "${patente}".`
      );
    }

    // Normalizar tipo de ruta
    const tipoRuta = normalizarTipoRuta(tipoRutaRaw);

    // Normalizar fecha
    const fecha = normalizarFecha(fechaRaw);

    // ID único basado en el timestamp del evento para evitar duplicados
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
