import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const catalogUseCasesMock = {
    poblar: jest.fn(),
    listar: jest.fn(),
};

jest.mock('../src/container', () => ({ catalogUseCases: catalogUseCasesMock }));

import { CatalogoController } from '../src/modules/catalog/interfaces/http/catalogo.controller';

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res;
}

describe('CatalogoController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('poblar', () => {
        it('puebla catalogos', async () => {
            const req = mockReq();
            const res = mockRes();
            catalogUseCasesMock.poblar.mockResolvedValue({ message: 'Poblado', data: {} });
            await CatalogoController.poblar(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Poblado', data: {} });
        });
    });

    describe('listar', () => {
        it('lista catalogos', async () => {
            const req = mockReq();
            const res = mockRes();
            catalogUseCasesMock.listar.mockResolvedValue({ data: [] });
            await CatalogoController.listar(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });
});
