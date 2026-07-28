/**
 * Controlador de usuarios del sistema.
 */
namespace UsuarioController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;

      switch (method) {
        case 'getAll': {
          RoleGuard.requirePermission(session, Auth.Permission.ADMINISTRAR_USUARIOS);
          return API.ok(UsuariosRepository.findActive());
        }

        case 'getSelf':
          return API.ok(session);

        case 'crear': {
          RoleGuard.requirePermission(session, Auth.Permission.ADMINISTRAR_USUARIOS);
          const dto = p as unknown as DTO.CreateUsuarioDTO;

          if (UsuariosRepository.findByEmail(dto.correo)) {
            return API.fail(`El correo ${dto.correo} ya está registrado.`);
          }

          const usuario: Models.Usuario = {
            usuarioId: IdGenerator.uuid(),
            correo: dto.correo.toLowerCase().trim(),
            rol: dto.rol,
            choferId: dto.choferId ?? null,
            activo: true,
            fechaCreacion: new Date(),
            ultimoAcceso: null,
          };

          UsuariosRepository.create(usuario);
          AuditoriaService.log({
            session,
            accion: Models.AccionAuditoria.CREAR,
            entidad: Constants.SHEETS.USUARIOS,
            entidadId: usuario.usuarioId,
            valorNuevo: { correo: usuario.correo, rol: usuario.rol },
          });

          return API.ok(usuario);
        }

        case 'actualizar': {
          RoleGuard.requirePermission(session, Auth.Permission.ADMINISTRAR_USUARIOS);
          const dto = p as unknown as DTO.UpdateUsuarioDTO & { id: string };
          const anterior = UsuariosRepository.findById(dto.id);
          if (!anterior) return API.fail(`Usuario ${dto.id} no encontrado.`);

          const actualizado: Models.Usuario = {
            ...anterior,
            rol: dto.rol ?? anterior.rol,
            choferId: dto.choferId !== undefined ? dto.choferId ?? null : anterior.choferId,
            activo: dto.activo !== undefined ? dto.activo : anterior.activo,
          };

          UsuariosRepository.update(actualizado);
          AuditoriaService.log({
            session,
            accion: Models.AccionAuditoria.EDITAR,
            entidad: Constants.SHEETS.USUARIOS,
            entidadId: dto.id,
            valorAnterior: anterior,
            valorNuevo: actualizado,
          });

          return API.ok(actualizado);
        }

        case 'desactivar': {
          RoleGuard.requirePermission(session, Auth.Permission.ADMINISTRAR_USUARIOS);
          UsuariosRepository.deactivate(p['id'] as string);
          return API.ok({ desactivado: true });
        }

        default:
          return API.fail(`Método de usuarios desconocido: ${method}`);
      }
    });
  }
}
