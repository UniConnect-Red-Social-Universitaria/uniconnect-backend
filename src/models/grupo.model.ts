import prisma from '../lib/prisma';

function grupoDelegate() {
    const prismaDinamico = prisma as unknown as {
        grupo: {
            create: (args: unknown) => Promise<{
                id: string;
                nombre: string;
                materiaId: string;
                creadorId: string;
                createdAt: Date;
                materia: { id: string; nombre: string };
                miembros: Array<{ id: string }>;
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                nombre: string;
                materiaId: string;
                creadorId: string;
                createdAt: Date;
                materia: { id: string; nombre: string };
                miembros: Array<{
                    id: string;
                    usuarioId: string;
                    usuario: {
                        id: string;
                        nombre: string;
                        apellido: string;
                    };
                }>;
            }>>;
            findUnique: (args: unknown) => Promise<{
                id: string;
                nombre: string;
                materiaId?: string;
                creadorId?: string;
                miembros: Array<{ usuarioId: string }>;
            } | null>;
            update: (args: unknown) => Promise<{
                id: string;
                nombre: string;
                creadorId: string;
                miembros: Array<{
                    id: string;
                    usuarioId: string;
                    usuario: {
                        id: string;
                        nombre: string;
                        apellido: string;
                    };
                }>;
            }>;
        };
    };

    return prismaDinamico.grupo;
}

export class GrupoModel {
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
                miembros: {
                    create: {
                        usuarioId: data.creadorId
                    }
                }
            },
            include: {
                materia: true,
                miembros: true
            }
        });
    }

    static async listarPorUsuario(usuarioId: string) {
        return grupoDelegate().findMany({
            where: {
                miembros: {
                    some: {
                        usuarioId
                    }
                }
            },
            include: {
                materia: true,
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async listarTodos() {
        return grupoDelegate().findMany({
            include: {
                materia: true,
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
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
            pertenece: grupo.miembros.length > 0
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
                miembros: {
                    select: {
                        usuarioId: true
                    }
                }
            }
        });
    }

    static async usuarioEsCreador(grupoId: string, usuarioId: string) {
        const grupo = await grupoDelegate().findUnique({
            where: { id: grupoId },
            select: {
                id: true,
                nombre: true,
                creadorId: true,
                miembros: {
                    select: {
                        usuarioId: true
                    }
                }
            }
        });

        return {
            existe: Boolean(grupo),
            esCreador: grupo?.creadorId === usuarioId
        };
    }

    static async agregarMiembro(grupoId: string, usuarioId: string) {
        return grupoDelegate().update({
            where: { id: grupoId },
            data: {
                miembros: {
                    create: {
                        usuarioId
                    }
                }
            },
            include: {
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
            }
        });
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
            include: {
                materia: true,
                miembros: true
            }
        });

        return grupos.find((grupo) => GrupoModel.normalizarTexto(grupo.nombre) === nombreNormalizado);
    }
}
