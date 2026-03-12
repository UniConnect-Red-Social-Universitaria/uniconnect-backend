import prisma from '../lib/prisma';

function grupoDelegate() {
    const prismaDinamico = prisma as unknown as {
        grupo: {
            create: (args: unknown) => Promise<any>;
            findMany: (args: unknown) => Promise<any[]>;
            findUnique: (args: unknown) => Promise<any | null>;
            update: (args: unknown) => Promise<any>;
        };
    };

    return prismaDinamico.grupo;
}

export class GrupoModel {
    private static esErrorRelacionUsuarioInconsistente(error: unknown) {
        return error instanceof Error
            && error.message.includes('Field usuario is required to return data, got null instead.');
    }

    private static includeDetalleGrupo() {
        return {
            materia: true,
            administrador: {
                select: {
                    id: true,
                    nombre: true,
                    apellido: true
                }
            },
            miembros: {
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true
                        }
                    }
                }
            }
        };
    }

    private static includeDetalleGrupoFallback() {
        return {
            materia: true,
            administrador: {
                select: {
                    id: true,
                    nombre: true,
                    apellido: true
                }
            },
            miembros: {
                select: {
                    id: true,
                    usuarioId: true
                }
            }
        };
    }

    private static normalizarTexto(texto: string) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    static async crear(data: { nombre: string; materiaId: string; creadorId: string }) {
        return grupoDelegate().create({
            data: {
                nombre: data.nombre,
                materiaId: data.materiaId,
                creadorId: data.creadorId,
                administradorId: data.creadorId,
                estado: 'ACTIVO',
                miembros: {
                    create: {
                        usuarioId: data.creadorId
                    }
                }
            },
            include: GrupoModel.includeDetalleGrupo()
        });
    }

    static async listarPorUsuario(usuarioId: string) {
        try {
            return await grupoDelegate().findMany({
                where: {
                    miembros: {
                        some: {
                            usuarioId
                        }
                    }
                },
                include: GrupoModel.includeDetalleGrupo(),
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            if (!GrupoModel.esErrorRelacionUsuarioInconsistente(error)) {
                throw error;
            }

            // Fallback para registros huérfanos en UsuarioGrupo (usuario eliminado).
            return grupoDelegate().findMany({
                where: {
                    miembros: {
                        some: {
                            usuarioId
                        }
                    }
                },
                include: GrupoModel.includeDetalleGrupoFallback(),
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
    }

    static async listarTodos() {
        try {
            return await grupoDelegate().findMany({
                include: GrupoModel.includeDetalleGrupo(),
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            if (!GrupoModel.esErrorRelacionUsuarioInconsistente(error)) {
                throw error;
            }

            // Fallback para registros huérfanos en UsuarioGrupo (usuario eliminado).
            return grupoDelegate().findMany({
                include: GrupoModel.includeDetalleGrupoFallback(),
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
    }

    static async buscarPorTexto(texto: string) {
        const busquedaNormalizada = GrupoModel.normalizarTexto(texto);
        const grupos = await GrupoModel.listarTodos();

        return grupos.filter((grupo) => {
            const nombreGrupo = GrupoModel.normalizarTexto(grupo.nombre ?? '');
            const nombreMateria = GrupoModel.normalizarTexto(grupo.materia?.nombre ?? '');

            return nombreGrupo.includes(busquedaNormalizada) || nombreMateria.includes(busquedaNormalizada);
        });
    }

    static async obtenerIdsPorUsuario(usuarioId: string) {
        const grupos = await grupoDelegate().findMany({
            where: {
                miembros: {
                    some: {
                        usuarioId
                    }
                }
            },
            select: {
                id: true
            }
        });

        return grupos.map((grupo) => grupo.id);
    }

    static async usuarioPertenece(grupoId: string, usuarioId: string) {
        const grupo = await grupoDelegate().findUnique({
            where: { id: grupoId },
            select: {
                id: true,
                nombre: true,
                estado: true,
                miembros: {
                    where: {
                        usuarioId
                    },
                    select: {
                        usuarioId: true
                    }
                }
            }
        });

        if (!grupo) {
            return { existe: false, pertenece: false };
        }

        return {
            existe: true,
            pertenece: grupo.miembros.length > 0,
            estado: grupo.estado,
            estaCerrado: grupo.estado === 'CERRADO'
        };
    }

    static async obtenerPorId(grupoId: string) {
        return grupoDelegate().findUnique({
            where: { id: grupoId },
            select: {
                id: true,
                nombre: true,
                materiaId: true,
                creadorId: true,
                administradorId: true,
                estado: true,
                miembros: {
                    select: {
                        usuarioId: true
                    }
                }
            }
        });
    }

    static async obtenerDetallePorId(grupoId: string) {
        try {
            return await grupoDelegate().findUnique({
                where: { id: grupoId },
                include: GrupoModel.includeDetalleGrupo()
            });
        } catch (error) {
            if (!GrupoModel.esErrorRelacionUsuarioInconsistente(error)) {
                throw error;
            }

            return grupoDelegate().findUnique({
                where: { id: grupoId },
                include: GrupoModel.includeDetalleGrupoFallback()
            });
        }
    }

    static async agregarMiembro(grupoId: string, usuarioId: string) {
        await grupoDelegate().update({
            where: { id: grupoId },
            data: {
                miembros: {
                    create: {
                        usuarioId
                    }
                }
            }
        });

        return GrupoModel.obtenerDetallePorId(grupoId);
    }

    static async removerMiembro(grupoId: string, usuarioId: string) {
        await prisma.usuarioGrupo.deleteMany({
            where: {
                grupoId,
                usuarioId
            }
        });

        return GrupoModel.obtenerDetallePorId(grupoId);
    }

    static async actualizarAdministrador(grupoId: string, administradorId: string) {
        await grupoDelegate().update({
            where: { id: grupoId },
            data: {
                administradorId
            }
        });

        return GrupoModel.obtenerDetallePorId(grupoId);
    }

    static async cerrar(grupoId: string) {
        await grupoDelegate().update({
            where: { id: grupoId },
            data: {
                estado: 'CERRADO'
            }
        });

        return GrupoModel.obtenerDetallePorId(grupoId);
    }

    static async contarGruposPorMateria(materiaId: string): Promise<number> {
        return prisma.grupo.count({
            where: { materiaId }
        });
    }

    static async buscarPorNombreYMateria(nombre: string, materiaId: string) {
        const nombreNormalizado = GrupoModel.normalizarTexto(nombre);
        const grupos = await grupoDelegate().findMany({
            where: { materiaId },
            include: GrupoModel.includeDetalleGrupoFallback()
        });

        return grupos.find((grupo) => GrupoModel.normalizarTexto(grupo.nombre) === nombreNormalizado);
    }
}
