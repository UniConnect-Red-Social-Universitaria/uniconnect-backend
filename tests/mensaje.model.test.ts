import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock: Record<string, any> = {
    mensaje: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    grupoMensaje: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    mencionMensaje: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    mencionMensajeGrupo: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    reaccionMensaje: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
    },
    reaccionMensajeGrupo: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
    },
};

// This wrapper allows `prisma as any` to access dynamic properties like prisma[tabla]
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

import { MensajeModel } from '../src/models/mensaje.model';

const mockEmisor = { id: 'user-1', nombre: 'Juan', apellido: 'Perez' };
const mockMensaje = {
    id: 'msg-1',
    contenido: 'Hola',
    emisorId: 'user-1',
    receptorId: 'user-2',
    createdAt: new Date(),
    emisor: mockEmisor,
};
const mockGrupoMensaje = {
    id: 'gmsg-1',
    contenido: 'Hola grupo',
    grupoId: 'grupo-1',
    emisorId: 'user-1',
    createdAt: new Date(),
    grupo: { nombre: 'Grupo Test' },
    emisor: mockEmisor,
};

describe('MensajeModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea un mensaje directo con include del emisor', async () => {
            prismaMock.mensaje.create.mockResolvedValue(mockMensaje);
            const result = await MensajeModel.crear({ contenido: 'Hola', emisorId: 'user-1', receptorId: 'user-2' });
            expect(result).toEqual(mockMensaje);
            expect(prismaMock.mensaje.create).toHaveBeenCalledWith({
                data: { contenido: 'Hola', emisorId: 'user-1', receptorId: 'user-2' },
                include: { emisor: { select: { id: true, nombre: true, apellido: true } } },
            });
        });
    });

    describe('obtenerConversacion', () => {
        it('retorna mensajes entre dos usuarios ordenados del más viejo al más nuevo', async () => {
            const older = { ...mockMensaje, id: 'msg-1', createdAt: new Date('2024-01-01') };
            const newer = { ...mockMensaje, id: 'msg-2', createdAt: new Date('2024-01-02') };
            prismaMock.mensaje.findMany.mockResolvedValue([newer, older]);

            const result = await MensajeModel.obtenerConversacion('user-1', 'user-2', 50);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('msg-1'); // oldest first after reverse
            expect(result[1].id).toBe('msg-2');
            expect(prismaMock.mensaje.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50, orderBy: { createdAt: 'desc' } })
            );
        });
    });

    describe('crearMensajeGrupo', () => {
        it('crea un mensaje de grupo y extrae nombreGrupo', async () => {
            prismaMock.grupoMensaje.create.mockResolvedValue(mockGrupoMensaje);
            const result = await MensajeModel.crearMensajeGrupo({
                contenido: 'Hola grupo',
                grupoId: 'grupo-1',
                emisorId: 'user-1',
            });
            expect(result.nombreGrupo).toBe('Grupo Test');
            expect(result.id).toBe('gmsg-1');
        });
    });

    describe('obtenerHistorialGrupo', () => {
        it('retorna historial de grupo con nombreGrupo y ordenado', async () => {
            prismaMock.grupoMensaje.findMany.mockResolvedValue([mockGrupoMensaje]);
            const result = await MensajeModel.obtenerHistorialGrupo('grupo-1', 20);
            expect(result).toHaveLength(1);
            expect(result[0].nombreGrupo).toBe('Grupo Test');
            expect(prismaMock.grupoMensaje.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { grupoId: 'grupo-1' }, take: 20 })
            );
        });
    });

    describe('agregarMencion', () => {
        it('agrega mención en mensaje individual', async () => {
            const expected = { id: 'men-1', mensajeId: 'msg-1', usuarioMencionadoId: 'user-2', usuarioMencionado: mockEmisor };
            prismaMock.mencionMensaje.create.mockResolvedValue(expected);
            const result = await MensajeModel.agregarMencion({ mensajeId: 'msg-1', usuarioMencionadoId: 'user-2' }, false);
            expect(result).toEqual(expected);
        });

        it('agrega mención en mensaje de grupo', async () => {
            const expected = { id: 'men-2', mensajeId: 'gmsg-1', usuarioMencionadoId: 'user-2', usuarioMencionado: mockEmisor };
            prismaMock.mencionMensajeGrupo.create.mockResolvedValue(expected);
            const result = await MensajeModel.agregarMencion({ mensajeId: 'gmsg-1', usuarioMencionadoId: 'user-2' }, true);
            expect(result).toEqual(expected);
        });
    });

    describe('obtenerMencionesMensaje', () => {
        it('obtiene menciones de mensaje individual', async () => {
            prismaMock.mencionMensaje.findMany.mockResolvedValue([]);
            await MensajeModel.obtenerMencionesMensaje('msg-1', false);
            expect(prismaMock.mencionMensaje.findMany).toHaveBeenCalled();
        });

        it('obtiene menciones de mensaje de grupo', async () => {
            prismaMock.mencionMensajeGrupo.findMany.mockResolvedValue([]);
            await MensajeModel.obtenerMencionesMensaje('gmsg-1', true);
            expect(prismaMock.mencionMensajeGrupo.findMany).toHaveBeenCalled();
        });
    });

    describe('obtenerMencionesPendientes', () => {
        it('combina menciones de ambos tipos', async () => {
            prismaMock.mencionMensaje.findMany.mockResolvedValue([
                { id: 'm1', mensaje: { emisor: mockEmisor }, usuarioMencionado: mockEmisor },
            ]);
            prismaMock.mencionMensajeGrupo.findMany.mockResolvedValue([
                { id: 'm2', mensaje: { grupo: { id: 'g-1', nombre: 'G' }, emisor: mockEmisor }, usuarioMencionado: mockEmisor },
            ]);
            const result = await MensajeModel.obtenerMencionesPendientes('user-2');
            expect(result).toHaveLength(2);
        });
    });

    describe('agregarReaccion', () => {
        it('hace upsert de reacción en mensaje individual', async () => {
            const expected = { id: 'r-1', mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍', usuario: mockEmisor, mensaje: mockMensaje };
            prismaMock.reaccionMensaje.upsert.mockResolvedValue(expected);
            const result = await MensajeModel.agregarReaccion({ mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍' }, false);
            expect(result).toEqual(expected);
            expect(prismaMock.reaccionMensaje.upsert).toHaveBeenCalledWith({
                where: { mensajeId_usuarioId_emoji: { mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍' } },
                create: { mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍' },
                update: {},
                include: expect.any(Object),
            });
        });

        it('hace upsert de reacción en mensaje de grupo', async () => {
            prismaMock.reaccionMensajeGrupo.upsert.mockResolvedValue({});
            await MensajeModel.agregarReaccion({ mensajeId: 'gmsg-1', usuarioId: 'user-2', emoji: '❤️' }, true);
            expect(prismaMock.reaccionMensajeGrupo.upsert).toHaveBeenCalled();
        });
    });

    describe('removerReaccion', () => {
        it('elimina reacción si existe en mensaje individual', async () => {
            const reaccion = { id: 'r-1', mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍', mensaje: mockMensaje };
            prismaMock.reaccionMensaje.findFirst.mockResolvedValue(reaccion);
            prismaMock.reaccionMensaje.deleteMany.mockResolvedValue({ count: 1 });

            const result = await MensajeModel.removerReaccion('msg-1', 'user-2', '👍', false);
            expect(result).toEqual(reaccion);
            expect(prismaMock.reaccionMensaje.deleteMany).toHaveBeenCalledWith({
                where: { mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍' },
            });
        });

        it('retorna null si la reacción no existe', async () => {
            prismaMock.reaccionMensaje.findFirst.mockResolvedValue(null);
            const result = await MensajeModel.removerReaccion('msg-1', 'user-2', '👍', false);
            expect(result).toBeNull();
            expect(prismaMock.reaccionMensaje.deleteMany).not.toHaveBeenCalled();
        });

        it('usa la tabla de grupo cuando esGrupo=true', async () => {
            prismaMock.reaccionMensajeGrupo.findFirst.mockResolvedValue(null);
            await MensajeModel.removerReaccion('gmsg-1', 'user-2', '👍', true);
            expect(prismaMock.reaccionMensajeGrupo.findFirst).toHaveBeenCalled();
        });
    });

    describe('obtenerReaccionesMensaje', () => {
        it('agrupa reacciones por emoji', async () => {
            const usuario = { id: 'user-2', nombre: 'Ana', apellido: 'Lopez' };
            prismaMock.reaccionMensaje.findMany.mockResolvedValue([
                { emoji: '👍', usuario },
                { emoji: '👍', usuario: { id: 'user-3', nombre: 'Luis', apellido: 'M' } },
                { emoji: '❤️', usuario },
            ]);

            const result = await MensajeModel.obtenerReaccionesMensaje('msg-1', false);
            expect(result).toHaveLength(2);
            const thumbsUp = result.find((r) => r.emoji === '👍')!;
            expect(thumbsUp.count).toBe(2);
            expect(thumbsUp.usuarios).toHaveLength(2);
            const heart = result.find((r) => r.emoji === '❤️')!;
            expect(heart.count).toBe(1);
        });

        it('limita a 3 usuarios por emoji', async () => {
            const usuario = { id: 'u', nombre: 'N', apellido: 'A' };
            const muchosUsuarios = Array.from({ length: 5 }, (_, i) => ({
                emoji: '👍',
                usuario: { ...usuario, id: `user-${i}` },
            }));
            prismaMock.reaccionMensaje.findMany.mockResolvedValue(muchosUsuarios);

            const result = await MensajeModel.obtenerReaccionesMensaje('msg-1', false);
            expect(result[0].usuarios).toHaveLength(3);
            expect(result[0].count).toBe(5);
        });

        it('retorna array vacío si no hay reacciones', async () => {
            prismaMock.reaccionMensaje.findMany.mockResolvedValue([]);
            const result = await MensajeModel.obtenerReaccionesMensaje('msg-1', false);
            expect(result).toEqual([]);
        });
    });
});
