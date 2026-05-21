import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const notificacionServiceMock = { notificar: jest.fn() };
const preferenciaRepositoryMock = {
    obtenerPreferencias: jest.fn(),
    actualizarPreferencias: jest.fn(),
};
const notificacionRepositoryMock = {
    listarPorUsuario: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarComoLeida: jest.fn(),
    marcarTodasComoLeidas: jest.fn(),
};

jest.mock('../src/container', () => ({
    notificacionService: notificacionServiceMock,
    preferenciaRepository: preferenciaRepositoryMock,
    notificacionRepository: notificacionRepositoryMock,
}));

import { NotificacionController } from '../src/modules/notifications/interfaces/http/notificacion.controller';

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
}

describe('NotificacionController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('obtenerPreferencias', () => {
        it('retorna preferencias para tipo válido', async () => {
            const req = mockReq({ params: { tipoEvento: 'mensaje' } });
            const res = mockRes();
            preferenciaRepositoryMock.obtenerPreferencias.mockResolvedValue({ canales: ['in-app'] });
            await NotificacionController.obtenerPreferencias(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: { canales: ['in-app'] } });
        });

        it('retorna 400 para tipo inválido', async () => {
            const req = mockReq({ params: { tipoEvento: 'invalido' } });
            const res = mockRes();
            await NotificacionController.obtenerPreferencias(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('obtenerTodasLasPreferencias', () => {
        it('retorna todas las preferencias', async () => {
            const req = mockReq();
            const res = mockRes();
            preferenciaRepositoryMock.obtenerPreferencias.mockResolvedValue({ canales: [] });
            await NotificacionController.obtenerTodasLasPreferencias(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: expect.any(Array) });
        });
    });

    describe('actualizarPreferencias', () => {
        it('actualiza preferencias globales', async () => {
            const req = mockReq({ body: { canales: ['in-app', 'email'] } });
            const res = mockRes();
            preferenciaRepositoryMock.actualizarPreferencias.mockResolvedValue({});
            await NotificacionController.actualizarPreferencias(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('retorna 400 si canales no es array', async () => {
            const req = mockReq({ body: { canales: 'in-app' } });
            const res = mockRes();
            await NotificacionController.actualizarPreferencias(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('retorna 400 si canales contiene valores inválidos', async () => {
            const req = mockReq({ body: { canales: ['fax'] } });
            const res = mockRes();
            await NotificacionController.actualizarPreferencias(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('enviarPrueba', () => {
        it('envia notificacion de prueba', async () => {
            const req = mockReq({ body: { tipoEvento: 'mensaje', mensaje: 'Hola' } });
            const res = mockRes();
            notificacionServiceMock.notificar.mockResolvedValue({});
            await NotificacionController.enviarPrueba(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
        });
    });

    describe('listar', () => {
        it('retorna notificaciones', async () => {
            const req = mockReq({ query: { noLeidas: 'true' } });
            const res = mockRes();
            notificacionRepositoryMock.listarPorUsuario.mockResolvedValue([]);
            notificacionRepositoryMock.contarNoLeidas.mockResolvedValue(0);
            await NotificacionController.listar(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: { noLeidas: 0 } });
        });
    });

    describe('marcarLeida', () => {
        it('marca notificacion como leida', async () => {
            const req = mockReq({ params: { id: 'notif-1' } });
            const res = mockRes();
            await NotificacionController.marcarLeida(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Notificación marcada como leída' });
        });
    });

    describe('marcarTodasLeidas', () => {
        it('marca todas como leidas', async () => {
            const req = mockReq();
            const res = mockRes();
            await NotificacionController.marcarTodasLeidas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
        });
    });
});
