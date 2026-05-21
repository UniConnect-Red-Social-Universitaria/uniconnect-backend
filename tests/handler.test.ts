import { describe, expect, it, jest } from '@jest/globals';
import { Response } from 'express';

import { handler } from '../src/lib/handler';

function mockRes(): Response {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as unknown as Response;
    return res;
}

describe('Handler', () => {
    describe('failure', () => {
        it('responde con success: false y el mensaje', () => {
            const res = mockRes();
            handler.failure(res, 400, 'Algo salió mal');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Algo salió mal' });
        });

        it('incluye extra si se pasa', () => {
            const res = mockRes();
            handler.failure(res, 401, 'No autorizado', { reason: 'token inválido' });
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No autorizado', reason: 'token inválido' });
        });

        it('no incluye extra undefined', () => {
            const res = mockRes();
            handler.failure(res, 500, 'Error');
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error' });
        });
    });

    describe('standardError', () => {
        it('responde con ok: false y error estructurado', () => {
            const res = mockRes();
            handler.standardError(res, 404, 'No encontrado');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ ok: false, error: { message: 'No encontrado', statusCode: 404 } });
        });
    });
});
