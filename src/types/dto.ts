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
    placa: string;
    transporte: string;
    ruta: string;
    tipoOperacion: Models.TipoOperacion;
    tipoZona: Models.TipoZona;
    cantidadRecargues: number; // 1-5; siempre 1 para ENTREGA
    kilometraje: number;
    tieneRechazos: boolean;
    observaciones?: string;
    origen?: Models.OrigenRegistro;
    formResponseId?: string;
  }

  export interface UpdateRegistroDTO {
    fecha?: string;
    transporte?: string;
    ruta?: string;
    tipoOperacion?: Models.TipoOperacion;
    tipoZona?: Models.TipoZona;
    cantidadRecargues?: number;
    kilometraje?: number;
    tieneRechazos?: boolean;
    observaciones?: string;
  }

  export interface MarcarPagadoDTO {
    registroId: string;
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
    tipoOperacion: Models.TipoOperacion;
    tipoZona: Models.TipoZona;
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
    tipoOperacion?: Models.TipoOperacion;
    tipoZona?: Models.TipoZona;
    fechaDesde?: string; // ISO: YYYY-MM-DD
    fechaHasta?: string; // ISO: YYYY-MM-DD
    anio?: number;
    mes?: number;
    estado?: Models.EstadoRegistro;
  }

  export interface ResumenChoferDTO {
    chofer: Models.Chofer;
    totalRegistros: number;
    totalEntregas: number;
    totalRecargues: number;
    montoTotal: number;
    periodo: string;
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  export interface FormResponseDTO {
    fecha: string;
    placa: string;
    transporte: string;
    ruta: string;
    tipoOperacion: string;
    tipoZona: string;
    cantidadRecargues: number;
    kilometraje: number;
    tieneRechazos: boolean;
    observaciones?: string;
    responseId?: string;
  }

  // ─── Configuracion ────────────────────────────────────────────────────────

  export interface UpdateConfiguracionDTO {
    clave: string;
    valor: string;
  }
}
