/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ModerationPollGatewayDecorator } from '../src/modules/polls/infrastructure/moderation-poll-gateway.decorator';
import { PollBroadcastRecord, PollGateway } from '../src/domain/contracts';

jest.mock('../src/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warning: jest.fn(),
        critical: jest.fn(),
    },
}));

function buildPayload(question: string, options: string[]): PollBroadcastRecord {
    return {
        id: 'poll-1',
        question,
        status: 'OPEN',
        target: { type: 'CHANNEL', id: 'group-1' },
        createdById: 'user-1',
        autoCloseAt: null,
        closedAt: null,
        createdAt: new Date('2026-05-13T19:00:00Z'),
        updatedAt: new Date('2026-05-13T19:10:00Z'),
        grupoId: 'group-1',
        opciones: options.map((text, index) => ({
            id: `option-${index + 1}`,
            pollId: 'poll-1',
            text,
            position: index + 1,
            votos: 0,
            porcentaje: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })),
    };
}

describe('ModerationPollGatewayDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rechaza una encuesta con título ofensivo y no delega', () => {
        const emitNewPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll, emitUpdatedPoll: jest.fn() };
        const decorator = new ModerationPollGatewayDecorator(wrapped);

        expect(() => decorator.emitNewPoll(buildPayload('Oferta spam', ['A', 'B']))).toThrow(
            /título: El contenido contiene contenido no permitido: "spam"/,
        );
        expect(emitNewPoll).not.toHaveBeenCalled();
    });

    it('rechaza una encuesta con una opción vacía y no delega', () => {
        const emitUpdatedPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll: jest.fn(), emitUpdatedPoll };
        const decorator = new ModerationPollGatewayDecorator(wrapped);

        expect(() => decorator.emitUpdatedPoll(buildPayload('¿Qué prefieres?', ['A', '   ']))).toThrow(
            /opción 2: El contenido no puede estar vacío/,
        );
        expect(emitUpdatedPoll).not.toHaveBeenCalled();
    });

    it('delega cuando el contenido es válido', () => {
        const emitNewPoll = jest.fn();
        const emitUpdatedPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll, emitUpdatedPoll };
        const decorator = new ModerationPollGatewayDecorator(wrapped);
        const payload = buildPayload('¿Cuál prefieres?', ['A', 'B']);

        decorator.emitNewPoll(payload);
        decorator.emitUpdatedPoll(payload);

        expect(emitNewPoll).toHaveBeenCalledWith(payload);
        expect(emitUpdatedPoll).toHaveBeenCalledWith(payload);
    });
});