import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    preferenciaCanal: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
};

const prismaHandler: any = new Proxy(prismaMock, {
    get(target, prop) {
        if (prop in target) return target[prop as string];
        return undefined;
    },
});

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaHandler,
}));

import { PrismaPreferenciaRepository } from '../src/modules/notifications/infrastructure/prisma-preferencia.repository';

const repo = new PrismaPreferenciaRepository();

describe('PrismaPreferenciaRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('obtenerPreferencias', () => {
        it('retorna preferencia existente', async () => {
            prismaMock.preferenciaCanal.findUnique.mockResolvedValue({
                usuarioId: 'u-1', tipoEvento: 'mensaje', canalesActivos: ['in-app', 'email'],
            });
            const result = await repo.obtenerPreferencias('u-1', 'mensaje');
            expect(result.canalesActivos).toEqual(['in-app', 'email']);
        });

        it('retorna canales default si no existe preferencia', async () => {
            prismaMock.preferenciaCanal.findUnique.mockResolvedValue(null);
            const result = await repo.obtenerPreferencias('u-1', 'mensaje');
            expect(result.canalesActivos).toContain('in-app');
        });
    });

    describe('actualizarPreferencias', () => {
        it('hace upsert de preferencias', async () => {
            prismaMock.preferenciaCanal.upsert.mockResolvedValue({
                usuarioId: 'u-1', tipoEvento: 'mensaje', canalesActivos: ['in-app'],
            });
            const result = await repo.actualizarPreferencias('u-1', 'mensaje', ['in-app']);
            expect(result.canalesActivos).toEqual(['in-app']);
            expect(prismaMock.preferenciaCanal.upsert).toHaveBeenCalledWith({
                where: { usuarioId_tipoEvento: { usuarioId: 'u-1', tipoEvento: 'mensaje' } },
                update: { canalesActivos: ['in-app'] },
                create: { usuarioId: 'u-1', tipoEvento: 'mensaje', canalesActivos: ['in-app'] },
            });
        });
    });
});
