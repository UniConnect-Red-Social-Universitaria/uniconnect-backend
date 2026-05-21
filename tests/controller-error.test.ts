import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Response } from 'express';

import { handleControllerError } from '../src/shared/controller-error';
import { ApplicationError } from '../src/shared/application-error';

function mockRes(): Response {
    return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as unknown as Response;
}

describe('handleControllerError', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('maneja ApplicationError con su status', () => {
        const res = mockRes();
        const error = new ApplicationError(404, 'No encontrado');
        handleControllerError(res, error, 'fallback');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No encontrado' });
    });

    it('responde 500 con fallbackMessage para errores genéricos', () => {
        const res = mockRes();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        handleControllerError(res, new Error('algo malo'), 'Error interno');
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error interno',
            error: 'algo malo',
        });
    });

    it('incluye error cuando includeError es true (default)', () => {
        const res = mockRes();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        handleControllerError(res, 'string error', 'fallback');
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Error desconocido' }),
        );
    });

    it('omite error cuando includeError es false', () => {
        const res = mockRes();
        handleControllerError(res, new Error('secreto'), 'fallback', false);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'fallback',
        });
    });
});
