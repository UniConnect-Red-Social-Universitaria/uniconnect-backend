import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    materia: {
        create: jest.fn() as any,
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

import { MateriaModel } from '../src/models/materia.model';

describe('MateriaModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea una materia y retorna el resultado', async () => {
            const expected = { id: 'mat-1', nombre: 'Matematicas', createdAt: new Date() };
            prismaMock.materia.create.mockResolvedValue(expected);
            const result = await MateriaModel.crear('Matematicas');
            expect(result).toEqual(expected);
            expect(prismaMock.materia.create).toHaveBeenCalledWith({ data: { nombre: 'Matematicas' } });
        });
    });

    describe('buscarPorId', () => {
        it('retorna la materia si existe', async () => {
            const expected = { id: 'mat-1', nombre: 'Fisica' };
            prismaMock.materia.findUnique.mockResolvedValue(expected);
            const result = await MateriaModel.buscarPorId('mat-1');
            expect(result).toEqual(expected);
        });

        it('retorna null si no existe', async () => {
            prismaMock.materia.findUnique.mockResolvedValue(null);
            const result = await MateriaModel.buscarPorId('no-existe');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorNombre', () => {
        it('retorna la materia por nombre exacto', async () => {
            const expected = { id: 'mat-1', nombre: 'Calculo' };
            prismaMock.materia.findUnique.mockResolvedValue(expected);
            const result = await MateriaModel.buscarPorNombre('Calculo');
            expect(result).toEqual(expected);
            expect(prismaMock.materia.findUnique).toHaveBeenCalledWith({ where: { nombre: 'Calculo' } });
        });
    });

    describe('listarTodas', () => {
        it('retorna todas las materias ordenadas por nombre', async () => {
            const expected = [
                { id: 'mat-1', nombre: 'Calculo' },
                { id: 'mat-2', nombre: 'Algebra' },
            ];
            prismaMock.materia.findMany.mockResolvedValue(expected);
            const result = await MateriaModel.listarTodas();
            expect(result).toEqual(expected);
            expect(prismaMock.materia.findMany).toHaveBeenCalledWith({ orderBy: { nombre: 'asc' } });
        });
    });

    describe('buscarPorTexto', () => {
        it('filtra materias cuyo nombre contiene el texto normalizado', async () => {
            prismaMock.materia.findMany.mockResolvedValue([
                { id: 'mat-1', nombre: 'Programación' },
                { id: 'mat-2', nombre: 'Matematicas' },
                { id: 'mat-3', nombre: 'Fisica' },
            ]);
            const result = await MateriaModel.buscarPorTexto('program');
            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Programación');

            const result2 = await MateriaModel.buscarPorTexto('MAT');
            expect(result2).toHaveLength(1);
            expect(result2[0].nombre).toBe('Matematicas');
        });

        it('retorna vacío si no hay coincidencias', async () => {
            prismaMock.materia.findMany.mockResolvedValue([
                { id: 'mat-1', nombre: 'Calculo' },
            ]);
            const result = await MateriaModel.buscarPorTexto('Zzz');
            expect(result).toHaveLength(0);
        });
    });

    describe('contar', () => {
        it('retorna el conteo de materias', async () => {
            prismaMock.materia.count.mockResolvedValue(10);
            const result = await MateriaModel.contar();
            expect(result).toBe(10);
        });
    });

    describe('crearCatalogo', () => {
        it('retorna count 0 si el array está vacío', async () => {
            const result = await MateriaModel.crearCatalogo([]);
            expect(result).toEqual({ count: 0 });
        });

        it('retorna count 0 si todos los nombres están vacíos', async () => {
            const result = await MateriaModel.crearCatalogo(['  ', '']);
            expect(result).toEqual({ count: 0 });
        });

        it('filtra nombres existentes y solo crea los nuevos', async () => {
            prismaMock.materia.findMany.mockResolvedValue([
                { nombre: 'Calculo' },
            ]);
            prismaMock.materia.createMany.mockResolvedValue({ count: 2 });

            const result = await MateriaModel.crearCatalogo(['Calculo', 'Algebra', 'Fisica']);
            expect(result).toEqual({ count: 2 });
            expect(prismaMock.materia.createMany).toHaveBeenCalledWith({
                data: [{ nombre: 'Algebra' }, { nombre: 'Fisica' }],
            });
        });

        it('retorna count 0 si todas las materias ya existen', async () => {
            prismaMock.materia.findMany.mockResolvedValue([
                { nombre: 'Calculo' },
                { nombre: 'Algebra' },
            ]);

            const result = await MateriaModel.crearCatalogo(['Calculo', 'Algebra']);
            expect(result).toEqual({ count: 0 });
            expect(prismaMock.materia.createMany).not.toHaveBeenCalled();
        });

        it('normaliza nombres con trim', async () => {
            prismaMock.materia.findMany.mockResolvedValue([]);
            prismaMock.materia.createMany.mockResolvedValue({ count: 1 });

            await MateriaModel.crearCatalogo(['  Fisica  ']);
            expect(prismaMock.materia.createMany).toHaveBeenCalledWith({
                data: [{ nombre: 'Fisica' }],
            });
        });
    });
});
