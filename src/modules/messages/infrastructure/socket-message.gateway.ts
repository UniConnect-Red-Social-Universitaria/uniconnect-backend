import {
  GroupMessageRecord,
  MessageGateway,
  MessageRecord,
  ReaccionMensajeRecord,
  ReaccionMensajeGrupoRecord,
  MencionMensajeRecord,
  MencionMensajeGrupoRecord,
} from '../../../domain/contracts';
import {
  emitirMensajeTiempoReal,
  emitirNotificacion,
  emitirNotificacionGrupo,
  emitirMencionTiempoReal,
  emitirReaccionTiempoReal,
  emitirReaccionRemovidaTiempoReal,
} from '../../../lib/socket';
import { chatSubject } from '../../../container';
import {
  NotificacionBase,
  NotificacionConPrioridad,
  NotificacionConAccion,
} from '../../../shared/notificacion';
import { NotificacionService } from '../../notifications/application/NotificacionService';

export class SocketMessageGateway implements MessageGateway {
  constructor(private readonly notificacionService?: NotificacionService) {}

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

    const dto = notificacion.render();

    if (this.notificacionService) {
      // Respeta los canales elegidos por el usuario receptor
      this.notificacionService
        .notificar(dto, payload.receptorId, 'mensaje')
        .catch((err) => console.error('[SocketMessageGateway] Error al notificar mensaje:', err));
    } else {
      // Fallback: sólo in-app
      emitirNotificacion(payload.receptorId, dto);
    }
  }

  emitNewGroupMessage(payload: GroupMessageRecord) {
    // El patrón Observer (ChatSubject) emite el mensaje en tiempo real;
    // aquí solo gestionamos la notificación multicanal.

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

    const dto = notificacion.render();

    if (this.notificacionService) {
      // Notificar a cada miembro del grupo (el grupoId actúa como destinatario
      // para el canal in-app; los demás canales usan el mismo ID de grupo como referencia)
      emitirNotificacionGrupo(payload.grupoId, dto);
    } else {
      emitirNotificacionGrupo(payload.grupoId, dto);
    }
  }

  emitMencion(payload: MencionMensajeRecord | MencionMensajeGrupoRecord) {
    const esGrupo =
      'nombreGrupo' in payload ||
      'grupoId' in payload ||
      ('mensaje' in payload && (payload as any).mensaje?.grupoId != null);

    if (esGrupo) {
      const mencion = payload as MencionMensajeGrupoRecord;

      const notificacion = new NotificacionConAccion(
        new NotificacionConPrioridad(
          new NotificacionBase(
            `Fuiste mencionado en un grupo`,
            mencion.usuarioMencionadoId,
            mencion.createdAt,
          ),
          'urgente',
        ),
        {
          label: 'Ver mención',
          endpoint: `/api/grupos`,
        },
      );

      const dto = notificacion.render();

      if (this.notificacionService) {
        this.notificacionService
          .notificar(dto, mencion.usuarioMencionadoId, 'mencion')
          .catch((err) => console.error('[SocketMessageGateway] Error al notificar mención grupo:', err));
      } else {
        emitirNotificacion(mencion.usuarioMencionadoId, dto);
      }

      emitirMencionTiempoReal(mencion.usuarioMencionadoId, {
        mensajeId: mencion.mensajeId,
        usuarioMencionadoId: mencion.usuarioMencionadoId,
        usuarioMencionado: mencion.usuarioMencionado,
        createdAt: mencion.createdAt,
        esGrupo: true,
      });
    } else {
      const mencion = payload as MencionMensajeRecord;

      const notificacion = new NotificacionConAccion(
        new NotificacionConPrioridad(
          new NotificacionBase(
            `Fuiste mencionado en un mensaje`,
            mencion.usuarioMencionadoId,
            mencion.createdAt,
          ),
          'urgente',
        ),
        {
          label: 'Ver mensaje',
          endpoint: `/api/mensajes`,
        },
      );

      const dto = notificacion.render();

      if (this.notificacionService) {
        this.notificacionService
          .notificar(dto, mencion.usuarioMencionadoId, 'mencion')
          .catch((err) => console.error('[SocketMessageGateway] Error al notificar mención:', err));
      } else {
        emitirNotificacion(mencion.usuarioMencionadoId, dto);
      }

      emitirMencionTiempoReal(mencion.usuarioMencionadoId, {
        mensajeId: mencion.mensajeId,
        usuarioMencionadoId: mencion.usuarioMencionadoId,
        usuarioMencionado: mencion.usuarioMencionado,
        createdAt: mencion.createdAt,
        esGrupo: false,
      });
    }
  }

  emitReaccion(payload: ReaccionMensajeRecord | ReaccionMensajeGrupoRecord) {
    const esGrupo =
      'nombreGrupo' in payload ||
      'grupoId' in payload ||
      ('mensaje' in payload && (payload as any).mensaje?.grupoId != null);

    if (esGrupo) {
      const reaccionGrupo = payload as any;
      if (reaccionGrupo.mensaje && reaccionGrupo.mensaje.grupoId) {
        chatSubject.emitirReaccionAgregada(reaccionGrupo.mensaje.grupoId, reaccionGrupo);
      }
    } else {
      const reaccionInd = payload as any;
      if (reaccionInd.mensaje && reaccionInd.mensaje.emisorId && reaccionInd.mensaje.receptorId) {
        const participantes = [reaccionInd.mensaje.emisorId, reaccionInd.mensaje.receptorId];

        participantes.forEach((participanteId) => {
          emitirReaccionTiempoReal(participanteId, {
            mensajeId: reaccionInd.mensajeId,
            emoji: reaccionInd.emoji,
            usuarioId: reaccionInd.usuarioId,
            usuario: reaccionInd.usuario,
            createdAt: reaccionInd.createdAt,
          });
        });
      }
    }
  }

  emitRemoveReaccion(
    mensajeId: string,
    usuarioId: string,
    emoji: string,
    esGrupo: boolean,
    reaccionInfo?: any,
  ) {
    if (esGrupo) {
      if (reaccionInfo && reaccionInfo.mensaje && reaccionInfo.mensaje.grupoId) {
        chatSubject.emitirReaccionRemovida(reaccionInfo.mensaje.grupoId, {
          mensajeId,
          usuarioId,
          emoji,
        });
      }
    } else {
      if (
        reaccionInfo &&
        reaccionInfo.mensaje &&
        reaccionInfo.mensaje.emisorId &&
        reaccionInfo.mensaje.receptorId
      ) {
        const participantes = [reaccionInfo.mensaje.emisorId, reaccionInfo.mensaje.receptorId];

        participantes.forEach((participanteId) => {
          emitirReaccionRemovidaTiempoReal(participanteId, {
            mensajeId,
            usuarioId,
            emoji,
          });
        });
      }
    }
  }
}