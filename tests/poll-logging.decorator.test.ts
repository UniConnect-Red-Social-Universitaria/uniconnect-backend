/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { LoggingPollGatewayDecorator } from '../src/modules/polls/infrastructure/logging-poll-gateway.decorator';
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

const loggerModule = jest.requireMock('../src/lib/logger') as {
    logger: { info: jest.Mock };
};

function buildPayload(status: 'OPEN' | 'CLOSED'): PollBroadcastRecord {
    return {
        id: 'poll-1',
        question: '¿Cuál prefieres?',
        status,
        target: { type: 'CHANNEL', id: 'group-1' },
        createdById: 'user-1',
        autoCloseAt: null,
        closedAt: status === 'CLOSED' ? new Date('2026-05-13T20:00:00Z') : null,
        createdAt: new Date('2026-05-13T19:00:00Z'),
        updatedAt: new Date('2026-05-13T19:10:00Z'),
        grupoId: 'group-1',
        opciones: [
            { id: 'option-1', pollId: 'poll-1', text: 'A', position: 1, votos: 2, porcentaje: 67, createdAt: new Date(), updatedAt: new Date() },
            { id: 'option-2', pollId: 'poll-1', text: 'B', position: 2, votos: 1, porcentaje: 33, createdAt: new Date(), updatedAt: new Date() },
        ],
    };
}

describe('LoggingPollGatewayDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loggea la creación de una encuesta y delega al gateway envuelto', () => {
        const emitNewPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll, emitUpdatedPoll: jest.fn() };
        const decorator = new LoggingPollGatewayDecorator(wrapped);
        const payload = buildPayload('OPEN');

        decorator.emitNewPoll(payload);

        expect(loggerModule.logger.info).toHaveBeenCalledWith('[PollLogging] Encuesta creada', expect.objectContaining({
            pollId: 'poll-1',
            grupoId: 'group-1',
            totalOpciones: 2,
            totalVotos: 3,
        }));
        expect(emitNewPoll).toHaveBeenCalledWith(payload);
    });

    it('loggea voto o cierre según el estado y delega al gateway envuelto', () => {
        const emitUpdatedPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll: jest.fn(), emitUpdatedPoll };
        const decorator = new LoggingPollGatewayDecorator(wrapped);

        decorator.emitUpdatedPoll(buildPayload('OPEN'));
        decorator.emitUpdatedPoll(buildPayload('CLOSED'));

        expect(loggerModule.logger.info).toHaveBeenNthCalledWith(
            1,
            '[PollLogging] Voto registrado en encuesta',
            expect.objectContaining({ status: 'OPEN', totalVotos: 3 }),
        );
        expect(loggerModule.logger.info).toHaveBeenNthCalledWith(
            2,
            '[PollLogging] Encuesta cerrada',
            expect.objectContaining({ status: 'CLOSED', totalVotos: 3 }),
        );
        expect(emitUpdatedPoll).toHaveBeenCalledTimes(2);
    });

    it('maneja opciones con votos nulos o sin definir', () => {
        const emitNewPoll = jest.fn();
        const wrapped: PollGateway = { emitNewPoll, emitUpdatedPoll: jest.fn() };
        const decorator = new LoggingPollGatewayDecorator(wrapped);

        const payload = buildPayload('OPEN');
        payload.opciones = [
            { ...payload.opciones[0], votos: null as any },
            { ...payload.opciones[1], votos: undefined as any },
        ];

        decorator.emitNewPoll(payload);

        expect(emitNewPoll).toHaveBeenCalledWith(payload);
        expect(loggerModule.logger.info).toHaveBeenCalledWith(
            '[PollLogging] Encuesta creada',
            expect.objectContaining({ totalVotos: 0 }),
        );
    });
});