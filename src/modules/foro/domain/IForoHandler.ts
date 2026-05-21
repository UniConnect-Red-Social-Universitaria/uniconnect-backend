export interface ForoContexto {
  usuarioId: string;
  materiaId: string;
  contenido: string;
  preguntaId?: string;
}

export interface ResultadoForo {
  valido: boolean;
  error?: string;
}

export interface IForoHandler {
  setSiguiente(handler: IForoHandler): IForoHandler;
  manejar(ctx: ForoContexto): Promise<ResultadoForo>;
}

export interface ForoPreguntaDTO {
  id: string;
  titulo: string;
  contenido: string;
  cerrada: boolean;
  autorId: string;
  autorNombre: string;
  materiaId: string;
  createdAt: Date;
}

export interface ForoRespuestaDTO {
  id: string;
  contenido: string;
  autorId: string;
  autorNombre: string;
  preguntaId: string;
  puntuacion: number;
  miVoto?: 1 | -1 | null;
  createdAt: Date;
}

export interface IForoRepository {
  crearPregunta(data: { titulo: string; contenido: string; autorId: string; materiaId: string }): Promise<ForoPreguntaDTO>;
  crearRespuesta(data: { contenido: string; autorId: string; preguntaId: string; materiaId: string }): Promise<ForoRespuestaDTO>;
  registrarVoto(usuarioId: string, respuestaId: string, valor: 1 | -1): Promise<ForoRespuestaDTO>;
  obtenerPreguntasPorMateria(materiaId: string): Promise<ForoPreguntaDTO[]>;
  obtenerRespuestasPorPregunta(preguntaId: string, usuarioId?: string): Promise<ForoRespuestaDTO[]>;
  cerrarPregunta(preguntaId: string): Promise<ForoPreguntaDTO>;
  obtenerPreguntaPorId(preguntaId: string): Promise<ForoPreguntaDTO | null>;
}
