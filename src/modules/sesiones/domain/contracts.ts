export type FrecuenciaRecurrencia = 'DIARIA' | 'SEMANAL' | 'QUINCENAL';
export type AlcanceModificacion = 'solo_esta' | 'esta_y_siguientes';
export type EstadoAsistencia = 'PENDIENTE' | 'CONFIRMADA' | 'DECLINADA';

export interface AsistenteDTO {
  id: string;
  sesionId: string;
  usuarioId: string;
  estado: EstadoAsistencia;
  nombre?: string;
  apellido?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SesionDTO {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fecha: Date;
  recordatorioMinutos: number;
  cancelada: boolean;
  modificada: boolean;
  recordatorioEnviado: boolean;
  serieId: string;
  creadorId: string;
  grupoId?: string | null;
  asistentes?: AsistenteDTO[];
  createdAt: Date;
}

export interface SerieDTO {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  frecuencia: FrecuenciaRecurrencia;
  fechaInicio: Date;
  fechaFin: Date;
  recordatorioMinutos: number;
  creadorId: string;
  grupoId?: string | null;
  sesiones: SesionDTO[];
  createdAt: Date;
}

export interface CrearSerieData {
  titulo: string;
  descripcion: string;
  lugar: string;
  frecuencia: FrecuenciaRecurrencia;
  fechaInicio: Date;
  fechaFin: Date;
  recordatorioMinutos: number;
  creadorId: string;
  grupoId?: string;
}

export interface ModificarSesionData {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
  fecha?: Date;
  recordatorioMinutos?: number;
}

export interface CalendarioSesionDTO {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fecha: Date;
  recordatorioMinutos: number;
  cancelada: boolean;
  recurrencia: FrecuenciaRecurrencia | null;
  serieId: string;
  grupoId?: string | null;
  grupoNombre?: string;
  creadorId: string;
  asistentes: AsistenteDTO[];
  miAsistencia: EstadoAsistencia | null;
}

export interface ISesionEstudioRepository {
  crearSerie(data: CrearSerieData): Promise<SerieDTO>;
  obtenerSesionesDeUsuario(creadorId: string): Promise<SesionDTO[]>;
  obtenerSesionPorId(sesionId: string): Promise<SesionDTO | null>;
  modificarSesion(sesionId: string, alcance: AlcanceModificacion, data: ModificarSesionData): Promise<SesionDTO[]>;
  cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void>;
  cancelarSesionesPorIds(sesionIds: string[], creadorId: string): Promise<number>;
  marcarRecordatorioEnviado(sesionId: string): Promise<void>;
  obtenerSesionesPendientesRecordatorio(ahora: Date): Promise<SesionDTO[]>;

  // Asistentes
  crearAsistentesBatch(sesionId: string, usuarioIds: string[]): Promise<AsistenteDTO[]>;
  obtenerAsistentes(sesionId: string): Promise<AsistenteDTO[]>;
  actualizarEstadoAsistencia(sesionId: string, usuarioId: string, estado: EstadoAsistencia): Promise<AsistenteDTO>;

  // Calendario
  obtenerSesionesDeGrupo(grupoId: string): Promise<SesionDTO[]>;
  obtenerSesionesDeUsuarioComoAsistenteOcreador(usuarioId: string): Promise<SesionDTO[]>;
  obtenerMiembrosGrupo(grupoId: string): Promise<{ id: string; nombre: string; apellido: string }[]>;
  obtenerFrecuenciaSerie(serieId: string): Promise<FrecuenciaRecurrencia | null>;
  obtenerGrupoNombre(grupoId: string): Promise<string | null>;
}
