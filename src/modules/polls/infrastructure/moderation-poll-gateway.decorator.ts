import { PollBroadcastRecord, PollGateway, PollOptionView } from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import { logger } from '../../../lib/logger';
import { findModerationViolation } from '../../../shared/moderation/content-moderation';

function validateField(fieldName: string, value: string, meta: { pollId: string; grupoId: string }): void {
    const violation = findModerationViolation(value);

    if (!violation) {
        return;
    }

    logger.warning('[PollModeration] Contenido rechazado', {
        ...meta,
        fieldName,
        value,
        violation,
    });

    throw new ApplicationError(400, `${fieldName}: ${violation}`);
}

function validateOptions(options: PollOptionView[], meta: { pollId: string; grupoId: string }): void {
    options.forEach((option, index) => {
        validateField(`opción ${index + 1}`, option.text, meta);
    });
}

export class ModerationPollGatewayDecorator implements PollGateway {
    constructor(private readonly wrapped: PollGateway) { }

    emitNewPoll(payload: PollBroadcastRecord): void {
        const meta = { pollId: payload.id, grupoId: payload.grupoId };

        validateField('título', payload.question, meta);
        validateOptions(payload.opciones, meta);

        this.wrapped.emitNewPoll(payload);
    }

    emitUpdatedPoll(payload: PollBroadcastRecord): void {
        const meta = { pollId: payload.id, grupoId: payload.grupoId };

        validateField('título', payload.question, meta);
        validateOptions(payload.opciones, meta);

        this.wrapped.emitUpdatedPoll(payload);
    }
}