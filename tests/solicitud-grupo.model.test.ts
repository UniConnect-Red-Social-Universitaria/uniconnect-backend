import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock: Record<string, any> = {
    solicitudGrupo: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
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

import { SolicitudGrupoModel } from '../src/models/solicitud-grupo.model';

describe('SolicitudGrupoModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea solicitud con tipo INGRESO por defecto', async () => {
            const expected = { id: 'sol-1', solicitanteId: 'user-1', grupoId: 'grupo-1', tipo: 'INGRESO', solicitante: {} as any, grupo: {} as any };
            prismaMock.solicitudGrupo.create.mockResolvedValue(expected);
            const result = await SolicitudGrupoModel.crear('user-1', 'grupo-1');
            expect(result).toEqual(expected);
            expect(prismaMock.solicitudGrupo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { solicitanteId: 'user-1', grupoId: 'grupo-1', tipo: 'INGRESO' },
                }),
            );
        });

        it('crea solicitud con tipo INVITACION', async () => {
            prismaMock.solicitudGrupo.create.mockResolvedValue({} as any);
            await SolicitudGrupoModel.crear('user-1', 'grupo-1', 'INVITACION');
            expect(prismaMock.solicitudGrupo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { solicitanteId: 'user-1', grupoId: 'grupo-1', tipo: 'INVITACION' },
                }),
            );
        });
    });

    describe('buscarPendiente', () => {
        it('busca solicitud pendiente', async () => {
            prismaMock.solicitudGrupo.findFirst.mockResolvedValue({ id: 'sol-1' });
            const result = await SolicitudGrupoModel.buscarPendiente('user-1', 'grupo-1');
            expect(result).toBeDefined();
            expect(prismaMock.solicitudGrupo.findFirst).toHaveBeenCalledWith({
                where: { solicitanteId: 'user-1', grupoId: 'grupo-1', tipo: 'INGRESO', estado: 'PENDIENTE' },
            });
        });

        it('retorna null si no hay pendiente', async () => {
            prismaMock.solicitudGrupo.findFirst.mockResolvedValue(null);
            const result = await SolicitudGrupoModel.buscarPendiente('user-1', 'grupo-1');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorId', () => {
        it('retorna solicitud con include', async () => {
            const expected = { id: 'sol-1', solicitante: { id: 'user-1' }, grupo: { id: 'grupo-1', materia: { id: 'm-1', nombre: 'Calculo' } } };
            prismaMock.solicitudGrupo.findUnique.mockResolvedValue(expected);
            const result = await SolicitudGrupoModel.buscarPorId('sol-1');
            expect(result).toEqual(expected);
        });
    });

    describe('listarPorGrupo', () => {
        it('retorna solicitudes PENDIENTE tipo INGRESO de un grupo', async () => {
            const expected = [{ id: 'sol-1', solicitante: { id: 'user-2', nombre: 'Ana' } }];
            prismaMock.solicitudGrupo.findMany.mockResolvedValue(expected);
            const result = await SolicitudGrupoModel.listarPorGrupo('grupo-1');
            expect(result).toEqual(expected);
            expect(prismaMock.solicitudGrupo.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { grupoId: 'grupo-1', tipo: 'INGRESO', estado: 'PENDIENTE' },
                }),
            );
        });
    });

    describe('listarPorUsuario', () => {
        it('retorna invitaciones del usuario', async () => {
            const expected = [{ id: 'sol-1', grupo: { id: 'grupo-1', nombre: 'G1', materia: { id: 'm-1', nombre: 'Calc' } } }];
            prismaMock.solicitudGrupo.findMany.mockResolvedValue(expected);
            const result = await SolicitudGrupoModel.listarPorUsuario('user-1');
            expect(result).toEqual(expected);
            expect(prismaMock.solicitudGrupo.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { solicitanteId: 'user-1', tipo: 'INVITACION' },
                }),
            );
        });
    });

    describe('aprobar', () => {
        it('actualiza estado a APROBADA', async () => {
            const expected = { id: 'sol-1', estado: 'APROBADA', solicitante: {}, grupo: {} };
            prismaMock.solicitudGrupo.update.mockResolvedValue(expected as any);
            const result = await SolicitudGrupoModel.aprobar('sol-1');
            expect(result).toEqual(expected);
            expect(prismaMock.solicitudGrupo.update).toHaveBeenCalledWith({
                where: { id: 'sol-1' },
                data: { estado: 'APROBADA' },
                include: expect.any(Object),
            });
        });
    });

    describe('rechazar', () => {
        it('actualiza estado a RECHAZADA', async () => {
            prismaMock.solicitudGrupo.update.mockResolvedValue({} as any);
            await SolicitudGrupoModel.rechazar('sol-1');
            expect(prismaMock.solicitudGrupo.update).toHaveBeenCalledWith({
                where: { id: 'sol-1' },
                data: { estado: 'RECHAZADA' },
                include: expect.any(Object),
            });
        });
    });

    describe('eliminarRechazada', () => {
        it('elimina solicitudes RECHAZADAS previas', async () => {
            prismaMock.solicitudGrupo.deleteMany.mockResolvedValue({ count: 1 });
            await SolicitudGrupoModel.eliminarRechazada('user-1', 'grupo-1');
            expect(prismaMock.solicitudGrupo.deleteMany).toHaveBeenCalledWith({
                where: { solicitanteId: 'user-1', grupoId: 'grupo-1', tipo: 'INGRESO', estado: 'RECHAZADA' },
            });
        });
    });
});
