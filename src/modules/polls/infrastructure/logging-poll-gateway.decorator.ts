import { PollBroadcastRecord, PollGateway } from '../../../domain/contracts';
import { logger } from '../../../lib/logger';

function countVotes(payload: PollBroadcastRecord): number {
    return payload.opciones.reduce((total, option) => total + Number(option.votos ?? 0), 0);
}

function buildPollLogMeta(payload: PollBroadcastRecord) {
    return {
        pollId: payload.id,
        grupoId: payload.grupoId,
        status: payload.status,
        totalOpciones: payload.opciones.length,
        totalVotos: countVotes(payload),
        autoCloseAt: payload.autoCloseAt ?? null,
        createdById: payload.createdById,
    };
}

export class LoggingPollGatewayDecorator implements PollGateway {
    constructor(private readonly wrapped: PollGateway) { }

    emitNewPoll(payload: PollBroadcastRecord): void {
        logger.info('[PollLogging] Encuesta creada', buildPollLogMeta(payload));
        this.wrapped.emitNewPoll(payload);
    }

    emitUpdatedPoll(payload: PollBroadcastRecord): void {
        const meta = buildPollLogMeta(payload);

        if (payload.status === 'CLOSED') {
            logger.info('[PollLogging] Encuesta cerrada', meta);
        } else {
            logger.info('[PollLogging] Voto registrado en encuesta', meta);
        }

        this.wrapped.emitUpdatedPoll(payload);
    }
}