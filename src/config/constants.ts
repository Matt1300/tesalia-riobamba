/**
 * Constantes globales del sistema.
 * Centraliza nombres de hojas, índices de columnas y cabeceras.
 * NUNCA hardcodear estos valores en otros archivos.
 */
namespace Constants {
  // ─── Nombres de Hojas ─────────────────────────────────────────────────────

  export const SHEETS = {
    USUARIOS: 'Usuarios',
    CHOFERES: 'Choferes',
    CAMIONES: 'Camiones',
    TARIFAS: 'Tarifas',
    REGISTROS: 'Registros',
    RESUMEN_MENSUAL: 'ResumenMensual',
    CONFIGURACION: 'Configuracion',
    AUDITORIA: 'Auditoria',
    FORM_ERRORES: 'FormErrores',
  } as const;

  // ─── Índices de Columnas (0-based) ────────────────────────────────────────
  // Cuando se lee con getValues(), la primera columna es índice 0.

  export const COLS = {
    USUARIOS: {
      USUARIO_ID: 0,
      CORREO: 1,
      ROL: 2,
      CHOFER_ID: 3,
      ACTIVO: 4,
      FECHA_CREACION: 5,
      ULTIMO_ACCESO: 6,
    },
    CHOFERES: {
      CHOFER_ID: 0,
      NOMBRE: 1,
      TELEFONO: 2,
      DNI: 3,
      FECHA_INGRESO: 4,
      ACTIVO: 5,
      NOTAS: 6,
    },
    CAMIONES: {
      CAMION_ID: 0,
      PATENTE: 1,
      MODELO: 2,
      ANIO: 3,
      CHOFER_ID: 4,
      ACTIVO: 5,
      NOTAS: 6,
    },
    TARIFAS: {
      TARIFA_ID: 0,
      TIPO_OPERACION: 1,
      TIPO_ZONA: 2,
      VALOR: 3,
      DESCRIPCION: 4,
      FECHA_VIGENCIA: 5,
      FECHA_VENCIMIENTO: 6,
      ACTIVO: 7,
      CREADO_POR: 8,
      FECHA_CREACION: 9,
    },
    REGISTROS: {
      REGISTRO_ID: 0,
      FECHA: 1,
      CHOFER_ID: 2,
      CAMION_ID: 3,
      PLACA: 4,
      TRANSPORTE: 5,
      RUTA: 6,
      TIPO_OPERACION: 7,
      TIPO_ZONA: 8,
      CANTIDAD_RECARGUES: 9,
      KILOMETRAJE: 10,
      TIENE_RECHAZOS: 11,
      TARIFA_APLICADA: 12,
      OBSERVACIONES: 13,
      ORIGEN: 14,
      FORM_RESPONSE_ID: 15,
      ESTADO: 16,
      VALIDADO_POR: 17,
      FECHA_VALIDACION: 18,
      CREADO_EN: 19,
      MODIFICADO_EN: 20,
    },
    RESUMEN_MENSUAL: {
      RESUMEN_ID: 0,
      ANIO: 1,
      MES: 2,
      CHOFER_ID: 3,
      CAMION_ID: 4,
      TOTAL_REGISTROS: 5,
      TOTAL_ENTREGAS: 6,
      TOTAL_RECARGUES: 7,
      MONTO_TOTAL: 8,
      FECHA_CALCULO: 9,
      RECALCULADO: 10,
    },
    CONFIGURACION: {
      CLAVE: 0,
      VALOR: 1,
      DESCRIPCION: 2,
      MODIFICADO_POR: 3,
      FECHA_MODIFICACION: 4,
    },
    AUDITORIA: {
      AUDITORIA_ID: 0,
      TIMESTAMP: 1,
      USUARIO_EMAIL: 2,
      ACCION: 3,
      ENTIDAD: 4,
      ENTIDAD_ID: 5,
      VALOR_ANTERIOR: 6,
      VALOR_NUEVO: 7,
      IP_ORIGEN: 8,
      RESULTADO: 9,
      DETALLE: 10,
    },
    FORM_ERRORES: {
      ERROR_ID: 0,
      TIMESTAMP: 1,
      EMAIL_CHOFER: 2,
      CHOFER_ID: 3,
      RAW_VALUES: 4,
      MENSAJE_ERROR: 5,
      ESTADO: 6,
      RESUELTO_EN: 7,
      RESUELTO_POR: 8,
      REGISTRO_ID: 9,
    },
  } as const;

