import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    grupoArchivo: {
        create: jest.fn() as any,
        findMany: jest.fn() as any,
        findUnique: jest.fn() as any,
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { GrupoArchivoModel } from '../src/models/grupo-archivo.model';

describe('GrupoArchivoModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea un archivo con include del subidor', async () => {
            const input = {
                nombre: 'tarea.pdf',
                nombreFisico: 'uuid-tarea.pdf',
                ruta: '/uploads/uuid-tarea.pdf',
                mimeType: 'application/pdf',
                tamanoBytes: 1024,
                grupoId: 'grupo-1',
                subidoPorId: 'user-1',
            };
            const expected = { id: 'f-1', ...input, subidoPor: { id: 'user-1', nombre: 'Juan', apellido: 'P' } };
            prismaMock.grupoArchivo.create.mockResolvedValue(expected);
            const result = await GrupoArchivoModel.crear(input);
            expect(result).toEqual(expected);
            expect(prismaMock.grupoArchivo.create).toHaveBeenCalledWith({
                data: input,
                include: { subidoPor: { select: { id: true, nombre: true, apellido: true } } },
            });
        });
    });

    describe('listarPorGrupo', () => {
        it('retorna archivos del grupo ordenados por fecha descendente', async () => {
            const expected = [{ id: 'f-1', nombre: 'doc.pdf' }];
            prismaMock.grupoArchivo.findMany.mockResolvedValue(expected);
            const result = await GrupoArchivoModel.listarPorGrupo('grupo-1');
            expect(result).toEqual(expected);
            expect(prismaMock.grupoArchivo.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { grupoId: 'grupo-1' },
                    orderBy: { createdAt: 'desc' },
                }),
            );
        });
    });

    describe('buscarPorId', () => {
        it('retorna archivo por ID', async () => {
            const expected = { id: 'f-1', nombre: 'doc.pdf' };
            prismaMock.grupoArchivo.findUnique.mockResolvedValue(expected);
            const result = await GrupoArchivoModel.buscarPorId('f-1');
            expect(result).toEqual(expected);
        });

        it('retorna null si no existe', async () => {
            prismaMock.grupoArchivo.findUnique.mockResolvedValue(null);
            const result = await GrupoArchivoModel.buscarPorId('no-existe');
            expect(result).toBeNull();
        });
    });
});
