import { CambioAsistenciaPayload, ISesionObserver } from '../domain/ISesionObserver';
import { NotificacionService } from '../../notifications/application/NotificacionService';
import { NotificacionBase } from '../../../shared/notificacion/INotificacion';

export class NotificacionSesionObserver implements ISesionObserver {
  constructor(private readonly notificacionService: NotificacionService) {}

  onAsistenciaActualizada(payload: CambioAsistenciaPayload): void {
    const estadoTexto = payload.nuevoEstado === 'CONFIRMADA' ? 'confirmó asistencia' : 'declinó asistencia';
    const notificacion = new NotificacionBase(
      `${payload.usuarioNombre} ${estadoTexto} a "${payload.sesionTitulo}"`,
      payload.organizadorId,
    );

    this.notificacionService
      .notificarYPersistir(
        notificacion.render(),
        payload.organizadorId,
        'recordatorio',
        `Asistencia: ${payload.sesionTitulo}`,
        payload.sesionId,
      )
      .catch((error: Error) =>
        console.error('[NotificacionSesionObserver] Error al notificar:', error),
      );
  }
}
