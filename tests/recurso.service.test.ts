/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';

const prismaMock = {
    recurso: {
        create: jest.fn() as any,
        findMany: jest.fn() as any,
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

jest.mock('../src/utils/open-graph.util', () => ({
    extractOpenGraph: jest.fn(),
    findUrlsInText: jest.fn(),
    getDomain: jest.fn(),
    detectResourceType: jest.fn(),
}));

import { recursoService } from '../src/modules/recursos/recurso.service';
import { extractOpenGraph, findUrlsInText, getDomain, detectResourceType } from '../src/utils/open-graph.util';

const extractOpenGraphMock = extractOpenGraph as jest.MockedFunction<typeof extractOpenGraph>;
const findUrlsInTextMock = findUrlsInText as jest.MockedFunction<typeof findUrlsInText>;
const getDomainMock = getDomain as jest.MockedFunction<typeof getDomain>;
const detectResourceTypeMock = detectResourceType as jest.MockedFunction<typeof detectResourceType>;

describe('RecursoService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('crea recursos con Open Graph y conserva metadata base', async () => {
        const ogData = {
            title: 'Clase de cálculo',
            description: 'Video introductorio',
            image: 'https://example.com/image.png',
            url: 'https://example.com/post',
            siteName: 'Example',
            domain: 'example.com',
            resourceType: 'video' as const,
        };

        findUrlsInTextMock.mockReturnValue(['https://example.com/post']);
        extractOpenGraphMock.mockResolvedValue(ogData as any);
        prismaMock.recurso.create.mockResolvedValue({ id: 'recurso-1' });

        await recursoService.crearRecurso({
            titulo: 'Clase 1',
            contenido: 'https://example.com/post',
            tipo: 'VIDEO',
            metadata: { etiquetas: ['calculo'] },
            grupoId: 'grupo-1',
            creadorId: 'user-1',
        });

        expect(prismaMock.recurso.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    titulo: 'Clase 1',
                    contenido: 'https://example.com/post',
                    tipo: 'VIDEO',
                    grupoId: 'grupo-1',
                    creadorId: 'user-1',
                    metadata: expect.objectContaining({
                        titulo: 'Clase 1',
                        etiquetas: ['calculo'],
                        openGraph: ogData,
                        domain: 'example.com',
                        resourceType: 'video',
                    }),
                }),
            }),
        );
    });

    it('usa fallback de dominio y tipo cuando Open Graph no retorna datos', async () => {
        findUrlsInTextMock.mockReturnValue(['https://github.com/uniconnect/repo']);
        extractOpenGraphMock.mockResolvedValue(null);
        getDomainMock.mockReturnValue('github.com');
        detectResourceTypeMock.mockReturnValue('repo');
        prismaMock.recurso.create.mockResolvedValue({ id: 'recurso-2' });

        await recursoService.crearRecurso({
            titulo: 'Repositorio',
            contenido: 'https://github.com/uniconnect/repo',
            grupoId: 'grupo-1',
            creadorId: 'user-1',
        });

        expect(prismaMock.recurso.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        titulo: 'Repositorio',
                        domain: 'github.com',
                        resourceType: 'repo',
                    }),
                }),
            }),
        );
    });

    it('permite editar al creador aunque no sea administrador', async () => {
        prismaMock.recurso.findUnique.mockResolvedValue({
            id: 'recurso-1',
            titulo: 'Viejo',
            contenido: 'https://example.com/viejo',
            tipo: 'URL',
            metadata: { etiquetas: ['base'] },
            creadorId: 'user-creator',
            grupo: { administradorId: 'user-admin' },
        });
        findUrlsInTextMock.mockReturnValue(['https://example.com/nuevo']);
        extractOpenGraphMock.mockResolvedValue({ domain: 'example.com', resourceType: 'link' } as any);
        prismaMock.recurso.update.mockResolvedValue({ id: 'recurso-1' });

        await recursoService.editarRecurso(
            'recurso-1',
            { titulo: 'Nuevo', contenido: 'https://example.com/nuevo' },
            'user-creator',
        );

        expect(prismaMock.recurso.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'recurso-1' },
                data: expect.objectContaining({
                    titulo: 'Nuevo',
                    metadata: expect.objectContaining({
                        titulo: 'Nuevo',
                        etiquetas: ['base'],
                        openGraph: expect.objectContaining({ domain: 'example.com' }),
                    }),
                }),
            }),
        );
    });

    it('permite editar al administrador del grupo', async () => {
        prismaMock.recurso.findUnique.mockResolvedValue({
            id: 'recurso-1',
            titulo: 'Viejo',
            contenido: 'contenido',
            tipo: 'ARCHIVO',
            metadata: {},
            creadorId: 'user-creator',
            grupo: { administradorId: 'user-admin' },
        });
        prismaMock.recurso.update.mockResolvedValue({ id: 'recurso-1' });

        await recursoService.editarRecurso('recurso-1', { titulo: 'Nuevo' }, 'user-admin');

        expect(prismaMock.recurso.update).toHaveBeenCalled();
    });

    it('rechaza eliminar cuando el usuario no es creador ni administrador', async () => {
        prismaMock.recurso.findUnique.mockResolvedValue({
            id: 'recurso-1',
            titulo: 'Viejo',
            contenido: 'contenido',
            tipo: 'ARCHIVO',
            metadata: {},
            creadorId: 'user-creator',
            grupo: { administradorId: 'user-admin' },
        });

        await expect(recursoService.eliminarRecurso('recurso-1', 'user-other')).rejects.toThrow(
            'No tienes permisos para eliminar este recurso',
        );
    });
});