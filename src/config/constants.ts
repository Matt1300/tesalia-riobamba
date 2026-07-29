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
      TIPO_RUTA: 1,
      VALOR: 2,
      DESCRIPCION: 3,
      FECHA_VIGENCIA: 4,
      FECHA_VENCIMIENTO: 5,
      ACTIVO: 6,
      CREADO_POR: 7,
      FECHA_CREACION: 8,
    },
    REGISTROS: {
      REGISTRO_ID: 0,
      FECHA: 1,
      CHOFER_ID: 2,
      CAMION_ID: 3,
      TIPO_RUTA: 4,
      TARIFA_APLICADA: 5,
      OBSERVACIONES: 6,
      ORIGEN: 7,
      FORM_RESPONSE_ID: 8,
      ESTADO: 9,
      VALIDADO_POR: 10,
      FECHA_VALIDACION: 11,
      CREADO_EN: 12,
      MODIFICADO_EN: 13,
    },
    RESUMEN_MENSUAL: {
      RESUMEN_ID: 0,
      ANIO: 1,
      MES: 2,
      CHOFER_ID: 3,
      CAMION_ID: 4,
      TOTAL_REGISTROS: 5,
      TOTAL_URBANAS: 6,
      TOTAL_RURALES: 7,
      TOTAL_ESPECIALES: 8,
      MONTO_TOTAL: 9,
      FECHA_CALCULO: 10,
      RECALCULADO: 11,
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
      'TarifaId', 'TipoRuta', 'Valor', 'Descripcion',
      'FechaVigencia', 'FechaVencimiento', 'Activo', 'CreadoPor', 'FechaCreacion',
    ],
    REGISTROS: [
      'RegistroId', 'Fecha', 'ChoferId', 'CamionId', 'TipoRuta',
      'TarifaAplicada', 'Observaciones', 'Origen', 'FormResponseId',
      'Estado', 'ValidadoPor', 'FechaValidacion', 'CreadoEn', 'ModificadoEn',
    ],
    RESUMEN_MENSUAL: [
      'ResumenId', 'Anio', 'Mes', 'ChoferId', 'CamionId',
      'TotalRegistros', 'TotalUrbanas', 'TotalRurales', 'TotalEspeciales',
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
  } as const;

  /** Valores por defecto cargados si la hoja Configuracion está vacía. */
  export const DEFAULT_CONFIG: Record<string, string> = {
    APP_NOMBRE: 'Tesalia Riobamba - Control de Rutas',
    MONEDA: 'USD',
    TIMEZONE: 'America/Guayaquil',
  };
}
