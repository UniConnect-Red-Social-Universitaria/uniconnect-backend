import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mensajeModelMock = {
    crear: jest.fn(),
    obtenerConversacion: jest.fn(),
    crearMensajeGrupo: jest.fn(),
    obtenerHistorialGrupo: jest.fn(),
    agregarMencion: jest.fn(),
    obtenerMencionesMensaje: jest.fn(),
    obtenerMencionesPendientes: jest.fn(),
    agregarReaccion: jest.fn(),
    removerReaccion: jest.fn(),
    obtenerReaccionesMensaje: jest.fn(),
};

jest.mock('../src/models/mensaje.model', () => ({ MensajeModel: mensajeModelMock }));

import { PrismaMensajeRepository } from '../src/modules/messages/infrastructure/prisma-mensaje.repository';

const repo = new PrismaMensajeRepository();

describe('PrismaMensajeRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('create delega en MensajeModel.crear', async () => {
        mensajeModelMock.crear.mockResolvedValue({ id: 'm-1' });
        const result = await repo.create({ contenido: 'Hola', emisorId: 'u1', receptorId: 'u2' });
        expect(result).toEqual({ id: 'm-1' });
    });

    it('getConversation delega en MensajeModel.obtenerConversacion', async () => {
        mensajeModelMock.obtenerConversacion.mockResolvedValue([]);
        const result = await repo.getConversation('u1', 'u2', 50);
        expect(result).toEqual([]);
    });

    it('createGroupMessage delega en MensajeModel.crearMensajeGrupo', async () => {
        mensajeModelMock.crearMensajeGrupo.mockResolvedValue({ id: 'gm-1' });
        const result = await repo.createGroupMessage({ contenido: 'Hola', grupoId: 'g-1', emisorId: 'u1' });
        expect(result).toEqual({ id: 'gm-1' });
    });

    it('getGroupHistory delega en MensajeModel.obtenerHistorialGrupo', async () => {
        mensajeModelMock.obtenerHistorialGrupo.mockResolvedValue([]);
        const result = await repo.getGroupHistory('g-1', 20);
        expect(result).toEqual([]);
    });

    it('addMencion delega en MensajeModel.agregarMencion', async () => {
        mensajeModelMock.agregarMencion.mockResolvedValue({ id: 'men-1' });
        const result = await repo.addMencion({ mensajeId: 'm-1', usuarioMencionadoId: 'u2' }, false);
        expect(result).toEqual({ id: 'men-1' });
    });

    it('getMencionesByMensaje delega en MensajeModel.obtenerMencionesMensaje', async () => {
        mensajeModelMock.obtenerMencionesMensaje.mockResolvedValue([]);
        const result = await repo.getMencionesByMensaje('m-1', false);
        expect(result).toEqual([]);
    });

    it('getMencionesPendientes delega en MensajeModel.obtenerMencionesPendientes', async () => {
        mensajeModelMock.obtenerMencionesPendientes.mockResolvedValue([]);
        const result = await repo.getMencionesPendientes('u2');
        expect(result).toEqual([]);
    });

    it('addReaccion delega en MensajeModel.agregarReaccion', async () => {
        mensajeModelMock.agregarReaccion.mockResolvedValue({ id: 'r-1' });
        const result = await repo.addReaccion({ mensajeId: 'm-1', usuarioId: 'u2', emoji: '👍' }, false);
        expect(result).toEqual({ id: 'r-1' });
    });

    it('removeReaccion delega en MensajeModel.removerReaccion', async () => {
        mensajeModelMock.removerReaccion.mockResolvedValue({ id: 'r-1' });
        const result = await repo.removeReaccion('m-1', 'u2', '👍', false);
        expect(result).toEqual({ id: 'r-1' });
    });

    it('getReaccionesByMensaje delega en MensajeModel.obtenerReaccionesMensaje', async () => {
        mensajeModelMock.obtenerReaccionesMensaje.mockResolvedValue([]);
        const result = await repo.getReaccionesByMensaje('m-1', false);
        expect(result).toEqual([]);
    });
});
