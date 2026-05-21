import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock: Record<string, any> = {
    foroPregunta: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    foroRespuesta: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    foroVoto: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
};

const prismaHandler: any = new Proxy(prismaMock, {
    get(target, prop) { if (prop in target) return target[prop as string]; return undefined; },
});

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaHandler,
}));

import { PrismaForoRepository } from '../src/modules/foro/infrastructure/prisma-foro.repository';

const repo = new PrismaForoRepository();

const mockPregunta = (overrides = {}) => ({
    id: 'p-1', titulo: 'Duda', contenido: 'Ayuda', cerrada: false,
    autorId: 'u-1', autor: { nombre: 'Juan', apellido: 'Perez' },
    materiaId: 'm-1', createdAt: new Date(), ...overrides,
});

const mockRespuesta = (overrides = {}) => ({
    id: 'r-1', contenido: 'Resp', autorId: 'u-2',
    autor: { nombre: 'Ana', apellido: 'L' }, preguntaId: 'p-1',
    puntuacion: 0, createdAt: new Date(), ...overrides,
});

describe('PrismaForoRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('crearPregunta', () => {
        it('crea y mapea pregunta', async () => {
            prismaMock.foroPregunta.create.mockResolvedValue(mockPregunta());
            const result = await repo.crearPregunta({ titulo: 'Duda', contenido: 'Ayuda', autorId: 'u-1', materiaId: 'm-1' });
            expect(result.titulo).toBe('Duda');
            expect(result.autorNombre).toBe('Juan Perez');
        });
    });

    describe('crearRespuesta', () => {
        it('crea y mapea respuesta', async () => {
            prismaMock.foroRespuesta.create.mockResolvedValue(mockRespuesta());
            const result = await repo.crearRespuesta({ contenido: 'Resp', autorId: 'u-2', preguntaId: 'p-1', materiaId: 'm-1' });
            expect(result.contenido).toBe('Resp');
            expect(result.autorNombre).toBe('Ana L');
        });
    });

    describe('registrarVoto', () => {
        it('crea nuevo voto y suma puntuacion', async () => {
            prismaMock.foroVoto.findUnique.mockResolvedValue(null);
            prismaMock.foroVoto.create.mockResolvedValue({});
            prismaMock.foroRespuesta.update.mockResolvedValue(mockRespuesta({ puntuacion: 1 }));
            const result = await repo.registrarVoto('u-3', 'r-1', 1);
            expect(result.puntuacion).toBe(1);
        });

        it('no cambia puntuacion si voto con mismo valor existe', async () => {
            prismaMock.foroVoto.findUnique.mockResolvedValue({ valor: 1 });
            prismaMock.foroRespuesta.findUnique.mockResolvedValue(mockRespuesta({ puntuacion: 0 }));
            const result = await repo.registrarVoto('u-2', 'r-1', 1);
            expect(result.puntuacion).toBe(0);
        });

        it('cambia voto si valor es diferente (duplica diferencia)', async () => {
            prismaMock.foroVoto.findUnique.mockResolvedValue({ valor: -1 });
            prismaMock.foroVoto.update.mockResolvedValue({});
            prismaMock.foroRespuesta.update.mockResolvedValue(mockRespuesta({ puntuacion: 2 }));
            const result = await repo.registrarVoto('u-2', 'r-1', 1);
            expect(result.puntuacion).toBe(2);
            expect(prismaMock.foroRespuesta.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { puntuacion: { increment: 2 } } })
            );
        });
    });

    describe('obtenerPreguntasPorMateria', () => {
        it('retorna preguntas mapeadas', async () => {
            prismaMock.foroPregunta.findMany.mockResolvedValue([mockPregunta()]);
            const result = await repo.obtenerPreguntasPorMateria('m-1');
            expect(result).toHaveLength(1);
        });
    });

    describe('obtenerRespuestasPorPregunta', () => {
        it('retorna respuestas sin votos de usuario si no hay usuarioId', async () => {
            prismaMock.foroRespuesta.findMany.mockResolvedValue([mockRespuesta()]);
            const result = await repo.obtenerRespuestasPorPregunta('p-1');
            expect(result).toHaveLength(1);
        });

        it('incluye miVoto si usuarioId se proporciona', async () => {
            prismaMock.foroRespuesta.findMany.mockResolvedValue([mockRespuesta()]);
            prismaMock.foroVoto.findMany.mockResolvedValue([{ respuestaId: 'r-1', valor: 1 }]);
            const result = await repo.obtenerRespuestasPorPregunta('p-1', 'u-3');
            expect(result[0].miVoto).toBe(1);
        });
    });

    describe('cerrarPregunta', () => {
        it('marca pregunta como cerrada', async () => {
            prismaMock.foroPregunta.update.mockResolvedValue(mockPregunta({ cerrada: true }));
            const result = await repo.cerrarPregunta('p-1');
            expect(result.cerrada).toBe(true);
        });
    });

    describe('obtenerPreguntaPorId', () => {
        it('retorna pregunta si existe', async () => {
            prismaMock.foroPregunta.findUnique.mockResolvedValue(mockPregunta());
            const result = await repo.obtenerPreguntaPorId('p-1');
            expect(result).toBeDefined();
        });

        it('retorna null si no existe', async () => {
            prismaMock.foroPregunta.findUnique.mockResolvedValue(null);
            const result = await repo.obtenerPreguntaPorId('no-existe');
            expect(result).toBeNull();
        });
    });
});
