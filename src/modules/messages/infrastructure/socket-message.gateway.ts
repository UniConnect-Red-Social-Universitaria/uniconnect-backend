import {
  GroupMessageRecord,
  MessageGateway,
  MessageRecord,
} from '../../../domain/contracts';
import {
  emitirMensajeGrupoTiempoReal,
  emitirMensajeTiempoReal,
  emitirNotificacion,
  emitirNotificacionGrupo,
} from '../../../lib/socket';
import {
  NotificacionBase,
  NotificacionConPrioridad,
  NotificacionConAccion,
} from '../../../shared/notificacion';

export class SocketMessageGateway implements MessageGateway {
  emitNewMessage(payload: MessageRecord) {
    emitirMensajeTiempoReal(payload);

    const notificacion = new NotificacionConAccion(
      new NotificacionConPrioridad(
        new NotificacionBase(payload.contenido, payload.receptorId, payload.createdAt),
        'normal',
      ),
      {
        label: 'Ver mensaje',
        endpoint: `/api/mensajes/conversacion/${payload.emisorId}`,
      },
    );

    emitirNotificacion(payload.receptorId, notificacion.render());
  }

  emitNewGroupMessage(payload: GroupMessageRecord) {
    // Nota: emitirMensajeGrupoTiempoReal ya no se llama aquí porque el 
    // patrón Observer (ChatSubject) se encarga de emitir el mensaje real.

    const notificacion = new NotificacionConAccion(
      new NotificacionConPrioridad(
        new NotificacionBase(payload.contenido, payload.grupoId, payload.createdAt),
        'normal',
      ),
      {
        label: 'Ver grupo',
        endpoint: `/api/grupos/${payload.grupoId}/mensajes`,
      },
    );

    emitirNotificacionGrupo(payload.grupoId, notificacion.render());
  }
}