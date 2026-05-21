import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const usuarioModelMock = {
    crear: jest.fn(),
    buscarPorCorreo: jest.fn(),
    buscarPorCorreoConContrasena: jest.fn(),
    buscarPorId: jest.fn(),
    obtenerPorIdSeguro: jest.fn(),
    obtenerTodos: jest.fn(),
    buscarPorMateriaExcluyendo: jest.fn(),
    buscarPorTexto: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
};

jest.mock('../src/models/usuario.model', () => ({ UsuarioModel: usuarioModelMock }));

import { PrismaUserRepository } from '../src/modules/users/infrastructure/prisma-user.repository';

const repo = new PrismaUserRepository();

const mockUsuario = (overrides = {}) => ({
    id: 'u-1', nombre: 'Juan', apellido: 'Perez', correo: 'juan@t.com',
    carrera: 'Ing', semestre: 3, materiasCursando: ['Calc'], correoVerificado: true,
    contrasenaHash: 'hash', createdAt: new Date(), updatedAt: new Date(), ...overrides,
});

describe('PrismaUserRepository', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('create: crea usuario y retorna id + createdAt', async () => {
        const created = { id: 'u-1', createdAt: new Date() };
        usuarioModelMock.crear.mockResolvedValue(created);
        const result = await repo.create({ nombre: 'J', apellido: 'P', correo: 'j@t.com', contrasenaHash: 'h', carrera: 'I', semestre: 3, materiasCursando: [], correoVerificado: false });
        expect(result).toEqual({ id: 'u-1', createdAt: created.createdAt });
    });

    it('findByEmail: retorna id si existe', async () => {
        usuarioModelMock.buscarPorCorreo.mockResolvedValue({ id: 'u-1' });
        const result = await repo.findByEmail('j@t.com');
        expect(result).toEqual({ id: 'u-1' });
    });

    it('findByEmail: retorna null si no existe', async () => {
        usuarioModelMock.buscarPorCorreo.mockResolvedValue(null);
        const result = await repo.findByEmail('no@t.com');
        expect(result).toBeNull();
    });

    it('findByEmailWithPassword: retorna datos completos', async () => {
        usuarioModelMock.buscarPorCorreoConContrasena.mockResolvedValue(mockUsuario());
        const result = await repo.findByEmailWithPassword('j@t.com');
        expect(result).not.toBeNull();
        expect(result!.nombre).toBe('Juan');
        expect(result!.contrasenaHash).toBe('hash');
    });

    it('findByEmailWithPassword: retorna null si no existe', async () => {
        usuarioModelMock.buscarPorCorreoConContrasena.mockResolvedValue(null);
        const result = await repo.findByEmailWithPassword('no@t.com');
        expect(result).toBeNull();
    });

    it('findByEmailWithPassword: maneja semestre null/undefined', async () => {
        usuarioModelMock.buscarPorCorreoConContrasena.mockResolvedValue(mockUsuario({ semestre: null }));
        const result = await repo.findByEmailWithPassword('j@t.com');
        expect(result!.semestre).toBeNull();
    });

    it('findByEmailWithPassword: maneja materiasCursando null', async () => {
        usuarioModelMock.buscarPorCorreoConContrasena.mockResolvedValue(mockUsuario({ materiasCursando: null }));
        const result = await repo.findByEmailWithPassword('j@t.com');
        expect(result!.materiasCursando).toEqual([]);
    });

    it('findById: retorna id si existe', async () => {
        usuarioModelMock.buscarPorId.mockResolvedValue({ id: 'u-1' });
        const result = await repo.findById('u-1');
        expect(result).toEqual({ id: 'u-1' });
    });

    it('findById: retorna null si no existe', async () => {
        usuarioModelMock.buscarPorId.mockResolvedValue(null);
        const result = await repo.findById('no-existe');
        expect(result).toBeNull();
    });

    it('findSafeById: delega en obtenerPorIdSeguro', async () => {
        usuarioModelMock.obtenerPorIdSeguro.mockResolvedValue({ id: 'u-1' } as any);
        const result = await repo.findSafeById('u-1');
        expect(result).toEqual({ id: 'u-1' });
    });

    it('listAll: delega en obtenerTodos', async () => {
        usuarioModelMock.obtenerTodos.mockResolvedValue([]);
        const result = await repo.listAll();
        expect(result).toEqual([]);
    });

    it('searchByMateriaExcluding: delega', async () => {
        usuarioModelMock.buscarPorMateriaExcluyendo.mockResolvedValue([]);
        const result = await repo.searchByMateriaExcluding('Calc', 'u-1', ['u-2']);
        expect(result).toEqual([]);
    });

    it('searchByText: delega', async () => {
        usuarioModelMock.buscarPorTexto.mockResolvedValue([]);
        const result = await repo.searchByText('juan', 'u-1');
        expect(result).toEqual([]);
    });

    it('updateProfile: actualiza y mapea', async () => {
        usuarioModelMock.actualizar.mockResolvedValue(mockUsuario({ semestre: 5 }));
        const result = await repo.updateProfile('u-1', { semestre: 5 });
        expect(result.semestre).toBe(5);
    });

    it('updateProfile: maneja semestre null', async () => {
        usuarioModelMock.actualizar.mockResolvedValue(mockUsuario({ semestre: null }));
        const result = await repo.updateProfile('u-1', {});
        expect(result.semestre).toBeNull();
    });

    it('delete: elimina usuario', async () => {
        usuarioModelMock.eliminar.mockResolvedValue({} as any);
        await repo.delete('u-1');
        expect(usuarioModelMock.eliminar).toHaveBeenCalledWith('u-1');
    });

    it('obtenerEmailPorId: retorna email', async () => {
        usuarioModelMock.obtenerPorIdSeguro.mockResolvedValue({ correo: 'j@t.com' } as any);
        const result = await repo.obtenerEmailPorId('u-1');
        expect(result).toBe('j@t.com');
    });

    it('obtenerEmailPorId: retorna null si no existe', async () => {
        usuarioModelMock.obtenerPorIdSeguro.mockResolvedValue(null);
        const result = await repo.obtenerEmailPorId('no-existe');
        expect(result).toBeNull();
    });
});
