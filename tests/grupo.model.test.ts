import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock: Record<string, any> = {
    grupo: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
    },
    usuarioGrupo: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
    },
    materia: {
        findMany: jest.fn(),
    },
    usuario: {
        findMany: jest.fn(),
    },
    grupoMensaje: {
        deleteMany: jest.fn(),
    },
    grupoArchivo: {
        deleteMany: jest.fn(),
    },
    solicitudGrupo: {
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

import { GrupoModel } from '../src/models/grupo.model';

const mockMateria = { id: 'mat-1', nombre: 'Calculo' };
const mockMiembro = (id: string, nombre: string) => ({
    id,
    usuarioId: id,
    usuario: { id, nombre, apellido: 'Test' },
});

const mockGrupo = (overrides = {}) => ({
    id: 'grupo-1',
    nombre: 'Grupo Test',
    materiaId: 'mat-1',
    creadorId: 'user-1',
    administradorId: 'user-1',
    candidatoAdminId: null,
    estado: 'ACTIVO',
    createdAt: new Date(),
    materia: mockMateria,
    miembros: [mockMiembro('user-1', 'Juan')],
    ...overrides,
});

describe('GrupoModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea un grupo con el creador como miembro y administrador', async () => {
            const expected = mockGrupo();
            prismaMock.grupo.create.mockResolvedValue(expected);
            const result = await GrupoModel.crear({ nombre: 'Grupo Test', materiaId: 'mat-1', creadorId: 'user-1' });
            expect(result).toEqual(expected);
            expect(prismaMock.grupo.create).toHaveBeenCalledWith({
                data: {
                    nombre: 'Grupo Test',
                    materiaId: 'mat-1',
                    creadorId: 'user-1',
                    administradorId: 'user-1',
                    miembros: { create: { usuarioId: 'user-1' } },
                },
                include: { materia: true, miembros: true },
            });
        });
    });

    describe('listarPorUsuario', () => {
        it('retorna grupos del usuario', async () => {
            prismaMock.grupo.findMany.mockResolvedValue([mockGrupo()]);
            const result = await GrupoModel.listarPorUsuario('user-1');
            expect(result).toHaveLength(1);
            expect(prismaMock.grupo.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { miembros: { some: { usuarioId: 'user-1' } } },
                })
            );
        });
    });

    describe('listarDisponibles', () => {
        it('retorna grupos disponibles filtrando materias y usuarios válidos', async () => {
            prismaMock.grupo.findMany = jest.fn().mockResolvedValue([
                {
                    ...mockGrupo({ id: 'g-1', nombre: 'Grupo A' }),
                    miembros: [
                        { id: 'm1', usuarioId: 'user-2' },
                        { id: 'm2', usuarioId: 'user-3' },
                    ],
                },
            ]);
            prismaMock.usuario.findMany = jest.fn().mockResolvedValue([
                { id: 'user-2', nombre: 'Ana', apellido: 'L' },
                { id: 'user-3', nombre: 'Luis', apellido: 'M' },
            ]);

            const result = await GrupoModel.listarDisponibles(['Calculo'], 'user-1');
            expect(result).toHaveLength(1);
            expect(result[0].miembros[0].usuario.nombre).toBe('Ana');
        });

        it('filtra grupos con miembros inválidos', async () => {
            prismaMock.grupo.findMany = jest.fn().mockResolvedValue([
                {
                    ...mockGrupo({ id: 'g-1' }),
                    miembros: [{ id: 'm1', usuarioId: 'user-desconocido' }],
                },
            ]);
            prismaMock.usuario.findMany = jest.fn().mockResolvedValue([]);

            const result = await GrupoModel.listarDisponibles(['Calculo'], 'user-1');
            expect(result).toHaveLength(0);
        });
    });

    describe('buscarPorId', () => {
        it('retorna el grupo si existe', async () => {
            prismaMock.grupo.findUnique.mockResolvedValue(mockGrupo());
            const result = await GrupoModel.buscarPorId('grupo-1');
            expect(result).toBeDefined();
            expect(result!.id).toBe('grupo-1');
        });

        it('retorna null si no existe', async () => {
            prismaMock.grupo.findUnique.mockResolvedValue(null);
            const result = await GrupoModel.buscarPorId('no-existe');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorTexto', () => {
        it('filtra grupos por nombre o materia normalizada', async () => {
            prismaMock.grupo.findMany = jest.fn().mockResolvedValue([
                { id: 'g-1', nombre: 'Programacion Avanzada', materiaId: 'mat-1', creadorId: 'u1', administradorId: 'u1', candidatoAdminId: null, estado: 'ACTIVO', createdAt: new Date() },
                { id: 'g-2', nombre: 'Fisica Grupo A', materiaId: 'mat-2', creadorId: 'u1', administradorId: 'u1', candidatoAdminId: null, estado: 'ACTIVO', createdAt: new Date() },
            ]);
            prismaMock.materia.findMany = jest.fn().mockResolvedValue([
                { id: 'mat-1', nombre: 'Programacion' },
                { id: 'mat-2', nombre: 'Fisica' },
            ]);

            const result = await GrupoModel.buscarPorTexto('Programacion');
            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Programacion Avanzada');
        });

        it('ignora grupos sin materia coincidente y retorna vacío si no hay match', async () => {
            prismaMock.grupo.findMany = jest.fn().mockResolvedValue([
                { id: 'g-1', nombre: 'X', materiaId: 'mat-x', creadorId: 'u1', administradorId: 'u1', candidatoAdminId: null, estado: 'ACTIVO', createdAt: new Date() },
            ]);
            prismaMock.materia.findMany = jest.fn().mockResolvedValue([]);

            const result = await GrupoModel.buscarPorTexto('X');
            expect(result).toHaveLength(0);
        });

        it('maneja búsqueda con tildes', async () => {
            prismaMock.grupo.findMany = jest.fn().mockResolvedValue([
                { id: 'g-1', nombre: 'Matemáticas', materiaId: 'mat-1', creadorId: 'u1', administradorId: 'u1', candidatoAdminId: null, estado: 'ACTIVO', createdAt: new Date() },
            ]);
            prismaMock.materia.findMany = jest.fn().mockResolvedValue([
                { id: 'mat-1', nombre: 'Matematicas' },
            ]);

            const result = await GrupoModel.buscarPorTexto('matematicas');
            expect(result).toHaveLength(1);
        });
    });

    describe('contarGruposPorMateria', () => {
        it('retorna el conteo', async () => {
            prismaMock.grupo.count.mockResolvedValue(5);
            const result = await GrupoModel.contarGruposPorMateria('mat-1');
            expect(result).toBe(5);
        });
    });

    describe('unirse', () => {
        it('crea un registro usuarioGrupo', async () => {
            const expected = { id: 'ug-1', grupoId: 'grupo-1', usuarioId: 'user-2' };
            prismaMock.usuarioGrupo.create.mockResolvedValue(expected);
            const result = await GrupoModel.unirse('grupo-1', 'user-2');
            expect(result).toEqual(expected);
        });
    });

    describe('buscarPorNombre', () => {
        it('busca grupo por nombre exacto', async () => {
            prismaMock.grupo.findFirst.mockResolvedValue(mockGrupo());
            const result = await GrupoModel.buscarPorNombre('Grupo Test');
            expect(result).toBeDefined();
            expect(prismaMock.grupo.findFirst).toHaveBeenCalledWith({ where: { nombre: 'Grupo Test' } });
        });
    });

    describe('actualizarAdministrador', () => {
        it('actualiza el administrador del grupo', async () => {
            prismaMock.grupo.update.mockResolvedValue({ id: 'grupo-1' });
            await GrupoModel.actualizarAdministrador('grupo-1', 'user-2');
            expect(prismaMock.grupo.update).toHaveBeenCalledWith({
                where: { id: 'grupo-1' },
                data: { administradorId: 'user-2' },
            });
        });
    });

    describe('actualizarEstado', () => {
        it('actualiza el estado del grupo', async () => {
            prismaMock.grupo.update.mockResolvedValue({ id: 'grupo-1' });
            await GrupoModel.actualizarEstado('grupo-1', 'INACTIVO');
            expect(prismaMock.grupo.update).toHaveBeenCalledWith({
                where: { id: 'grupo-1' },
                data: { estado: 'INACTIVO' },
            });
        });
    });

    describe('actualizarCandidatoAdmin', () => {
        it('establece candidatoAdminId', async () => {
            prismaMock.grupo.update.mockResolvedValue({ id: 'grupo-1' });
            await GrupoModel.actualizarCandidatoAdmin('grupo-1', 'user-2');
            expect(prismaMock.grupo.update).toHaveBeenCalledWith({
                where: { id: 'grupo-1' },
                data: { candidatoAdminId: 'user-2' },
            });
        });

        it('limpia candidatoAdminId con null', async () => {
            prismaMock.grupo.update.mockResolvedValue({ id: 'grupo-1' });
            await GrupoModel.actualizarCandidatoAdmin('grupo-1', null);
            expect(prismaMock.grupo.update).toHaveBeenCalledWith({
                where: { id: 'grupo-1' },
                data: { candidatoAdminId: null },
            });
        });
    });

    describe('abandonarGrupo', () => {
        it('elimina el registro usuarioGrupo', async () => {
            prismaMock.usuarioGrupo.deleteMany.mockResolvedValue({ count: 1 });
            await GrupoModel.abandonarGrupo('grupo-1', 'user-2');
            expect(prismaMock.usuarioGrupo.deleteMany).toHaveBeenCalledWith({
                where: { grupoId: 'grupo-1', usuarioId: 'user-2' },
            });
        });
    });

    describe('eliminarGrupo', () => {
        it('elimina dependencias en cascada y luego el grupo', async () => {
            prismaMock.grupoMensaje.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.grupoArchivo.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.solicitudGrupo.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.usuarioGrupo.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.grupo.delete.mockResolvedValue({ id: 'grupo-1' });

            const result = await GrupoModel.eliminarGrupo('grupo-1');
            expect(result).toEqual({ id: 'grupo-1' });
            expect(prismaMock.grupoMensaje.deleteMany).toHaveBeenCalledWith({ where: { grupoId: 'grupo-1' } });
            expect(prismaMock.grupoArchivo.deleteMany).toHaveBeenCalledWith({ where: { grupoId: 'grupo-1' } });
            expect(prismaMock.solicitudGrupo.deleteMany).toHaveBeenCalledWith({ where: { grupoId: 'grupo-1' } });
            expect(prismaMock.usuarioGrupo.deleteMany).toHaveBeenCalledWith({ where: { grupoId: 'grupo-1' } });
            expect(prismaMock.grupo.delete).toHaveBeenCalledWith({ where: { id: 'grupo-1' } });
        });
    });

    describe('obtenerMiembrosDelGrupo', () => {
        it('retorna los IDs de miembros del grupo', async () => {
            prismaMock.usuarioGrupo.findMany.mockResolvedValue([
                { usuarioId: 'user-1' },
                { usuarioId: 'user-2' },
            ]);
            const result = await GrupoModel.obtenerMiembrosDelGrupo('grupo-1');
            expect(result).toHaveLength(2);
            expect(result[0].usuarioId).toBe('user-1');
        });
    });
});