  // ─── Cabeceras de Hojas ───────────────────────────────────────────────────
  // Deben coincidir exactamente con el orden de COLS.

  export const HEADERS = {
    USUARIOS: [
      'UsuarioId', 'Correo', 'Rol', 'ChoferId',
      'Activo', 'FechaCreacion', 'UltimoAcceso',
    ],
    CHOFERES: [
      'ChoferId', 'Nombre', 'Telefono', 'DNI',
      'FechaIngreso', 'Activo', 'Notas',
    ],
    CAMIONES: [
      'CamionId', 'Patente', 'Modelo', 'Anio',
      'ChoferId', 'Activo', 'Notas',
    ],
    TARIFAS: [
      'TarifaId', 'TipoOperacion', 'TipoZona', 'Valor', 'Descripcion',
      'FechaVigencia', 'FechaVencimiento', 'Activo', 'CreadoPor', 'FechaCreacion',
    ],
    REGISTROS: [
      'RegistroId', 'Fecha', 'ChoferId', 'CamionId', 'Placa',
      'Transporte', 'Ruta', 'TipoOperacion', 'TipoZona', 'CantidadRecargues',
      'Kilometraje', 'TieneRechazos', 'TarifaAplicada', 'Observaciones',
      'Origen', 'FormResponseId', 'Estado', 'ValidadoPor', 'FechaValidacion',
      'CreadoEn', 'ModificadoEn',
    ],
    RESUMEN_MENSUAL: [
      'ResumenId', 'Anio', 'Mes', 'ChoferId', 'CamionId',
      'TotalRegistros', 'TotalEntregas', 'TotalRecargues',
      'MontoTotal', 'FechaCalculo', 'Recalculado',
    ],
    CONFIGURACION: [
      'Clave', 'Valor', 'Descripcion', 'ModificadoPor', 'FechaModificacion',
    ],
    AUDITORIA: [
      'AuditoriaId', 'Timestamp', 'UsuarioEmail', 'Accion', 'Entidad',
      'EntidadId', 'ValorAnterior', 'ValorNuevo', 'IpOrigen', 'Resultado', 'Detalle',
    ],
    FORM_ERRORES: [
      'ErrorId', 'Timestamp', 'EmailChofer', 'ChoferId', 'RawValues',
      'MensajeError', 'Estado', 'ResueltoEn', 'ResueltoPor', 'RegistroId',
    ],
  } as const;

  // ─── Claves de Configuracion ──────────────────────────────────────────────

  export const CONFIG_KEYS = {
    APP_NOMBRE: 'APP_NOMBRE',
    MONEDA: 'MONEDA',
    FORM_ID: 'FORM_ID',
    SPREADSHEET_ID: 'SPREADSHEET_ID',
    TIMEZONE: 'TIMEZONE',
    EMAIL_NOTIFICACIONES: 'EMAIL_NOTIFICACIONES',
    MONTO_RECHAZO: 'MONTO_RECHAZO',
  } as const;

  /** Valores por defecto cargados si la hoja Configuracion está vacía. */
  export const DEFAULT_CONFIG: Record<string, string> = {
    APP_NOMBRE: 'Tesalia Riobamba - Control de Rutas',
    MONEDA: 'USD',
    TIMEZONE: 'America/Guayaquil',
    MONTO_RECHAZO: '5',
  };
}
