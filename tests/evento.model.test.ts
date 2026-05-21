import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    evento: {
        create: jest.fn() as any,
        findMany: jest.fn() as any,
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { EventoModel } from '../src/models/evento.model';

describe('EventoModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea un evento', async () => {
            const input = {
                titulo: 'Hackathon',
                descripcion: 'Evento de programacion',
                lugar: 'Auditorio',
                fechaEvento: new Date('2025-12-01'),
                categoria: 'academico',
                creadorId: 'user-1',
            };
            const expected = { id: 'ev-1', ...input, createdAt: new Date(), creador: {} as any };
            prismaMock.evento.create.mockResolvedValue(expected);
            const result = await EventoModel.crear(input);
            expect(result).toEqual(expected);
            expect(prismaMock.evento.create).toHaveBeenCalledWith({ data: input });
        });
    });

    describe('listarGlobalNoVencidos', () => {
        it('retorna eventos futuros', async () => {
            const expected = [{ id: 'ev-1', titulo: 'Taller', creador: {} as any }];
            prismaMock.evento.findMany.mockResolvedValue(expected);
            const result = await EventoModel.listarGlobalNoVencidos();
            expect(result).toEqual(expected);
            expect(prismaMock.evento.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { fechaEvento: { gte: expect.any(Date) } },
                    orderBy: { fechaEvento: 'asc' },
                }),
            );
        });
    });

    describe('listarPorCategoria', () => {
        it('filtra eventos por categoría no vencidos', async () => {
            prismaMock.evento.findMany.mockResolvedValue([]);
            const result = await EventoModel.listarPorCategoria('academico');
            expect(result).toEqual([]);
            expect(prismaMock.evento.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { categoria: 'academico', fechaEvento: { gte: expect.any(Date) } },
                }),
            );
        });
    });
});
