import prisma from '../lib/prisma';

export class UsuarioModel {
    // Crear un usuario registrado
    static async crear(data: {
        nombre: string;
        apellido: string;
        correo: string;
        contrasenaHash: string;
        carrera: string;
        semestre: number;
        materiasCursando: string[];
        correoVerificado: boolean;
        googleSub?: string;
    }) {
        return prisma.usuario.create({
            data
        });
    }

    // Buscar por correo (con contraseña para login)
    static async buscarPorCorreo(correo: string) {
        return prisma.usuario.findUnique({
            where: { correo }
        });
    }

    // Buscar por correo (retorna todo incluyendo contrasenaHash para validación)
    static async buscarPorCorreoConContrasena(correo: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { correo }
        });
        
        if (!usuario) return null;
        
        return usuario as unknown as Record<string, unknown> & { contrasenaHash: string };
    }

    // Buscar por ID
    static async buscarPorId(id: string) {
        return prisma.usuario.findUnique({
            where: { id }
        });
    }

    // Obtener todos los usuarios
    static async obtenerTodos() {
        const usuarios = await prisma.usuario.findMany();

        return usuarios.map((usuario) => {
            const usuarioDinamico = usuario as unknown as Record<string, unknown>;

            return {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                carrera: usuario.carrera,
                semestre: typeof usuarioDinamico.semestre === 'number' ? usuarioDinamico.semestre : null,
                materiasCursando: Array.isArray(usuarioDinamico.materiasCursando)
                    ? (usuarioDinamico.materiasCursando as string[])
                    : [],
                correoVerificado: typeof usuarioDinamico.correoVerificado === 'boolean'
                    ? usuarioDinamico.correoVerificado
                    : false,
                createdAt: usuario.createdAt,
                updatedAt: usuario.updatedAt
            };
        });
    }
}