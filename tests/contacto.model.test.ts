import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock = {
    contacto: {
        findFirst: jest.fn() as any,
        findUnique: jest.fn() as any,
        create: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        findMany: jest.fn() as any,
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { ContactoModel } from '../src/models/contacto.model';

describe('ContactoModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('existeRelacionEntreUsuarios', () => {
        it('retorna la relación si existe entre A->B', async () => {
            const rel = { estado: 'PENDIENTE' };
            prismaMock.contacto.findFirst.mockResolvedValue(rel);
            const result = await ContactoModel.existeRelacionEntreUsuarios('user-a', 'user-b');
            expect(result).toBe(rel);
            expect(prismaMock.contacto.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { solicitanteId: 'user-a', receptorId: 'user-b' },
                        { solicitanteId: 'user-b', receptorId: 'user-a' },
                    ],
                },
            });
        });

        it('retorna null si no existe relación', async () => {
            prismaMock.contacto.findFirst.mockResolvedValue(null);
            const result = await ContactoModel.existeRelacionEntreUsuarios('user-a', 'user-c');
            expect(result).toBeNull();
        });
    });

    describe('crearSolicitud', () => {
        it('crea una solicitud con estado PENDIENTE', async () => {
            const expected = {
                id: 'sol-1',
                estado: 'PENDIENTE',
                solicitanteId: 'user-a',
                receptorId: 'user-b',
                createdAt: new Date(),
            };
            prismaMock.contacto.create.mockResolvedValue(expected);
            const result = await ContactoModel.crearSolicitud('user-a', 'user-b');
            expect(result).toEqual(expected);
            expect(prismaMock.contacto.create).toHaveBeenCalledWith({
                data: { solicitanteId: 'user-a', receptorId: 'user-b', estado: 'PENDIENTE' },
            });
        });
    });

    describe('obtenerIdsRelacionados', () => {
        it('retorna IDs únicos de contactos excluyendo el propio', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                { solicitanteId: 'user-a', receptorId: 'user-b' },
                { solicitanteId: 'user-c', receptorId: 'user-a' },
                { solicitanteId: 'user-a', receptorId: 'user-d' },
            ]);
            const result = await ContactoModel.obtenerIdsRelacionados('user-a');
            expect(result.sort()).toEqual(['user-b', 'user-c', 'user-d']);
        });

        it('retorna array vacío si no hay relaciones', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([]);
            const result = await ContactoModel.obtenerIdsRelacionados('user-a');
            expect(result).toEqual([]);
        });

        it('maneja IDs vacíos', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                { solicitanteId: 'user-a', receptorId: '' },
                { solicitanteId: '', receptorId: 'user-a' },
            ]);
            const result = await ContactoModel.obtenerIdsRelacionados('user-a');
            expect(result).toEqual([]);
        });
    });

    describe('listarCompanerosAceptados', () => {
        const baseUsuario = { id: 'user-x', nombre: 'X', apellido: 'X', correo: 'x@x.com', carrera: 'Ing', semestre: 3, materiasCursando: [] };

        it('retorna contactos aceptados como compañeros', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                {
                    id: 'c-1',
                    estado: 'ACEPTADA',
                    solicitanteId: 'user-a',
                    receptorId: 'user-b',
                    solicitante: { ...baseUsuario, id: 'user-a', nombre: 'A' },
                    receptor: { ...baseUsuario, id: 'user-b', nombre: 'B' },
                },
            ]);
            const result = await ContactoModel.listarCompanerosAceptados('user-a');
            expect(result).toHaveLength(1);
            expect(result[0].usuario.nombre).toBe('B');
        });

        it('identifica correctamente al compañero cuando el usuario es receptor', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                {
                    id: 'c-2',
                    estado: 'ACEPTADA',
                    solicitanteId: 'user-b',
                    receptorId: 'user-a',
                    solicitante: { ...baseUsuario, id: 'user-b', nombre: 'B' },
                    receptor: { ...baseUsuario, id: 'user-a', nombre: 'A' },
                },
            ]);
            const result = await ContactoModel.listarCompanerosAceptados('user-a');
            expect(result[0].usuario.nombre).toBe('B');
        });

        it('filtra contactos sin solicitante o sin receptor', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                {
                    id: 'c-3',
                    estado: 'ACEPTADA',
                    solicitanteId: 'user-a',
                    receptorId: 'user-b',
                    solicitante: null as any,
                    receptor: { ...baseUsuario, id: 'user-b' },
                },
            ]);
            const result = await ContactoModel.listarCompanerosAceptados('user-a');
            expect(result).toHaveLength(0);
        });
    });

    describe('listarSolicitudesRecibidas', () => {
        const baseUsuario = { id: 'user-x', nombre: 'X', apellido: 'X', correo: 'x@x.com', carrera: 'Ing', semestre: 3, materiasCursando: [] };

        it('retorna solicitudes PENDIENTE recibidas', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                {
                    id: 'sol-1',
                    estado: 'PENDIENTE',
                    createdAt: new Date(),
                    solicitante: { ...baseUsuario, id: 'user-b', nombre: 'B' },
                },
            ]);
            const result = await ContactoModel.listarSolicitudesRecibidas('user-a');
            expect(result).toHaveLength(1);
            expect(result[0].solicitante.nombre).toBe('B');
        });

        it('filtra solicitudes sin solicitante', async () => {
            prismaMock.contacto.findMany.mockResolvedValue([
                {
                    id: 'sol-2',
                    estado: 'PENDIENTE',
                    createdAt: new Date(),
                    solicitante: null as any,
                },
            ]);
            const result = await ContactoModel.listarSolicitudesRecibidas('user-a');
            expect(result).toHaveLength(0);
        });
    });

    describe('aceptarSolicitud', () => {
        it('acepta una solicitud pendiente', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'PENDIENTE',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            prismaMock.contacto.update.mockResolvedValue({ id: 'sol-1', estado: 'ACEPTADA' } as any);

            const result = await ContactoModel.aceptarSolicitud('sol-1', 'user-a');
            expect(prismaMock.contacto.update).toHaveBeenCalledWith({
                where: { id: 'sol-1' },
                data: { estado: 'ACEPTADA' },
            });
        });

        it('lanza error si la solicitud no existe', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue(null);
            await expect(ContactoModel.aceptarSolicitud('no-existe', 'user-a')).rejects.toThrow('Solicitud no encontrada');
        });

        it('lanza error si el usuario no es el receptor', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'PENDIENTE',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            await expect(ContactoModel.aceptarSolicitud('sol-1', 'user-b')).rejects.toThrow('No tienes permiso');
        });

        it('lanza error si la solicitud ya fue procesada', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'ACEPTADA',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            await expect(ContactoModel.aceptarSolicitud('sol-1', 'user-a')).rejects.toThrow('ya fue procesada');
        });
    });

    describe('rechazarSolicitud', () => {
        it('rechaza (elimina) una solicitud pendiente', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'PENDIENTE',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            prismaMock.contacto.delete.mockResolvedValue({} as any);

            await ContactoModel.rechazarSolicitud('sol-1', 'user-a');
            expect(prismaMock.contacto.delete).toHaveBeenCalledWith({ where: { id: 'sol-1' } });
        });

        it('lanza error si la solicitud no existe', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue(null);
            await expect(ContactoModel.rechazarSolicitud('no-existe', 'user-a')).rejects.toThrow('Solicitud no encontrada');
        });

        it('lanza error si el usuario no es el receptor', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'PENDIENTE',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            await expect(ContactoModel.rechazarSolicitud('sol-1', 'user-c')).rejects.toThrow('No tienes permiso');
        });

        it('lanza error si la solicitud ya fue procesada', async () => {
            prismaMock.contacto.findUnique.mockResolvedValue({
                id: 'sol-1',
                estado: 'RECHAZADA',
                solicitanteId: 'user-b',
                receptorId: 'user-a',
            });
            await expect(ContactoModel.rechazarSolicitud('sol-1', 'user-a')).rejects.toThrow('ya fue procesada');
        });
    });
});
