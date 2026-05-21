import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const materiaModelMock = {
    crear: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    listarTodas: jest.fn(),
    buscarPorTexto: jest.fn(),
    contar: jest.fn(),
    crearCatalogo: jest.fn(),
};

jest.mock('../src/models/materia.model', () => ({ MateriaModel: materiaModelMock }));

import { PrismaMateriaRepository } from '../src/modules/materias/infrastructure/prisma-materia.repository';

const repo = new PrismaMateriaRepository();

describe('PrismaMateriaRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('create', async () => {
        materiaModelMock.crear.mockResolvedValue({ id: 'm-1' });
        const r = await repo.create('Calc');
        expect(r).toEqual({ id: 'm-1' });
    });
    it('findById', async () => {
        materiaModelMock.buscarPorId.mockResolvedValue({ id: 'm-1' });
        expect(await repo.findById('m-1')).toEqual({ id: 'm-1' });
    });
    it('findByName', async () => {
        materiaModelMock.buscarPorNombre.mockResolvedValue({ id: 'm-1' });
        expect(await repo.findByName('Calc')).toEqual({ id: 'm-1' });
    });
    it('listAll', async () => {
        materiaModelMock.listarTodas.mockResolvedValue([]);
        expect(await repo.listAll()).toEqual([]);
    });
    it('searchByText', async () => {
        materiaModelMock.buscarPorTexto.mockResolvedValue([]);
        expect(await repo.searchByText('Calc')).toEqual([]);
    });
    it('count', async () => {
        materiaModelMock.contar.mockResolvedValue(5);
        expect(await repo.count()).toBe(5);
    });
    it('createCatalog', async () => {
        materiaModelMock.crearCatalogo.mockResolvedValue({ count: 2 });
        expect(await repo.createCatalog(['A', 'B'])).toEqual({ count: 2 });
    });
});
