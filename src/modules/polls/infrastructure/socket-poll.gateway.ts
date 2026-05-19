import { PollBroadcastRecord, PollGateway } from '../../../domain/contracts';
import {
    emitirEncuestaActualizadaGrupoTiempoReal,
    emitirEncuestaGrupoTiempoReal,
    emitirNotificacionGrupo,
} from '../../../lib/socket';
import {
    NotificacionBase,
    NotificacionConAccion,
    NotificacionConEncuesta,
    NotificacionConPrioridad,
} from '../../../shared/notificacion';

export class SocketPollGateway implements PollGateway {
    emitNewPoll(payload: PollBroadcastRecord): void {
        if (payload.target.type !== 'CHANNEL') {
            return;
        }

        emitirEncuestaGrupoTiempoReal(payload);

        const notificacion = new NotificacionConAccion(
            new NotificacionConPrioridad(
                new NotificacionConEncuesta(
                    new NotificacionBase(
                        `Nueva encuesta: ${payload.question}`,
                        payload.grupoId,
                        payload.createdAt,
                    ),
                    {
                        encuestaId: payload.id,
                        grupoId: payload.grupoId,
                        pregunta: payload.question,
                        estado: payload.status,
                        totalOpciones: payload.opciones.length,
                        autoCloseAt: payload.autoCloseAt ?? null,
                    },
                ),
                'normal',
            ),
            {
                label: 'Ver encuesta',
                endpoint: `/api/encuestas/grupos/${payload.grupoId}`,
            },
        );

        emitirNotificacionGrupo(payload.grupoId, notificacion.render());
    }

    emitUpdatedPoll(payload: PollBroadcastRecord): void {
        if (payload.target.type !== 'CHANNEL') {
            return;
        }

        emitirEncuestaActualizadaGrupoTiempoReal(payload);
    }
}
