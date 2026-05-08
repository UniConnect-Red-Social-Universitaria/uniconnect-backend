export type FrecuenciaRecurrencia = 'DIARIA' | 'SEMANAL' | 'QUINCENAL';
export type AlcanceModificacion = 'solo_esta' | 'esta_y_siguientes';

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
}

export interface ModificarSesionData {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
  fecha?: Date;
  recordatorioMinutos?: number;
}

export interface ISesionEstudioRepository {
  crearSerie(data: CrearSerieData): Promise<SerieDTO>;
  obtenerSesionesDeUsuario(creadorId: string): Promise<SesionDTO[]>;
  obtenerSesionPorId(sesionId: string): Promise<SesionDTO | null>;
  modificarSesion(sesionId: string, alcance: AlcanceModificacion, data: ModificarSesionData): Promise<SesionDTO[]>;
  cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void>;
  marcarRecordatorioEnviado(sesionId: string): Promise<void>;
  obtenerSesionesPendientesRecordatorio(ahora: Date): Promise<SesionDTO[]>;
}
