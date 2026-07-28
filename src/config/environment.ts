/**
 * Lector de configuración en tiempo de ejecución.
 * Lee valores desde la hoja Configuracion del Spreadsheet.
 * Usa caché para evitar lecturas repetidas en la misma ejecución.
 */
namespace Environment {
  let _cache: Record<string, string> | null = null;

  /** Obtiene todos los pares clave→valor de la hoja Configuracion. */
  function loadAll(): Record<string, string> {
    if (_cache !== null) return _cache;

    const config: Record<string, string> = { ...Constants.DEFAULT_CONFIG };

    try {
      const rows = BaseRepository.getAllRows(Constants.SHEETS.CONFIGURACION);
      const C = Constants.COLS.CONFIGURACION;
      for (const row of rows) {
        const clave = String(row[C.CLAVE]).trim();
        const valor = String(row[C.VALOR]).trim();
        if (clave) config[clave] = valor;
      }
    } catch (e) {
      AppLogger.warn('Environment', 'No se pudo cargar Configuracion. Usando valores por defecto.');
    }

    _cache = config;
    return _cache;
  }

  /** Obtiene el valor de una clave de configuración. */
  export function get(key: string): string {
    return loadAll()[key] ?? '';
  }

  /** Limpia el caché (útil después de actualizar configuración). */
  export function clearCache(): void {
    _cache = null;
  }

  export function getAppNombre(): string {
    return get(Constants.CONFIG_KEYS.APP_NOMBRE);
  }

  export function getMoneda(): string {
    return get(Constants.CONFIG_KEYS.MONEDA);
  }

  export function getFormId(): string {
    return get(Constants.CONFIG_KEYS.FORM_ID);
  }
}
