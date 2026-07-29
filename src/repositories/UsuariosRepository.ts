/**
 * Repositorio de la hoja Usuarios.
 * Maneja la lectura y escritura de datos de usuarios del sistema.
 */
namespace UsuariosRepository {
  const SHEET = Constants.SHEETS.USUARIOS;
  const C = Constants.COLS.USUARIOS;

  function rowToUsuario(row: unknown[]): Models.Usuario {
    return {
      usuarioId: String(row[C.USUARIO_ID]),
      correo: String(row[C.CORREO]),
      rol: String(row[C.ROL]) as Models.Rol,
      choferId: row[C.CHOFER_ID] ? String(row[C.CHOFER_ID]) : null,
      activo: row[C.ACTIVO] === true || String(row[C.ACTIVO]).toUpperCase() === 'TRUE' || row[C.ACTIVO] === 1 || String(row[C.ACTIVO]).toUpperCase() === 'VERDADERO',
      fechaCreacion: DateUtils.fromSheetValue(row[C.FECHA_CREACION]),
      ultimoAcceso: row[C.ULTIMO_ACCESO] ? DateUtils.fromSheetValue(row[C.ULTIMO_ACCESO]) : null,
    };
  }

  function usuarioToRow(u: Models.Usuario): unknown[] {
    return [
      u.usuarioId,
      u.correo,
      u.rol,
      u.choferId ?? '',
      u.activo,
      DateUtils.toISODate(u.fechaCreacion),
      u.ultimoAcceso ? DateUtils.toISODate(u.ultimoAcceso) : '',
    ];
  }

  export function findAll(): Models.Usuario[] {
    return BaseRepository.getAllRows(SHEET).map(rowToUsuario);
  }

  export function findByEmail(email: string): Models.Usuario | null {
    const row = BaseRepository.findRow(SHEET, C.CORREO, email);
    return row ? rowToUsuario(row) : null;
  }

  export function findById(usuarioId: string): Models.Usuario | null {
    const row = BaseRepository.findRow(SHEET, C.USUARIO_ID, usuarioId);
    return row ? rowToUsuario(row) : null;
  }

  export function create(usuario: Models.Usuario): void {
    BaseRepository.appendRow(SHEET, usuarioToRow(usuario));
  }

  export function update(usuario: Models.Usuario): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.USUARIO_ID, usuario.usuarioId);
    if (idx === -1) throw new Error(`Usuario ${usuario.usuarioId} no encontrado.`);
    BaseRepository.updateRow(SHEET, idx, usuarioToRow(usuario));
  }

  export function updateUltimoAcceso(usuarioId: string, fecha: Date): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.USUARIO_ID, usuarioId);
    if (idx === -1) return;
    BaseRepository.updateCell(SHEET, idx, C.ULTIMO_ACCESO, DateUtils.toISODate(fecha));
  }

  export function deactivate(usuarioId: string): void {
    BaseRepository.softDelete(SHEET, BaseRepository.findRowIndex(SHEET, C.USUARIO_ID, usuarioId), C.ACTIVO);
  }

  export function findActive(): Models.Usuario[] {
    return findAll().filter(u => u.activo);
  }
}
