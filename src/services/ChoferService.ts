/**
 * Servicio de choferes.
 */
namespace ChoferService {
  export function getAll(session: Auth.UserSession): Models.Chofer[] {
    RoleGuard.requirePermission(session, Auth.Permission.VER_CHOFERES);
    if (session.rol === Models.Rol.CHOFER && session.choferId) {
      const propio = ChoferesRepository.findById(session.choferId);
      return propio ? [propio] : [];
    }
    return ChoferesRepository.findActive();
  }

  export function getById(choferId: string, session: Auth.UserSession): Models.Chofer {
    RoleGuard.requirePermission(session, Auth.Permission.VER_CHOFERES);
    const chofer = ChoferesRepository.findById(choferId);
    if (!chofer) throw new Error(`Chofer ${choferId} no encontrado.`);
    return chofer;
  }

  export function crear(dto: DTO.CreateChoferDTO, session: Auth.UserSession): Models.Chofer {
    RoleGuard.requirePermission(session, Auth.Permission.CREAR_CHOFER);

    if (ChoferesRepository.findByDni(dto.dni)) {
      throw new Error(`Ya existe un chofer con DNI "${dto.dni}".`);
    }

    const chofer: Models.Chofer = {
      choferId: IdGenerator.uuid(),
      nombre: dto.nombre.trim(),
      telefono: dto.telefono.trim(),
      dni: dto.dni.trim(),
      fechaIngreso: dto.fechaIngreso ? DateUtils.parseISODate(dto.fechaIngreso) : new Date(),
      activo: true,
      notas: dto.notas ?? '',
    };

    ChoferesRepository.create(chofer);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.CREAR,
      entidad: Constants.SHEETS.CHOFERES,
      entidadId: chofer.choferId,
      valorNuevo: chofer,
    });

    return chofer;
  }

  export function actualizar(
    choferId: string,
    dto: DTO.UpdateChoferDTO,
    session: Auth.UserSession
  ): Models.Chofer {
    RoleGuard.requirePermission(session, Auth.Permission.EDITAR_CHOFER);

    const anterior = ChoferesRepository.findById(choferId);
    if (!anterior) throw new Error(`Chofer ${choferId} no encontrado.`);

    const actualizado: Models.Chofer = {
      ...anterior,
      nombre: dto.nombre ?? anterior.nombre,
      telefono: dto.telefono ?? anterior.telefono,
      notas: dto.notas ?? anterior.notas,
    };

    ChoferesRepository.update(actualizado);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.EDITAR,
      entidad: Constants.SHEETS.CHOFERES,
      entidadId: choferId,
      valorAnterior: anterior,
      valorNuevo: actualizado,
    });

    return actualizado;
  }

  export function desactivar(choferId: string, session: Auth.UserSession): void {
    RoleGuard.requirePermission(session, Auth.Permission.ELIMINAR_CHOFER);

    const chofer = ChoferesRepository.findById(choferId);
    if (!chofer) throw new Error(`Chofer ${choferId} no encontrado.`);

    ChoferesRepository.deactivate(choferId);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.ELIMINAR,
      entidad: Constants.SHEETS.CHOFERES,
      entidadId: choferId,
      valorAnterior: chofer,
    });
  }
}
