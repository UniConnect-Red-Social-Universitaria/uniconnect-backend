import { describe, expect, it, jest, beforeEach } from '@jest/globals';

jest.mock('../src/lib/prisma', () => ({}));

import { logger } from '../src/lib/logger';

describe('Logger', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('warning', () => {
        it('usa console.warn', () => {
            logger.warning('cuidado');
            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(consoleWarnSpy.mock.calls[0][1]).toBe('cuidado');
        });

        it('incluye meta si se pasa', () => {
            logger.warning('cuidado', { code: 1 });
            const args = consoleWarnSpy.mock.calls[0];
            expect(args[1]).toBe('cuidado');
            expect(args[2]).toEqual({ code: 1 });
        });
    });

    describe('error', () => {
        it('usa console.error', () => {
            logger.error('fallo');
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleErrorSpy.mock.calls[0][1]).toBe('fallo');
        });
    });

    describe('info', () => {
        it('usa console.info', () => {
            logger.info('ok');
            expect(consoleInfoSpy).toHaveBeenCalled();
            expect(consoleInfoSpy.mock.calls[0][1]).toBe('ok');
        });
    });

    describe('debug', () => {
        it('usa console.debug', () => {
            logger.debug('trace');
            expect(consoleDebugSpy).toHaveBeenCalled();
            expect(consoleDebugSpy.mock.calls[0][1]).toBe('trace');
        });
    });

    describe('critical', () => {
        it('usa console.error (mismo que error)', () => {
            logger.critical('grave');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });
});
