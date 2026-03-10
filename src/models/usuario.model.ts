import prisma from '../lib/prisma';

export class UsuarioModel {
    private static normalizarTexto(texto: string) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // Crear un usuario registrado
    static async crear(data: {
        nombre: string;
        apellido: string;
        correo: string;
        contrasenaHash: string;
        carrera: string;
        carreraId?: string;
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
        const materiaNormalizada = UsuarioModel.normalizarTexto(materia).replace(/[%_]/g, '');

        // Obtener todos los usuarios excluyendo IDs
        const usuarios = await prisma.usuario.findMany({
            where: {
                id: {
                    notIn: [usuarioActualId, ...idsExcluidos]
                }
            }
        });

        // Filtrar manualmente por materia normalizada
        const usuariosFiltrados = usuarios.filter((usuario) => {
            const materias = Array.isArray(usuario.materiasCursando) 
                ? usuario.materiasCursando as string[]
                : [];
            
            return materias.some((mat) => 
                UsuarioModel.normalizarTexto(mat).includes(materiaNormalizada)
            );
        });

        return usuariosFiltrados.map((usuario) => ({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            carrera: usuario.carrera,
            semestre: usuario.semestre,
            materiasCursando: usuario.materiasCursando
        }));
    }

    static async buscarPorTexto(texto: string, usuarioActualId: string) {
        const busquedaNormalizada = UsuarioModel.normalizarTexto(texto);

        const usuarios = await prisma.usuario.findMany({
            where: {
                id: {
                    not: usuarioActualId
                }
            }
        });

        const filtrados = usuarios.filter((usuario) => {
            const nombre = UsuarioModel.normalizarTexto(usuario.nombre ?? '');
            const apellido = UsuarioModel.normalizarTexto(usuario.apellido ?? '');
            const correo = UsuarioModel.normalizarTexto(usuario.correo ?? '');

            return (
                nombre.includes(busquedaNormalizada)
                || apellido.includes(busquedaNormalizada)
                || correo.includes(busquedaNormalizada)
            );
        });

        return filtrados.map((usuario) => ({
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
        carreraId?: string;
        semestre?: number;
        materiasCursando?: string[];
    }) {
        const updateData: Record<string, unknown> = {};

        if (data.carrera !== undefined) updateData.carrera = data.carrera;
        if (data.carreraId !== undefined) updateData.carreraId = data.carreraId;
        if (data.semestre !== undefined) updateData.semestre = data.semestre;
        if (data.materiasCursando !== undefined) updateData.materiasCursando = data.materiasCursando;

        return prisma.usuario.update({
            where: { id },
            data: updateData
        });
    }
    //eliminar usuario sin importar si está autenticado o no
    static async eliminar(id: string) {
        return prisma.usuario.delete({
            where: { id }
        });
    }
}