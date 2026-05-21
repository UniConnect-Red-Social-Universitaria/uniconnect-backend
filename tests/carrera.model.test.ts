import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    carrera: {
        findUnique: jest.fn() as any,
        findMany: jest.fn() as any,
        createMany: jest.fn() as any,
        count: jest.fn() as any,
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { CarreraModel } from '../src/models/carrera.model';

describe('CarreraModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buscarPorNombre', () => {
        it('retorna carrera por nombre exacto', async () => {
            prismaMock.carrera.findUnique.mockResolvedValue({ id: 'c-1', nombre: 'Ingenieria' });
            const result = await CarreraModel.buscarPorNombre('Ingenieria');
            expect(result).toEqual({ id: 'c-1', nombre: 'Ingenieria' });
        });

        it('retorna null si no existe', async () => {
            prismaMock.carrera.findUnique.mockResolvedValue(null);
            const result = await CarreraModel.buscarPorNombre('NoExiste');
            expect(result).toBeNull();
        });
    });

    describe('listarTodas', () => {
        it('retorna todas las carreras ordenadas', async () => {
            const expected = [{ id: 'c-1', nombre: 'Arquitectura' }];
            prismaMock.carrera.findMany.mockResolvedValue(expected);
            const result = await CarreraModel.listarTodas();
            expect(result).toEqual(expected);
            expect(prismaMock.carrera.findMany).toHaveBeenCalledWith({
                orderBy: { nombre: 'asc' },
                select: { id: true, nombre: true },
            });
        });
    });

    describe('contar', () => {
        it('retorna el conteo', async () => {
            prismaMock.carrera.count.mockResolvedValue(5);
            const result = await CarreraModel.contar();
            expect(result).toBe(5);
        });
    });

    describe('crearCatalogo', () => {
        it('retorna count 0 si el array está vacío', async () => {
            const result = await CarreraModel.crearCatalogo([]);
            expect(result).toEqual({ count: 0 });
        });

        it('retorna count 0 si todos los nombres están vacíos', async () => {
            const result = await CarreraModel.crearCatalogo(['', '  ']);
            expect(result).toEqual({ count: 0 });
        });

        it('filtra existentes y crea nuevos', async () => {
            prismaMock.carrera.findMany.mockResolvedValue([{ nombre: 'Medicina' }]);
            prismaMock.carrera.createMany.mockResolvedValue({ count: 2 });
            const result = await CarreraModel.crearCatalogo(['Medicina', 'Derecho', 'Arquitectura']);
            expect(result).toEqual({ count: 2 });
            expect(prismaMock.carrera.createMany).toHaveBeenCalledWith({
                data: [{ nombre: 'Derecho' }, { nombre: 'Arquitectura' }],
            });
        });

        it('retorna count 0 si todas ya existen', async () => {
            prismaMock.carrera.findMany.mockResolvedValue([{ nombre: 'Medicina' }]);
            const result = await CarreraModel.crearCatalogo(['Medicina']);
            expect(result).toEqual({ count: 0 });
        });
    });
});
