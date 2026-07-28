/**
 * Data Transfer Objects.
 * Definen la forma de los datos que entran y salen de cada capa.
 * Separan la representación interna (Models) de la entrada/salida.
 */
namespace DTO {
  // ─── Registros ────────────────────────────────────────────────────────────

  export interface CreateRegistroDTO {
    fecha: string; // ISO: YYYY-MM-DD
    choferId: string;
    camionId: string;
    tipoRuta: Models.TipoRuta;
    observaciones?: string;
    origen?: Models.OrigenRegistro;
    formResponseId?: string;
  }

  export interface UpdateRegistroDTO {
    fecha?: string;
    tipoRuta?: Models.TipoRuta;
    observaciones?: string;
  }

  export interface ValidarRegistroDTO {
    registroId: string;
    estado: Models.EstadoRegistro.VALIDADO | Models.EstadoRegistro.RECHAZADO;
    motivo?: string;
  }

  // ─── Choferes ─────────────────────────────────────────────────────────────

  export interface CreateChoferDTO {
    nombre: string;
    telefono: string;
    dni: string;
    fechaIngreso?: string; // ISO: YYYY-MM-DD
    notas?: string;
  }

  export interface UpdateChoferDTO {
    nombre?: string;
    telefono?: string;
    notas?: string;
  }

  // ─── Camiones ─────────────────────────────────────────────────────────────

  export interface CreateCamionDTO {
    patente: string;
    modelo: string;
    anio: number;
    choferId: string;
    notas?: string;
  }

  export interface UpdateCamionDTO {
    patente?: string;
    modelo?: string;
    anio?: number;
    choferId?: string;
    notas?: string;
  }

  // ─── Tarifas ──────────────────────────────────────────────────────────────

  export interface CreateTarifaDTO {
    tipoRuta: Models.TipoRuta;
    valor: number;
    descripcion: string;
    fechaVigencia?: string; // ISO: YYYY-MM-DD
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────

  export interface CreateUsuarioDTO {
    correo: string;
    rol: Models.Rol;
    choferId?: string;
  }

  export interface UpdateUsuarioDTO {
    rol?: Models.Rol;
    choferId?: string;
    activo?: boolean;
  }

  // ─── Reportes / Filtros ───────────────────────────────────────────────────

  export interface FiltroReporteDTO {
    choferId?: string;
    camionId?: string;
    tipoRuta?: Models.TipoRuta;
    fechaDesde?: string; // ISO: YYYY-MM-DD
    fechaHasta?: string; // ISO: YYYY-MM-DD
    anio?: number;
    mes?: number;
    estado?: Models.EstadoRegistro;
  }

  export interface ResumenChoferDTO {
    chofer: Models.Chofer;
    totalRegistros: number;
    totalUrbanas: number;
    totalRurales: number;
    montoTotal: number;
    periodo: string;
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  export interface FormResponseDTO {
    fecha: string;
    emailChofer: string;
    patenteCamion: string;
    tipoRuta: string;
    observaciones?: string;
    responseId?: string;
  }

  // ─── Configuracion ────────────────────────────────────────────────────────

  export interface UpdateConfiguracionDTO {
    clave: string;
    valor: string;
  }
}
