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
        };
    };

    return prismaDinamico.grupo;
}

export class GrupoModel {
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
}
