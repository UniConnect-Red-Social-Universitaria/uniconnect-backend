import {
  GroupMessageRecord,
  MessageGateway,
  MessageRecord,
} from '../../../domain/contracts';
import {
  emitirMensajeGrupoTiempoReal,
  emitirMensajeTiempoReal,
  emitirNotificacion,
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
    emitirMensajeGrupoTiempoReal(payload);

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

    emitirNotificacion(payload.grupoId, notificacion.render());
  }
}