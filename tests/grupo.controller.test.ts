import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const groupUseCasesMock = {
    buscarPorTexto: jest.fn(),
    crearGrupo: jest.fn(),
    listarMisGrupos: jest.fn(),
    obtenerGrupo: jest.fn(),
    listarGruposDisponibles: jest.fn(),
    solicitarIngreso: jest.fn(),
    listarSolicitudesGrupo: jest.fn(),
    listarMisSolicitudes: jest.fn(),
    aprobarSolicitud: jest.fn(),
    rechazarSolicitud: jest.fn(),
    subirArchivo: jest.fn(),
    listarArchivos: jest.fn(),
    iniciarTransferenciaAdministracion: jest.fn(),
    aceptarTransferenciaAdministracion: jest.fn(),
    rechazarTransferenciaAdministracion: jest.fn(),
    cancelarTransferenciaAdministracion: jest.fn(),
    agregarMiembro: jest.fn(),
    aceptarInvitacion: jest.fn(),
    rechazarInvitacion: jest.fn(),
    abandonarGrupo: jest.fn(),
    obtenerMiembrosGrupo: jest.fn(),
};

const materiaUseCasesMock = {
    crear: jest.fn(),
};

jest.mock('../src/container', () => ({
    groupUseCases: groupUseCasesMock,
    materiaUseCases: materiaUseCasesMock,
}));

jest.mock('../src/lib/cloudinary', () => ({
    cloudinary: { url: jest.fn() },
}));

import { GrupoController } from '../src/modules/groups/interfaces/http/grupo.controller';

function mockReq(overrides: any = {}): Request {
    return {
        usuario: { id: 'user-1', correo: 'test@test.com', nombre: 'Test' },
        query: {},
        params: {},
        body: {},
        file: undefined,
        ...overrides,
    } as unknown as Request;
}

function mockRes(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res as Response;
}

