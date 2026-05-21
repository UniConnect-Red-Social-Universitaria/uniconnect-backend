import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const recursoServiceMock = {
    crearRecurso: jest.fn(),
    obtenerRecursos: jest.fn(),
    editarRecurso: jest.fn(),
    eliminarRecurso: jest.fn(),
};

jest.mock('../src/modules/recursos/recurso.service', () => ({
    recursoService: recursoServiceMock,
}));

import { RecursoController } from '../src/modules/recursos/recurso.controller';

const controller = new RecursoController();

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, params: {}, body: {}, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res;
}

describe('RecursoController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('crearRecurso', () => {
        it('crea recurso 201', async () => {
            const req = mockReq({ body: { titulo: 'Doc', contenido: 'https://link.com', tipo: 'PDF', grupoId: 'g-1' } });
            const res = mockRes();
            recursoServiceMock.crearRecurso.mockResolvedValue({ id: 'r-1' });
            await controller.crearRecurso(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('retorna 401 sin usuario ni creadorId', async () => {
            const req = mockReq({ usuario: undefined, body: {} });
            const res = mockRes();
            await controller.crearRecurso(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('usa body.creadorId como fallback', async () => {
            const req = mockReq({ usuario: undefined, body: { creadorId: 'user-2', titulo: 'T', contenido: 'C', tipo: 'PDF', grupoId: 'g-1' } });
            const res = mockRes();
            recursoServiceMock.crearRecurso.mockResolvedValue({ id: 'r-1' });
            await controller.crearRecurso(req, res);
            expect(recursoServiceMock.crearRecurso).toHaveBeenCalledWith(expect.objectContaining({ creadorId: 'user-2' }));
        });
    });

    describe('obtenerRecursos', () => {
        it('lista recursos del grupo', async () => {
            const req = mockReq({ params: { grupoId: 'g-1' } });
            const res = mockRes();
            recursoServiceMock.obtenerRecursos.mockResolvedValue([]);
            await controller.obtenerRecursos(req, res);
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('editarRecurso', () => {
        it('edita recurso', async () => {
            const req = mockReq({ params: { id: 'r-1' }, body: { titulo: 'Nuevo' } });
            const res = mockRes();
            recursoServiceMock.editarRecurso.mockResolvedValue({ id: 'r-1' });
            await controller.editarRecurso(req, res);
            expect(res.json).toHaveBeenCalledWith({ id: 'r-1' });
        });

        it('retorna 401 sin usuario', async () => {
            const req = mockReq({ usuario: undefined, params: { id: 'r-1' } });
            const res = mockRes();
            await controller.editarRecurso(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('eliminarRecurso', () => {
        it('elimina recurso', async () => {
            const req = mockReq({ params: { id: 'r-1' } });
            const res = mockRes();
            recursoServiceMock.eliminarRecurso.mockResolvedValue(undefined);
            await controller.eliminarRecurso(req, res);
            expect(res.json).toHaveBeenCalledWith({ message: 'Recurso eliminado correctamente' });
        });

        it('retorna 401 sin usuario', async () => {
            const req = mockReq({ usuario: undefined, params: { id: 'r-1' } });
            const res = mockRes();
            await controller.eliminarRecurso(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
