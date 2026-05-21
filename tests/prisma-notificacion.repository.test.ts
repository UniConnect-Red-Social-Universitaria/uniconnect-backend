import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    notificacion: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { PrismaNotificacionRepository } from '../src/modules/notifications/infrastructure/prisma-notificacion.repository';

const repo = new PrismaNotificacionRepository();

describe('PrismaNotificacionRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('crear: crea notificacion con referenciaId null si no se provee', async () => {
        prismaMock.notificacion.create.mockResolvedValue({ id: 'n-1' });
        const result = await repo.crear({ usuarioId: 'u-1', tipo: 'mensaje', titulo: 'Hola', mensaje: 'Mensaje' });
        expect(result).toEqual({ id: 'n-1' });
        expect(prismaMock.notificacion.create).toHaveBeenCalledWith({
            data: { usuarioId: 'u-1', tipo: 'mensaje', titulo: 'Hola', mensaje: 'Mensaje', referenciaId: null },
        });
    });

    it('crear: incluye referenciaId si se provee', async () => {
        prismaMock.notificacion.create.mockResolvedValue({ id: 'n-1' });
        await repo.crear({ usuarioId: 'u-1', tipo: 'mensaje', titulo: 'Hola', mensaje: 'Mensaje', referenciaId: 'ref-1' });
        expect(prismaMock.notificacion.create).toHaveBeenCalledWith({
            data: { usuarioId: 'u-1', tipo: 'mensaje', titulo: 'Hola', mensaje: 'Mensaje', referenciaId: 'ref-1' },
        });
    });

    it('listarPorUsuario: lista sin filtro de leidas', async () => {
        prismaMock.notificacion.findMany.mockResolvedValue([]);
        const result = await repo.listarPorUsuario('u-1');
        expect(result).toEqual([]);
        expect(prismaMock.notificacion.findMany).toHaveBeenCalledWith({
            where: { usuarioId: 'u-1' },
            orderBy: { createdAt: 'desc' },
        });
    });

    it('listarPorUsuario: filtra solo no leidas si se pide', async () => {
        prismaMock.notificacion.findMany.mockResolvedValue([]);
        await repo.listarPorUsuario('u-1', true);
        expect(prismaMock.notificacion.findMany).toHaveBeenCalledWith({
            where: { usuarioId: 'u-1', leida: false },
            orderBy: { createdAt: 'desc' },
        });
    });

    it('marcarComoLeida: actualiza notificacion', async () => {
        prismaMock.notificacion.update.mockResolvedValue({} as any);
        await repo.marcarComoLeida('n-1');
        expect(prismaMock.notificacion.update).toHaveBeenCalledWith({
            where: { id: 'n-1' },
            data: { leida: true },
        });
    });

    it('marcarTodasComoLeidas: actualiza todas las del usuario', async () => {
        prismaMock.notificacion.updateMany.mockResolvedValue({ count: 3 } as any);
        await repo.marcarTodasComoLeidas('u-1');
        expect(prismaMock.notificacion.updateMany).toHaveBeenCalledWith({
            where: { usuarioId: 'u-1', leida: false },
            data: { leida: true },
        });
    });

    it('contarNoLeidas: retorna conteo', async () => {
        prismaMock.notificacion.count.mockResolvedValue(5);
        const result = await repo.contarNoLeidas('u-1');
        expect(result).toBe(5);
    });

    it('eliminar: elimina notificacion por id', async () => {
        prismaMock.notificacion.delete.mockResolvedValue({} as any);
        await repo.eliminar('n-1');
        expect(prismaMock.notificacion.delete).toHaveBeenCalledWith({ where: { id: 'n-1' } });
    });
});
