/**
 * Servicio de camiones.
 */
namespace CamionService {
  export function getAll(session: Auth.UserSession): Models.Camion[] {
    RoleGuard.requirePermission(session, Auth.Permission.VER_CAMIONES);
    return CamionesRepository.findActive();
  }

  export function getById(camionId: string, session: Auth.UserSession): Models.Camion {
    RoleGuard.requirePermission(session, Auth.Permission.VER_CAMIONES);
    const camion = CamionesRepository.findById(camionId);
    if (!camion) throw new Error(`Camión ${camionId} no encontrado.`);
    return camion;
  }

  export function crear(dto: DTO.CreateCamionDTO, session: Auth.UserSession): Models.Camion {
    RoleGuard.requirePermission(session, Auth.Permission.CREAR_CAMION);

    const patenteNorm = dto.patente.trim().toUpperCase();

    if (CamionesRepository.findByPatente(patenteNorm)) {
      throw new Error(`Ya existe un camión con la patente "${patenteNorm}".`);
    }

    // Verificar que el chofer exista
    const chofer = ChoferesRepository.findById(dto.choferId);
    if (!chofer) throw new Error(`Chofer ${dto.choferId} no encontrado.`);

    const camion: Models.Camion = {
      camionId: IdGenerator.uuid(),
      patente: patenteNorm,
      modelo: dto.modelo.trim(),
      anio: dto.anio,
      choferId: dto.choferId,
      activo: true,
      notas: dto.notas ?? '',
    };

    CamionesRepository.create(camion);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.CREAR,
      entidad: Constants.SHEETS.CAMIONES,
      entidadId: camion.camionId,
      valorNuevo: camion,
    });

    return camion;
  }

  export function actualizar(
    camionId: string,
    dto: DTO.UpdateCamionDTO,
    session: Auth.UserSession
  ): Models.Camion {
    RoleGuard.requirePermission(session, Auth.Permission.EDITAR_CAMION);

    const anterior = CamionesRepository.findById(camionId);
    if (!anterior) throw new Error(`Camión ${camionId} no encontrado.`);

    const actualizado: Models.Camion = {
      ...anterior,
      patente: dto.patente ? dto.patente.trim().toUpperCase() : anterior.patente,
      modelo: dto.modelo ?? anterior.modelo,
      anio: dto.anio ?? anterior.anio,
      choferId: dto.choferId ?? anterior.choferId,
      notas: dto.notas ?? anterior.notas,
    };

    CamionesRepository.update(actualizado);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.EDITAR,
      entidad: Constants.SHEETS.CAMIONES,
      entidadId: camionId,
      valorAnterior: anterior,
      valorNuevo: actualizado,
    });

    return actualizado;
  }

  export function desactivar(camionId: string, session: Auth.UserSession): void {
    RoleGuard.requirePermission(session, Auth.Permission.ELIMINAR_CAMION);

    const camion = CamionesRepository.findById(camionId);
    if (!camion) throw new Error(`Camión ${camionId} no encontrado.`);

    CamionesRepository.deactivate(camionId);
    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.ELIMINAR,
      entidad: Constants.SHEETS.CAMIONES,
      entidadId: camionId,
      valorAnterior: camion,
    });
  }
}
