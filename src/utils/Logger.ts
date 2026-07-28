/**
 * Logger estructurado para Google Apps Script.
 * Centraliza todos los logs del sistema con nivel, módulo y mensaje.
 * En GAS, usa Logger.log() que escribe en Stackdriver Logging.
 */
namespace AppLogger {
  type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

  function log(level: Level, module: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${module}]`;
    let dataStr = '';
    if (data !== undefined) {
      if (data instanceof Error) {
        dataStr = ` | ${data.message}${data.stack ? '\n' + data.stack : ''}`;
      } else {
        dataStr = ` | ${JSON.stringify(data)}`;
      }
    }
    const entry = `${prefix} ${message}${dataStr}`;

    Logger.log(entry);

    if (level === 'ERROR') {
      console.error(entry);
    }
  }

  export function info(module: string, message: string, data?: unknown): void {
    log('INFO', module, message, data);
  }

  export function warn(module: string, message: string, data?: unknown): void {
    log('WARN', module, message, data);
  }

  export function error(module: string, message: string, data?: unknown): void {
    log('ERROR', module, message, data);
  }

  export function debug(module: string, message: string, data?: unknown): void {
    log('DEBUG', module, message, data);
  }
}
