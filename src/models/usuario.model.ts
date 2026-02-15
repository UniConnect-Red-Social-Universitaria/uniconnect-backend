import prisma from '../lib/prisma';

export class UsuarioModel {
    // Crear un usuario
    static async crear(data: {
        nombre: string;
        apellido: string;
        correo: string;
        carrera?: string;
    }) {
        return prisma.usuario.create({
            data
        });
    }

    // Buscar por correo
    static async buscarPorCorreo(correo: string) {
        return prisma.usuario.findUnique({
            where: { correo }
        });
    }

    // Buscar por ID
    static async buscarPorId(id: string) {
        return prisma.usuario.findUnique({
            where: { id }
        });
    }

    // Obtener todos los usuarios
    static async obtenerTodos() {
        return prisma.usuario.findMany();
    }
}