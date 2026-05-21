import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

const usersUseCasesMock = {
    buscarGlobal: jest.fn(),
    buscarPorMateria: jest.fn(),
    enviarSolicitudConexion: jest.fn(),
    listarCompaneros: jest.fn(),
    listarSolicitudesRecibidas: jest.fn(),
    aceptarSolicitud: jest.fn(),
    rechazarSolicitud: jest.fn(),
    registrar: jest.fn(),
    obtenerTodos: jest.fn(),
    logout: jest.fn(),
    login: jest.fn(),
    obtenerPerfil: jest.fn(),
    actualizarPerfil: jest.fn(),
    obtenerPerfilPublico: jest.fn(),
    obtenerPerfilEnriquecido: jest.fn(),
    eliminarUsuario: jest.fn(),
};

jest.mock('../src/container', () => ({
    usersUseCases: usersUseCasesMock,
}));

import { UsuarioController } from '../src/modules/users/interfaces/http/usuario.controller';

function mockReq(overrides: any = {}): Request {
    return {
        usuario: { id: 'user-1', correo: 't@t.com', nombre: 'T' },
        token: 'token-1',
        query: {},
        params: {},
        body: {},
        ...overrides,
    } as unknown as Request;
}
function mockRes(): Response {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
}

describe('UsuarioController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('buscarGlobal', () => {
        it('responde con datos de busqueda global', async () => {
            const req = mockReq({ query: { q: 'juan' } });
            const res = mockRes();
            usersUseCasesMock.buscarGlobal.mockResolvedValue({ data: [] });
            await UsuarioController.buscarGlobal(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('buscarPorMateria', () => {
        it('responde con estudiantes por materia', async () => {
            const req = mockReq({ query: { materia: 'Calculo' } });
            const res = mockRes();
            usersUseCasesMock.buscarPorMateria.mockResolvedValue({ data: [] });
            await UsuarioController.buscarPorMateria(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('enviarSolicitudConexion', () => {
        it('responde 201', async () => {
            const req = mockReq({ body: { usuarioDestinoId: 'user-2' } });
            const res = mockRes();
            usersUseCasesMock.enviarSolicitudConexion.mockResolvedValue({ message: 'Enviada', data: {} });
            await UsuarioController.enviarSolicitudConexion(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('listarCompaneros', () => {
        it('responde con companeros', async () => {
            const req = mockReq();
            const res = mockRes();
            usersUseCasesMock.listarCompaneros.mockResolvedValue({ data: [] });
            await UsuarioController.listarCompaneros(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('listarSolicitudesRecibidas', () => {
        it('responde con solicitudes', async () => {
            const req = mockReq();
            const res = mockRes();
            usersUseCasesMock.listarSolicitudesRecibidas.mockResolvedValue({ data: [] });
            await UsuarioController.listarSolicitudesRecibidas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('aceptarSolicitud', () => {
        it('acepta solicitud', async () => {
            const req = mockReq({ body: { solicitudId: 'sol-1' } });
            const res = mockRes();
            usersUseCasesMock.aceptarSolicitud.mockResolvedValue({ message: 'Aceptada', data: {} });
            await UsuarioController.aceptarSolicitud(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Aceptada', data: {} });
        });
    });

    describe('rechazarSolicitud', () => {
        it('rechaza solicitud', async () => {
            const req = mockReq({ body: { solicitudId: 'sol-1' } });
            const res = mockRes();
            usersUseCasesMock.rechazarSolicitud.mockResolvedValue({ message: 'Rechazada', data: {} });
            await UsuarioController.rechazarSolicitud(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Rechazada', data: {} });
        });
    });

    describe('registrar', () => {
        it('registra usuario 201', async () => {
            const req = mockReq({ body: { nombre: 'Juan', correo: 'j@t.com' } });
            const res = mockRes();
            usersUseCasesMock.registrar.mockResolvedValue({ message: 'Registrado', data: {} });
            await UsuarioController.registrar(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('obtenerTodos', () => {
        it('responde con todos los usuarios', async () => {
            const req = mockReq();
            const res = mockRes();
            usersUseCasesMock.obtenerTodos.mockResolvedValue({ data: [] });
            await UsuarioController.obtenerTodos(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });
    });

    describe('logout', () => {
        it('cierra sesion', async () => {
            const req = mockReq();
            const res = mockRes();
            usersUseCasesMock.logout.mockResolvedValue({ message: 'Sesion cerrada' });
            await UsuarioController.logout(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Sesion cerrada' });
        });
    });

    describe('login', () => {
        it('inicia sesion', async () => {
            const req = mockReq({ body: { correo: 'j@t.com', contrasena: '123' } });
            const res = mockRes();
            usersUseCasesMock.login.mockResolvedValue({ message: 'OK', data: { token: 'x' } });
            await UsuarioController.login(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { token: 'x' } });
        });
    });

    describe('obtenerPerfil', () => {
        it('responde con perfil', async () => {
            const req = mockReq();
            const res = mockRes();
            usersUseCasesMock.obtenerPerfil.mockResolvedValue({ data: { id: 'user-1' } });
            await UsuarioController.obtenerPerfil(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'user-1' } });
        });
    });

    describe('actualizarPerfil', () => {
        it('actualiza perfil', async () => {
            const req = mockReq({ body: { carrera: 'Medicina', semestre: 5, materiasCursando: [] } });
            const res = mockRes();
            usersUseCasesMock.actualizarPerfil.mockResolvedValue({ message: 'Actualizado', data: {} });
            await UsuarioController.actualizarPerfil(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Actualizado', data: {} });
        });
    });

    describe('obtenerPerfilPublico', () => {
        it('responde con perfil basico', async () => {
            const req = mockReq({ params: { id: 'user-2' } });
            const res = mockRes();
            usersUseCasesMock.obtenerPerfilPublico.mockResolvedValue({ data: { id: 'user-2' } });
            await UsuarioController.obtenerPerfilPublico(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'user-2' } });
        });

        it('responde con perfil enriquecido si vista=completa', async () => {
            const req = mockReq({ params: { id: 'user-2' }, query: { vista: 'completa' } });
            const res = mockRes();
            usersUseCasesMock.obtenerPerfilEnriquecido.mockResolvedValue({ data: { id: 'user-2', stats: {} } });
            await UsuarioController.obtenerPerfilPublico(req, res);
            expect(usersUseCasesMock.obtenerPerfilEnriquecido).toHaveBeenCalled();
        });
    });

    describe('obtenerPerfilEnriquecido', () => {
        it('responde con perfil enriquecido', async () => {
            const req = mockReq({ params: { id: 'user-2' } });
            const res = mockRes();
            usersUseCasesMock.obtenerPerfilEnriquecido.mockResolvedValue({ data: {} });
            await UsuarioController.obtenerPerfilEnriquecido(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
        });
    });

    describe('eliminarUsuario', () => {
        it('elimina usuario', async () => {
            const req = mockReq({ params: { id: 'user-2' } });
            const res = mockRes();
            usersUseCasesMock.eliminarUsuario.mockResolvedValue({ message: 'Eliminado' });
            await UsuarioController.eliminarUsuario(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Eliminado' });
        });
    });
});
