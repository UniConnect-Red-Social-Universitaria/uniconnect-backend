import {
  GroupMessageRecord,
  MessageGateway,
  MessageRecord,
  ReaccionMensajeRecord,
  ReaccionMensajeGrupoRecord,
  MencionMensajeRecord,
  MencionMensajeGrupoRecord,
} from "../../../domain/contracts";
import {
  emitirMensajeGrupoTiempoReal,
  emitirMensajeTiempoReal,
  emitirNotificacion,
  emitirMencionTiempoReal,
  emitirReaccionTiempoReal,
  emitirReaccionRemovidaTiempoReal,
} from "../../../lib/socket";
import { chatSubject } from "../../../container";
import { NotificacionService } from "../../notifications/application/NotificacionService";
import {
  NotificacionBase,
  NotificacionConPrioridad,
  NotificacionConAccion,
} from "../../../shared/notificacion";

export class SocketMessageGateway implements MessageGateway {
  constructor(private readonly notificacionService?: NotificacionService) {}
  // emitNewMessage(payload: MessageRecord) {
  //   emitirMensajeTiempoReal(payload);

  //   const notificacion = new NotificacionConAccion(
  //     new NotificacionConPrioridad(
  //       new NotificacionBase(payload.contenido, payload.receptorId, payload.createdAt),
  //       'normal',
  //     ),
  //     {
  //       label: 'Ver mensaje',
  //       endpoint: `/api/mensajes/conversacion/${payload.emisorId}`,
  //     },
  //   );

  //   emitirNotificacion(payload.receptorId, notificacion.render());
  // }
  emitNewMessage(payload: MessageRecord) {
    emitirMensajeTiempoReal(payload); // solo el mensaje de chat, sin notificación
  }

  // emitNewGroupMessage(payload: GroupMessageRecord) {
  //   // Nota: emitirMensajeGrupoTiempoReal ya no se llama aquí porque el
  //   // patrón Observer (ChatSubject) se encarga de emitir el mensaje real.

  //   const notificacion = new NotificacionConAccion(
  //     new NotificacionConPrioridad(
  //       new NotificacionBase(
  //         payload.contenido,
  //         payload.grupoId,
  //         payload.createdAt,
  //       ),
  //       "normal",
  //     ),
  //     {
  //       label: "Ver grupo",
  //       endpoint: `/api/grupos/${payload.grupoId}/mensajes`,
  //     },
  //   );

  //   emitirNotificacionGrupo(payload.grupoId, notificacion.render());
  // }
  emitNewGroupMessage(payload: GroupMessageRecord) {
  }

  emitMencion(payload: MencionMensajeRecord | MencionMensajeGrupoRecord) {
    const esGrupo =
      "nombreGrupo" in payload ||
      "grupoId" in payload ||
      ("mensaje" in payload && (payload as any).mensaje?.grupoId != null);

    if (esGrupo) {
      const mencion = payload as MencionMensajeGrupoRecord;

      const notificacion = new NotificacionConAccion(
        new NotificacionConPrioridad(
          new NotificacionBase(
            `Fuiste mencionado en un grupo`,
            mencion.usuarioMencionadoId,
            mencion.createdAt,
          ),
          "urgente",
        ),
        {
          label: "Ver mención",
          endpoint: `/api/grupos`,
        },
      );

      if (this.notificacionService) {
        this.notificacionService.notificarYPersistir(
          notificacion.render(),
          mencion.usuarioMencionadoId,
          'mencion',
          `Fuiste mencionado en un grupo`,
          mencion.mensajeId,
        ).catch(() => {});
      } else {
        emitirNotificacion(mencion.usuarioMencionadoId, notificacion.render());
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
          "urgente",
        ),
        {
          label: "Ver mensaje",
          endpoint: `/api/mensajes`,
        },
      );

      if (this.notificacionService) {
        this.notificacionService.notificarYPersistir(
          notificacion.render(),
          mencion.usuarioMencionadoId,
          'mencion',
          `Fuiste mencionado en un mensaje`,
          mencion.mensajeId,
        ).catch(() => {});
      } else {
        emitirNotificacion(mencion.usuarioMencionadoId, notificacion.render());
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
      "nombreGrupo" in payload ||
      "grupoId" in payload ||
      ("mensaje" in payload && (payload as any).mensaje?.grupoId != null);

    if (esGrupo) {
      const reaccionGrupo = payload as any;
      if (reaccionGrupo.mensaje && reaccionGrupo.mensaje.grupoId) {
        chatSubject.emitirReaccionAgregada(
          reaccionGrupo.mensaje.grupoId,
          reaccionGrupo,
        );
      }
    } else {
      const reaccionInd = payload as any;
      // Notificar a ambos participantes de la conversación para sincronización multi-dispositivo
      if (
        reaccionInd.mensaje &&
        reaccionInd.mensaje.emisorId &&
        reaccionInd.mensaje.receptorId
      ) {
        const participantes = [
          reaccionInd.mensaje.emisorId,
          reaccionInd.mensaje.receptorId,
        ];

        participantes.forEach((participanteId) => {
          emitirReaccionTiempoReal(participanteId, {
            mensajeId: reaccionInd.mensajeId,
            emoji: reaccionInd.emoji,
            usuarioId: reaccionInd.usuarioId,
            usuario: reaccionInd.usuario,
            createdAt: reaccionInd.createdAt,
          });
        });

        console.log(
          `😊 Reacción 1:1 emitida a participantes: ${participantes.join(", ")}`,
        );
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
    console.log(
      `Reacción removida: ${emoji} por usuario ${usuarioId} en mensaje ${mensajeId}`,
    );

    if (esGrupo) {
      if (
        reaccionInfo &&
        reaccionInfo.mensaje &&
        reaccionInfo.mensaje.grupoId
      ) {
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
        const participantes = [
          reaccionInfo.mensaje.emisorId,
          reaccionInfo.mensaje.receptorId,
        ];

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
