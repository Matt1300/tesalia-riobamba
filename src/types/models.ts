/**
 * Modelos de dominio del sistema.
 * Representan las entidades tal como existen en Google Sheets.
 */
namespace Models {
  export enum Rol {
    ADMIN = 'ADMIN',
    CHOFER = 'CHOFER',
  }

  export enum TipoRuta {
    URBANA = 'URBANA',
    RURAL = 'RURAL',
  }

  export enum OrigenRegistro {
    FORM = 'FORM',
    MANUAL = 'MANUAL',
    IMPORTACION = 'IMPORTACION',
  }

  export enum EstadoRegistro {
    PENDIENTE = 'PENDIENTE',
    VALIDADO = 'VALIDADO',
    RECHAZADO = 'RECHAZADO',
  }

  export enum AccionAuditoria {
    CREAR = 'CREAR',
    EDITAR = 'EDITAR',
    ELIMINAR = 'ELIMINAR',
    LOGIN = 'LOGIN',
    EXPORTAR = 'EXPORTAR',
    VALIDAR = 'VALIDAR',
    RECHAZAR = 'RECHAZAR',
    CONFIGURAR = 'CONFIGURAR',
  }

  export enum ResultadoAuditoria {
    EXITO = 'EXITO',
    ERROR = 'ERROR',
  }

  export enum EstadoFormError {
    PENDIENTE = 'PENDIENTE',
    RESUELTO = 'RESUELTO',
    IGNORADO = 'IGNORADO',
  }

  export interface Usuario {
    usuarioId: string;
    correo: string;
    rol: Rol;
    choferId: string | null;
    activo: boolean;
    fechaCreacion: Date;
    ultimoAcceso: Date | null;
  }

  export interface Chofer {
    choferId: string;
    nombre: string;
    telefono: string;
    dni: string;
    fechaIngreso: Date;
    activo: boolean;
    notas: string;
  }

  export interface Camion {
    camionId: string;
    patente: string;
    modelo: string;
    anio: number;
    choferId: string;
    activo: boolean;
    notas: string;
  }

  export interface Tarifa {
    tarifaId: string;
    tipoRuta: TipoRuta;
    valor: number;
    descripcion: string;
    fechaVigencia: Date;
    fechaVencimiento: Date | null;
    activo: boolean;
    creadoPor: string;
    fechaCreacion: Date;
  }

  export interface Registro {
    registroId: string;
    fecha: Date;
    choferId: string;
    camionId: string;
    tipoRuta: TipoRuta;
    tarifaAplicada: number;
    observaciones: string;
    origen: OrigenRegistro;
    formResponseId: string | null;
    estado: EstadoRegistro;
    validadoPor: string | null;
    fechaValidacion: Date | null;
    creadoEn: Date;
    modificadoEn: Date;
  }

  export interface ResumenMensual {
    resumenId: string;
    anio: number;
    mes: number;
    choferId: string;
    camionId: string;
    totalRegistros: number;
    totalUrbanas: number;
    totalRurales: number;
    totalEspeciales: number;
    montoTotal: number;
    fechaCalculo: Date;
    recalculado: boolean;
  }

  export interface Configuracion {
    clave: string;
    valor: string;
    descripcion: string;
    modificadoPor: string;
    fechaModificacion: Date;
  }

  export interface FormError {
    errorId: string;
    timestamp: Date;
    emailChofer: string;
    choferId: string | null;
    rawValues: string;
    mensajeError: string;
    estado: EstadoFormError;
    resueltoEn: Date | null;
    resueltoPor: string | null;
    registroId: string | null;
  }

  export interface Auditoria {
    auditoriaId: string;
    timestamp: Date;
    usuarioEmail: string;
    accion: AccionAuditoria;
    entidad: string;
    entidadId: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
    ipOrigen: string;
    resultado: ResultadoAuditoria;
    detalle: string;
  }
}
