import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const messageUseCasesMock = {
    enviarMensaje: jest.fn(),
    obtenerHistorial: jest.fn(),
    enviarMensajeGrupo: jest.fn(),
    obtenerHistorialGrupo: jest.fn(),
    agregarReaccion: jest.fn(),
    removerReaccion: jest.fn(),
    obtenerReacciones: jest.fn(),
    obtenerMencionesPendientes: jest.fn(),
};

jest.mock('../src/container', () => ({ messageUseCases: messageUseCasesMock }));
jest.spyOn(console, 'log').mockImplementation(() => {});

import { MensajeController } from '../src/modules/messages/interfaces/http/mensaje.controller';

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res;
}

describe('MensajeController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('enviarMensaje', () => {
        it('responde 201', async () => {
            const req = mockReq({ body: { receptorId: 'user-2', contenido: 'Hola' } });
            const res = mockRes();
            messageUseCasesMock.enviarMensaje.mockResolvedValue({ message: 'Enviado', data: { emisorId: 'u1', receptorId: 'u2', contenido: 'Hola' } });
            await MensajeController.enviarMensaje(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('obtenerHistorial', () => {
        it('responde con historial', async () => {
            const req = mockReq({ params: { companeroId: 'user-2' }, query: { limit: '50' } });
            const res = mockRes();
            messageUseCasesMock.obtenerHistorial.mockResolvedValue({ data: [] });
            await MensajeController.obtenerHistorial(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('enviarMensajeGrupo', () => {
        it('usa req.params.id como grupoId', async () => {
            const req = mockReq({ params: { id: 'grupo-1' }, body: { contenido: 'Hola' } });
            const res = mockRes();
            messageUseCasesMock.enviarMensajeGrupo.mockResolvedValue({ message: 'Enviado', data: { emisorId: 'u1', grupoId: 'g1', contenido: 'Hola' } });
            await MensajeController.enviarMensajeGrupo(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('usa req.body.grupoId como fallback', async () => {
            const req = mockReq({ body: { grupoId: 'grupo-1', contenido: 'Hola' } });
            const res = mockRes();
            messageUseCasesMock.enviarMensajeGrupo.mockResolvedValue({ message: 'Enviado', data: {} });
            await MensajeController.enviarMensajeGrupo(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('obtenerHistorialGrupo', () => {
        it('responde con historial de grupo', async () => {
            const req = mockReq({ params: { id: 'grupo-1' }, query: { limit: '20' } });
            const res = mockRes();
            messageUseCasesMock.obtenerHistorialGrupo.mockResolvedValue({ data: [] });
            await MensajeController.obtenerHistorialGrupo(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('agregarReaccion', () => {
        it('responde 201 con reaccion por defecto esGrupo=true', async () => {
            const req = mockReq({ params: { mensajeId: 'msg-1' }, body: { emoji: '👍' } });
            const res = mockRes();
            messageUseCasesMock.agregarReaccion.mockResolvedValue({ message: 'Agregada', data: {} });
            await MensajeController.agregarReaccion(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('pasa esGrupo=false si se especifica', async () => {
            const req = mockReq({ params: { mensajeId: 'msg-1' }, body: { emoji: '👍', esGrupo: false } });
            const res = mockRes();
            messageUseCasesMock.agregarReaccion.mockResolvedValue({ message: 'Agregada', data: {} });
            await MensajeController.agregarReaccion(req, res);
            expect(messageUseCasesMock.agregarReaccion).toHaveBeenCalledWith(expect.anything(), 'msg-1', '👍', false);
        });
    });

    describe('removerReaccion', () => {
        it('remueve reaccion', async () => {
            const req = mockReq({ params: { mensajeId: 'msg-1' }, body: { emoji: '👍' } });
            const res = mockRes();
            messageUseCasesMock.removerReaccion.mockResolvedValue({ message: 'Removida' });
            await MensajeController.removerReaccion(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Removida' });
        });
    });

    describe('obtenerReacciones', () => {
        it('obtiene reacciones con esGrupo desde query', async () => {
            const req = mockReq({ params: { mensajeId: 'msg-1' }, query: { esGrupo: 'true' } });
            const res = mockRes();
            messageUseCasesMock.obtenerReacciones.mockResolvedValue({ data: [] });
            await MensajeController.obtenerReacciones(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('obtenerMencionesPendientes', () => {
        it('obtiene menciones', async () => {
            const req = mockReq();
            const res = mockRes();
            messageUseCasesMock.obtenerMencionesPendientes.mockResolvedValue({ data: [] });
            await MensajeController.obtenerMencionesPendientes(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });
});
