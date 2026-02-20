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

    // Buscar usuarios por materia excluyendo IDs específicos
    static async buscarPorMateriaExcluyendo(materia: string, usuarioActualId: string, idsExcluidos: string[]) {
        const usuarios = await prisma.usuario.findMany({
            where: {
                materiasCursando: {
                    has: materia
                },
                id: {
                    notIn: [usuarioActualId, ...idsExcluidos]
                }
            }
        });

        return usuarios.map((usuario) => ({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            carrera: usuario.carrera,
            semestre: usuario.semestre,
            materiasCursando: usuario.materiasCursando
        }));
    }

    // Obtener usuario por ID sin exponer contraseña
    static async obtenerPorIdSeguro(id: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuario) return null;

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
    }

    // Actualizar usuario (carrera, semestre, materias)
    static async actualizar(id: string, data: {
        carrera?: string;
        semestre?: number;
        materiasCursando?: string[];
    }) {
        const updateData: Record<string, unknown> = {};

        if (data.carrera !== undefined) updateData.carrera = data.carrera;
        if (data.semestre !== undefined) updateData.semestre = data.semestre;
        if (data.materiasCursando !== undefined) updateData.materiasCursando = data.materiasCursando;

        return prisma.usuario.update({
            where: { id },
            data: updateData
        });
    }
}