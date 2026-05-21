import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const sesionUseCasesMock = {
    crearSerie: jest.fn(),
    obtenerSesiones: jest.fn(),
    modificarSesion: jest.fn(),
    cancelarSesion: jest.fn(),
    cancelarSesionesPorIds: jest.fn(),
    obtenerCalendario: jest.fn(),
    obtenerDetalleSesion: jest.fn(),
    confirmarAsistencia: jest.fn(),
    declinarAsistencia: jest.fn(),
};

jest.mock('../src/container', () => ({ sesionUseCases: sesionUseCasesMock }));

import { SesionController } from '../src/modules/sesiones/interfaces/http/sesion.controller';

function mockReq(overrides: any = {}): Request {
    return { usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' }, query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res;
}

describe('SesionController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('crearSerie', () => {
        it('responde 201', async () => {
            const req = mockReq({ body: { titulo: 'Estudio', descripcion: '', lugar: '', frecuencia: 'SEMANAL', fechaInicio: '2025-01-01', fechaFin: '2025-06-01', recordatorioMinutos: 30 } });
            const res = mockRes();
            sesionUseCasesMock.crearSerie.mockResolvedValue({ message: 'Creada', data: {} });
            await SesionController.crearSerie(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('obtenerSesiones', () => {
        it('responde con sesiones', async () => {
            const req = mockReq();
            const res = mockRes();
            sesionUseCasesMock.obtenerSesiones.mockResolvedValue({ data: [] });
            await SesionController.obtenerSesiones(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('modificarSesion', () => {
        it('modifica sesion', async () => {
            const req = mockReq({ params: { sesionId: 'ses-1' }, body: { alcance: 'UNICA', titulo: 'Nuevo' } });
            const res = mockRes();
            sesionUseCasesMock.modificarSesion.mockResolvedValue({ message: 'Modificada' });
            await SesionController.modificarSesion(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('cancelarSesion', () => {
        it('cancela sesion', async () => {
            const req = mockReq({ params: { sesionId: 'ses-1' }, body: { alcance: 'UNICA' } });
            const res = mockRes();
            sesionUseCasesMock.cancelarSesion.mockResolvedValue({ message: 'Cancelada' });
            await SesionController.cancelarSesion(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('cancelarSesionesPorIds', () => {
        it('cancela multiples sesiones', async () => {
            const req = mockReq({ body: { sesionIds: ['ses-1', 'ses-2'] } });
            const res = mockRes();
            sesionUseCasesMock.cancelarSesionesPorIds.mockResolvedValue({ message: 'Canceladas' });
            await SesionController.cancelarSesionesPorIds(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('obtenerCalendario', () => {
        it('obtiene calendario', async () => {
            const req = mockReq();
            const res = mockRes();
            sesionUseCasesMock.obtenerCalendario.mockResolvedValue({ data: [] });
            await SesionController.obtenerCalendario(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('obtenerDetalleSesion', () => {
        it('obtiene detalle', async () => {
            const req = mockReq({ params: { sesionId: 'ses-1' } });
            const res = mockRes();
            sesionUseCasesMock.obtenerDetalleSesion.mockResolvedValue({ data: {} });
            await SesionController.obtenerDetalleSesion(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('confirmarAsistencia', () => {
        it('confirma asistencia', async () => {
            const req = mockReq({ params: { sesionId: 'ses-1' } });
            const res = mockRes();
            sesionUseCasesMock.confirmarAsistencia.mockResolvedValue({ message: 'Confirmada' });
            await SesionController.confirmarAsistencia(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('declinarAsistencia', () => {
        it('declina asistencia', async () => {
            const req = mockReq({ params: { sesionId: 'ses-1' } });
            const res = mockRes();
            sesionUseCasesMock.declinarAsistencia.mockResolvedValue({ message: 'Declinada' });
            await SesionController.declinarAsistencia(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
