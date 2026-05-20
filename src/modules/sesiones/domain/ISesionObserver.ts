export interface CambioAsistenciaPayload {
  sesionId: string;
  sesionTitulo: string;
  usuarioId: string;
  usuarioNombre: string;
  organizadorId: string;
  nuevoEstado: string;
}

export interface ISesionObserver {
  onAsistenciaActualizada(payload: CambioAsistenciaPayload): void;
}