describe('GrupoController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buscar', () => {
        it('responde con datos de busqueda', async () => {
            const req = mockReq({ query: { q: 'test' } });
            const res = mockRes();
            groupUseCasesMock.buscarPorTexto.mockResolvedValue({ data: [{ id: 'g-1' }] });
            await GrupoController.buscar(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'g-1' }] });
        });
    });

    describe('crearMateria', () => {
        it('crea y responde 201', async () => {
            const req = mockReq({ body: { nombre: 'Calculo' } });
            const res = mockRes();
            materiaUseCasesMock.crear.mockResolvedValue({ message: 'Creada', data: { id: 'm-1' } });
            await GrupoController.crearMateria(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Creada', data: { id: 'm-1' } });
        });
    });

    describe('crearGrupo', () => {
        it('crea grupo y responde 201', async () => {
            const req = mockReq({ body: { nombre: 'Grupo A', materiaId: 'mat-1' } });
            const res = mockRes();
            groupUseCasesMock.crearGrupo.mockResolvedValue({ message: 'Creado', data: { id: 'g-1' } });
            await GrupoController.crearGrupo(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('listarMisGrupos', () => {
        it('responde con grupos del usuario', async () => {
            const req = mockReq();
            const res = mockRes();
            groupUseCasesMock.listarMisGrupos.mockResolvedValue({ data: [] });
            await GrupoController.listarMisGrupos(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('obtenerGrupo', () => {
        it('responde con datos del grupo', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.obtenerGrupo.mockResolvedValue({ data: { id: 'g-1' } });
            await GrupoController.obtenerGrupo(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'g-1' } });
        });
    });

    describe('listarGruposDisponibles', () => {
        it('responde con grupos disponibles', async () => {
            const req = mockReq();
            const res = mockRes();
            groupUseCasesMock.listarGruposDisponibles.mockResolvedValue({ data: [] });
            await GrupoController.listarGruposDisponibles(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('solicitarIngreso', () => {
        it('responde 201 con mensaje', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.solicitarIngreso.mockResolvedValue({ message: 'Solicitado', data: {} });
            await GrupoController.solicitarIngreso(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('listarSolicitudesGrupo', () => {
        it('responde con solicitudes del grupo', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.listarSolicitudesGrupo.mockResolvedValue({ data: [] });
            await GrupoController.listarSolicitudesGrupo(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('listarMisSolicitudes', () => {
        it('responde con solicitudes del usuario', async () => {
            const req = mockReq();
            const res = mockRes();
            groupUseCasesMock.listarMisSolicitudes.mockResolvedValue({ data: [] });
            await GrupoController.listarMisSolicitudes(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('aprobarSolicitud', () => {
        it('aprueba y responde mensaje', async () => {
            const req = mockReq({ params: { id: 'g-1', solicitudId: 'sol-1' } });
            const res = mockRes();
            groupUseCasesMock.aprobarSolicitud.mockResolvedValue({ message: 'Aprobada' });
            await GrupoController.aprobarSolicitud(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Aprobada' });
        });
    });

    describe('rechazarSolicitud', () => {
        it('rechaza y responde mensaje', async () => {
            const req = mockReq({ params: { id: 'g-1', solicitudId: 'sol-1' } });
            const res = mockRes();
            groupUseCasesMock.rechazarSolicitud.mockResolvedValue({ message: 'Rechazada' });
            await GrupoController.rechazarSolicitud(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Rechazada' });
        });
    });

    describe('subirArchivo', () => {
        it('responde 201 con mensaje', async () => {
            const req = mockReq({ params: { id: 'g-1' }, file: { originalname: 'doc.pdf' }, body: { nombre: 'doc.pdf' } });
            const res = mockRes();
            groupUseCasesMock.subirArchivo.mockResolvedValue({ message: 'Subido', data: {} });
            await GrupoController.subirArchivo(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('listarArchivos', () => {
        it('responde con archivos del grupo', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.listarArchivos.mockResolvedValue({ data: [] });
            await GrupoController.listarArchivos(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('iniciarTransferencia', () => {
        it('inicia transferencia', async () => {
            const req = mockReq({ params: { id: 'g-1' }, body: { candidatoId: 'user-2' } });
            const res = mockRes();
            groupUseCasesMock.iniciarTransferenciaAdministracion.mockResolvedValue({ message: 'Iniciada' });
            await GrupoController.iniciarTransferencia(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Iniciada' });
        });
    });

    describe('aceptarTransferencia', () => {
        it('acepta transferencia', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.aceptarTransferenciaAdministracion.mockResolvedValue({ message: 'Aceptada' });
            await GrupoController.aceptarTransferencia(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Aceptada' });
        });
    });

    describe('rechazarTransferencia', () => {
        it('rechaza transferencia', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.rechazarTransferenciaAdministracion.mockResolvedValue({ message: 'Rechazada' });
            await GrupoController.rechazarTransferencia(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Rechazada' });
        });
    });

    describe('cancelarTransferencia', () => {
        it('cancela transferencia', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.cancelarTransferenciaAdministracion.mockResolvedValue({ message: 'Cancelada' });
            await GrupoController.cancelarTransferencia(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Cancelada' });
        });
    });

    describe('agregarMiembro', () => {
        it('responde 201', async () => {
            const req = mockReq({ params: { id: 'g-1' }, body: { usuarioId: 'user-2' } });
            const res = mockRes();
            groupUseCasesMock.agregarMiembro.mockResolvedValue({ message: 'Agregado' });
            await GrupoController.agregarMiembro(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('aceptarInvitacion', () => {
        it('acepta invitacion', async () => {
            const req = mockReq({ params: { id: 'g-1', solicitudId: 'sol-1' } });
            const res = mockRes();
            groupUseCasesMock.aceptarInvitacion.mockResolvedValue({ message: 'Aceptada' });
            await GrupoController.aceptarInvitacion(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Aceptada' });
        });
    });

    describe('rechazarInvitacion', () => {
        it('rechaza invitacion', async () => {
            const req = mockReq({ params: { id: 'g-1', solicitudId: 'sol-1' } });
            const res = mockRes();
            groupUseCasesMock.rechazarInvitacion.mockResolvedValue({ message: 'Rechazada' });
            await GrupoController.rechazarInvitacion(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Rechazada' });
        });
    });

    describe('abandonarGrupo', () => {
        it('abandona grupo', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.abandonarGrupo.mockResolvedValue({ message: 'Abandonado', grupoEliminado: false });
            await GrupoController.abandonarGrupo(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Abandonado', grupoEliminado: false });
        });
    });

    describe('obtenerMiembrosGrupo', () => {
        it('responde con miembros', async () => {
            const req = mockReq({ params: { id: 'g-1' } });
            const res = mockRes();
            groupUseCasesMock.obtenerMiembrosGrupo.mockResolvedValue({ data: [] });
            await GrupoController.obtenerMiembrosGrupo(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });
});
