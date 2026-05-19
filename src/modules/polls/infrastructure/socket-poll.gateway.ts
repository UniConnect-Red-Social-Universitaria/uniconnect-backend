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
import { NotificacionService } from '../../notifications/application/NotificacionService';

export class SocketPollGateway implements PollGateway {
    constructor(private readonly notificacionService?: NotificacionService) {}

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

        const dto = notificacion.render();

        if (this.notificacionService) {
            // El destinatario del DTO es el grupoId; el servicio notifica por los
            // canales activos del grupo (in-app lo difunde via emitirNotificacionGrupo,
            // email/push se envían con el grupoId como referencia).
            this.notificacionService
                .notificar(dto, payload.grupoId, 'encuesta')
                .catch((err) =>
                    console.error('[SocketPollGateway] Error al notificar encuesta:', err),
                );
        } else {
            emitirNotificacionGrupo(payload.grupoId, dto);
        }
    }

    emitUpdatedPoll(payload: PollBroadcastRecord): void {
        if (payload.target.type !== 'CHANNEL') {
            return;
        }

        emitirEncuestaActualizadaGrupoTiempoReal(payload);
    }
}
