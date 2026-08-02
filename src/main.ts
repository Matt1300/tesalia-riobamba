/**
 * Punto de entrada global de Google Apps Script.
 * GAS solo puede llamar a funciones globales (fuera de namespaces).
 * Este archivo expone las funciones que GAS necesita conocer.
 *
 * NO agregar lógica de negocio aquí. Solo delegar a los namespaces correspondientes.
 */

// ─── Funciones de la Web App ──────────────────────────────────────────────────

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return AppController.handleGet(e);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return AppController.handlePost(e);
}

// ─── Función API para google.script.run ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function apiCall(action: string, payload: unknown): string {
  return AppController.handleApiCall(action, payload);
}

// ─── Helper para inclusión de archivos HTML ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function include(filename: string): string {
  return AppController.include(filename);
}

// ─── Trigger del Google Form ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  FormTrigger.handle(e);
}

// ─── Funciones de Administración (ejecutar desde el editor) ──────────────────

/** Inicializa todas las hojas. Ejecutar UNA SOLA VEZ al desplegar. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function initializeSheets(): void {
  Setup.initialize();
}

/** Crea el Google Form y lo vincula al Spreadsheet. Ejecutar UNA SOLA VEZ. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setupForm(): void {
  Setup.crearFormulario();
}

/** Instala el trigger del formulario. Ejecutar UNA SOLA VEZ. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function installTriggers(): void {
  TriggerSetup.install();
}

/** Lista los triggers instalados. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function listTriggers(): void {
  TriggerSetup.list();
}

/**
 * Migra hojas existentes agregando columnas faltantes al final.
 * Seguro ejecutar en producción: nunca borra datos ni columnas.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function migrateSheets(): void {
  Setup.migrateSheets();
}
