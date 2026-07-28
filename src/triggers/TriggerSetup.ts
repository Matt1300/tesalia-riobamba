/**
 * Instalador de triggers programáticos.
 * Los triggers de GAS no se instalan automáticamente al hacer push;
 * se deben instalar una vez desde el editor o llamando a esta función.
 *
 * Ejecutar UNA VEZ desde el editor: TriggerSetup.install()
 */
namespace TriggerSetup {
  /**
   * Instala el trigger onFormSubmit en el Spreadsheet activo.
   * Si ya existe, no lo duplica.
   */
  export function install(): void {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const existingTriggers = ScriptApp.getProjectTriggers();

    const yaInstalado = existingTriggers.some(
      t =>
        t.getHandlerFunction() === 'onFormSubmit' &&
        t.getTriggerSource() === ScriptApp.TriggerSource.SPREADSHEETS
    );

    if (yaInstalado) {
      AppLogger.info('TriggerSetup', 'Trigger onFormSubmit ya estaba instalado.');
      return;
    }

    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();

    AppLogger.info('TriggerSetup', 'Trigger onFormSubmit instalado correctamente.');
  }

  /** Lista todos los triggers instalados (útil para debugging). */
  export function list(): void {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      Logger.log(`Trigger: ${t.getHandlerFunction()} | Fuente: ${t.getTriggerSource()}`);
    });
  }

  /** Elimina todos los triggers (usar con cuidado). */
  export function uninstallAll(): void {
    ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
    AppLogger.warn('TriggerSetup', 'Todos los triggers eliminados.');
  }
}
