import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const eventUseCasesMock = {
    crear: jest.fn(),
    listarGlobal: jest.fn(),
    filtrarPorCategoria: jest.fn(),
};
const notificacionServiceMock = { notificar: jest.fn() };

jest.mock('../src/container', () => ({
    eventUseCases: eventUseCasesMock,
    notificacionService: notificacionServiceMock,
}));

jest.mock('../src/shared/eventos-observer/EventoPublicador', () => ({
    EventoPublicador: {
        getInstance: jest.fn(() => ({
            suscribir: jest.fn(),
            desuscribir: jest.fn(),
            listarCategoriasSuscritas: jest.fn().mockReturnValue(['academico']),
        })),
    },
}));

jest.mock('../src/shared/eventos-observer/SocketEventoObserver', () => ({
    SocketEventoObserver: jest.fn(),
}));

jest.mock('../src/modules/notifications/infrastructure/NotificacionEventoObserver', () => ({
    NotificacionEventoObserver: jest.fn(),
}));

import { EventoController } from '../src/modules/events/interfaces/http/evento.controller';

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
}

describe('EventoController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('crear', () => {
        it('crea evento y responde 201', async () => {
            const req = mockReq({
                body: { titulo: 'Evento', descripcion: 'Desc', lugar: 'Aud', fechaEvento: '2025-12-01', categoria: 'academico' },
            });
            const res = mockRes();
            eventUseCasesMock.crear.mockResolvedValue({ message: 'Creado', data: { id: 'ev-1' } });
            await EventoController.crear(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Creado', data: { id: 'ev-1' } });
        });
    });

    describe('listarGlobal', () => {
        it('retorna todos los eventos sin filtro', async () => {
            const req = mockReq();
            const res = mockRes();
            eventUseCasesMock.listarGlobal.mockResolvedValue({ data: [] });
            await EventoController.listarGlobal(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });

        it('filtra por categoria si se proporciona', async () => {
            const req = mockReq({ query: { categoria: 'academico' } });
            const res = mockRes();
            eventUseCasesMock.filtrarPorCategoria.mockResolvedValue({ data: [] });
            await EventoController.listarGlobal(req, res);
            expect(eventUseCasesMock.filtrarPorCategoria).toHaveBeenCalledWith('academico');
        });
    });

    describe('suscribir', () => {
        it('retorna 401 sin usuario', async () => {
            const req = mockReq({ usuario: undefined });
            const res = mockRes();
            await EventoController.suscribir(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('retorna 400 con categoria invalida', async () => {
            const req = mockReq({ body: { categoria: 'invalida' } });
            const res = mockRes();
            await EventoController.suscribir(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('suscribe a categoria valida', async () => {
            const req = mockReq({ body: { categoria: 'academico' } });
            const res = mockRes();
            await EventoController.suscribir(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('listarSuscripciones', () => {
        it('retorna 401 sin usuario', async () => {
            const req = mockReq({ usuario: undefined });
            const res = mockRes();
            await EventoController.listarSuscripciones(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('retorna categorias suscritas', async () => {
            const req = mockReq();
            const res = mockRes();
            await EventoController.listarSuscripciones(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: ['academico'] });
        });
    });

    describe('desuscribir', () => {
        it('retorna 401 sin usuario', async () => {
            const req = mockReq({ usuario: undefined });
            const res = mockRes();
            await EventoController.desuscribir(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('retorna 400 con categoria invalida', async () => {
            const req = mockReq({ params: { categoria: 'invalida' } });
            const res = mockRes();
            await EventoController.desuscribir(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('desuscribe de categoria valida', async () => {
            const req = mockReq({ params: { categoria: 'academico' } });
            const res = mockRes();
            await EventoController.desuscribir(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
