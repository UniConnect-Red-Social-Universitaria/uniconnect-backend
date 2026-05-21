import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const prismaMock: Record<string, any> = {
    usuario: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    grupo: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    contacto: {
        deleteMany: jest.fn(),
    },
    mensaje: {
        deleteMany: jest.fn(),
    },
    grupoMensaje: {
        deleteMany: jest.fn(),
    },
    grupoArchivo: {
        deleteMany: jest.fn(),
    },
    evento: {
        deleteMany: jest.fn(),
    },
    usuarioGrupo: {
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

import { UsuarioModel } from '../src/models/usuario.model';

const mockUsuario = (overrides = {}) => ({
    id: 'user-1',
    nombre: 'Juan',
    apellido: 'Perez',
    correo: 'juan@test.com',
    carrera: 'Ingenieria',
    semestre: 3,
    materiasCursando: ['Calculo', 'Fisica'],
    correoVerificado: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contrasenaHash: 'hash123',
    ...overrides,
});

describe('UsuarioModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        it('crea un usuario con todos los campos', async () => {
            const data = {
                nombre: 'Juan',
                apellido: 'Perez',
                correo: 'juan@test.com',
                contrasenaHash: 'hash123',
                carrera: 'Ingenieria',
                semestre: 3,
                materiasCursando: ['Calculo'],
                correoVerificado: false,
            };
            const expected = mockUsuario(data);
            prismaMock.usuario.create.mockResolvedValue(expected);
            const result = await UsuarioModel.crear(data);
            expect(result).toEqual(expected);
            expect(prismaMock.usuario.create).toHaveBeenCalledWith({ data });
        });
    });

    describe('buscarPorCorreo', () => {
        it('retorna el usuario si existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(mockUsuario());
            const result = await UsuarioModel.buscarPorCorreo('juan@test.com');
            expect(result).toBeDefined();
        });

        it('retorna null si no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            const result = await UsuarioModel.buscarPorCorreo('no@existe.com');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorCorreoConContrasena', () => {
        it('retorna usuario con contrasenaHash', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(mockUsuario());
            const result = await UsuarioModel.buscarPorCorreoConContrasena('juan@test.com');
            expect(result).not.toBeNull();
            expect((result as any).contrasenaHash).toBe('hash123');
        });

        it('retorna null si no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            const result = await UsuarioModel.buscarPorCorreoConContrasena('no@existe.com');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorId', () => {
        it('retorna usuario por ID', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(mockUsuario());
            const result = await UsuarioModel.buscarPorId('user-1');
            expect(result).toBeDefined();
        });
    });

    describe('obtenerTodos', () => {
        it('retorna todos los usuarios mapeados con tipos seguros', async () => {
            const userData = mockUsuario({ semestre: 3, correoVerificado: true });
            prismaMock.usuario.findMany.mockResolvedValue([userData]);
            const result = await UsuarioModel.obtenerTodos();
            expect(result).toHaveLength(1);
            expect(result[0].semestre).toBe(3);
            expect(result[0].correoVerificado).toBe(true);
            expect(result[0].materiasCursando).toEqual(['Calculo', 'Fisica']);
        });

        it('maneja valores undefined/null en semestre, correoVerificado y materiasCursando', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([mockUsuario({
                semestre: undefined,
                correoVerificado: undefined,
                materiasCursando: undefined,
            })]);
            const result = await UsuarioModel.obtenerTodos();
            expect(result[0].semestre).toBeNull();
            expect(result[0].correoVerificado).toBe(false);
            expect(result[0].materiasCursando).toEqual([]);
        });
    });

    describe('buscarPorMateriaExcluyendo', () => {
        it('filtra usuarios por materia normalizada excluyendo IDs', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', materiasCursando: ['Programacion Avanzada'] }),
                mockUsuario({ id: 'user-3', materiasCursando: ['Calculo'] }),
            ]);
            const result = await UsuarioModel.buscarPorMateriaExcluyendo('programacion', 'user-1', ['user-4']);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('user-2');
        });

        it('retorna vacío si ningún usuario tiene la materia', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', materiasCursando: ['Arte'] }),
            ]);
            const result = await UsuarioModel.buscarPorMateriaExcluyendo('Calculo', 'user-1', []);
            expect(result).toHaveLength(0);
        });

        it('maneja users con materiasCursando como null', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', materiasCursando: null as any }),
            ]);
            const result = await UsuarioModel.buscarPorMateriaExcluyendo('Calculo', 'user-1', []);
            expect(result).toHaveLength(0);
        });
    });

    describe('buscarPorTexto', () => {
        it('busca por nombre', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', nombre: 'Maria', apellido: 'Lopez', correo: 'maria@test.com' }),
                mockUsuario({ id: 'user-3', nombre: 'Pedro', apellido: 'Martinez', correo: 'pedro@test.com' }),
            ]);
            const result = await UsuarioModel.buscarPorTexto('lopez', 'user-1');
            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Maria');
        });

        it('coincide por apellido', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', nombre: 'Pedro', apellido: 'Martinez' }),
            ]);
            const result = await UsuarioModel.buscarPorTexto('martinez', 'user-1');
            expect(result).toHaveLength(1);
        });

        it('coincide por correo', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                mockUsuario({ id: 'user-2', correo: 'jose@test.com' }),
            ]);
            const result = await UsuarioModel.buscarPorTexto('jose@', 'user-1');
            expect(result).toHaveLength(1);
        });

        it('excluye al usuario actual via prisma query', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([]);
            const result = await UsuarioModel.buscarPorTexto('juan', 'user-1');
            expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: { not: 'user-1' } } })
            );
            expect(result).toHaveLength(0);
        });
    });

    describe('obtenerPorIdSeguro', () => {
        it('retorna usuario sin exponer contrasenaHash', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(mockUsuario({ semestre: 5, correoVerificado: true }));
            const result = await UsuarioModel.obtenerPorIdSeguro('user-1');
            expect(result).toBeDefined();
            expect(result!.semestre).toBe(5);
            expect(result!.correoVerificado).toBe(true);
            expect((result as any).contrasenaHash).toBeUndefined();
        });

        it('retorna null si no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            const result = await UsuarioModel.obtenerPorIdSeguro('no-existe');
            expect(result).toBeNull();
        });

        it('maneja valores faltantes con defaults', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(mockUsuario({
                semestre: undefined,
                correoVerificado: undefined,
                materiasCursando: undefined,
            }));
            const result = await UsuarioModel.obtenerPorIdSeguro('user-1');
            expect(result!.semestre).toBeNull();
            expect(result!.correoVerificado).toBe(false);
            expect(result!.materiasCursando).toEqual([]);
        });
    });

    describe('actualizar', () => {
        it('actualiza solo los campos proporcionados', async () => {
            prismaMock.usuario.update.mockResolvedValue(mockUsuario({ semestre: 5 }));
            await UsuarioModel.actualizar('user-1', { semestre: 5 });
            expect(prismaMock.usuario.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { semestre: 5 },
            });
        });

        it('actualiza múltiples campos', async () => {
            prismaMock.usuario.update.mockResolvedValue(mockUsuario());
            await UsuarioModel.actualizar('user-1', { carrera: 'Medicina', semestre: 5, materiasCursando: ['Biologia'] });
            expect(prismaMock.usuario.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { carrera: 'Medicina', semestre: 5, materiasCursando: ['Biologia'] },
            });
        });

        it('ignora campos undefined', async () => {
            prismaMock.usuario.update.mockResolvedValue(mockUsuario());
            await UsuarioModel.actualizar('user-1', {});
            expect(prismaMock.usuario.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {},
            });
        });
    });

    describe('eliminar', () => {
        it('elimina usuario con transferencia de admin y limpieza de datos', async () => {
            prismaMock.grupo.findMany.mockResolvedValue([
                {
                    id: 'grupo-1',
                    nombre: 'Grupo A',
                    administradorId: 'user-1',
                    creadorId: 'user-1',
                    miembros: [
                        { usuarioId: 'user-1' },
                        { usuarioId: 'user-2' },
                    ],
                },
            ]);
            prismaMock.contacto.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.mensaje.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.grupoMensaje.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.grupoArchivo.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.evento.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.usuarioGrupo.deleteMany.mockResolvedValue({ count: 0 });
            prismaMock.usuario.delete.mockResolvedValue({ id: 'user-1' });
            prismaMock.grupo.update.mockResolvedValue({ id: 'grupo-1' });

            const result = await UsuarioModel.eliminar('user-1');
            expect(result).toEqual({ id: 'user-1' });
            expect(prismaMock.grupo.update).toHaveBeenCalledWith({
                where: { id: 'grupo-1' },
                data: { administradorId: 'user-2', creadorId: 'user-2' },
            });
        });

        it('lanza error si hay grupos sin reemplazo viable', async () => {
            prismaMock.grupo.findMany.mockResolvedValue([
                {
                    id: 'grupo-1',
                    nombre: 'Grupo A',
                    administradorId: 'user-1',
                    creadorId: 'user-1',
                    miembros: [{ usuarioId: 'user-1' }],
                },
            ]);
            await expect(UsuarioModel.eliminar('user-1')).rejects.toThrow('No se puede eliminar');
        });
    });
});
