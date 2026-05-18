import prisma from '../lib/prisma';

function mensajeDelegate() {
    const prismaDinamico = prisma as unknown as {
        mensaje: {
            create: (args: unknown) => Promise<{
                id: string;
                contenido: string;
                emisorId: string;
                receptorId: string;
                createdAt: Date;
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                contenido: string;
                emisorId: string;
                receptorId: string;
                createdAt: Date;
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>>;
        };
        grupoMensaje: {
            create: (args: unknown) => Promise<{
                id: string;
                contenido: string;
                grupoId: string;
                emisorId: string;
                createdAt: Date;
                grupo?: {
                    nombre: string;
                };
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                contenido: string;
                grupoId: string;
                emisorId: string;
                createdAt: Date;
                grupo?: {
                    nombre: string;
                };
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>>;
        };
    };

    return prismaDinamico.mensaje;
}

function grupoMensajeDelegate() {
    const prismaDinamico = prisma as unknown as {
        grupoMensaje: {
            create: (args: unknown) => Promise<{
                id: string;
                contenido: string;
                grupoId: string;
                emisorId: string;
                createdAt: Date;
                grupo?: {
                    nombre: string;
                };
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                contenido: string;
                grupoId: string;
                emisorId: string;
                createdAt: Date;
                grupo?: {
                    nombre: string;
                };
                emisor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>>;
        };
    };

    return prismaDinamico.grupoMensaje;
}

export class MensajeModel {
    static async crear(data: { contenido: string; emisorId: string; receptorId: string }) {
        return mensajeDelegate().create({
            data,
            include: {
                emisor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    }

    static async obtenerConversacion(usuarioAId: string, usuarioBId: string, limit: number) {
        const prismaDinamico = prisma as any;
        const mensajes = await prismaDinamico.mensaje.findMany({
            where: {
                OR: [
                    {
                        emisorId: usuarioAId,
                        receptorId: usuarioBId
                    },
                    {
                        emisorId: usuarioBId,
                        receptorId: usuarioAId
                    }
                ]
            },
            include: {
                emisor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                },
                reacciones: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                menciones: {
                    include: {
                        usuarioMencionado: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                correo: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Return oldest -> newest for UI rendering, but query latest N first.
        return mensajes.reverse();
    }

    static async crearMensajeGrupo(data: { contenido: string; grupoId: string; emisorId: string }) {
        const mensaje = await grupoMensajeDelegate().create({
            data,
            include: {
                grupo: {
                    select: {
                        nombre: true
                    }
                },
                emisor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });

        return {
            ...mensaje,
            nombreGrupo: mensaje.grupo?.nombre
        };
    }

    static async obtenerHistorialGrupo(grupoId: string, limit: number) {
        const prismaDinamico = prisma as any;
        const mensajes = await prismaDinamico.grupoMensaje.findMany({
            where: {
                grupoId
            },
            include: {
                grupo: {
                    select: {
                        nombre: true
                    }
                },
                emisor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                },
                reacciones: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                menciones: {
                    include: {
                        usuarioMencionado: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                correo: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Return oldest -> newest for UI rendering, but query latest N first.
        return mensajes.reverse().map((mensaje: any) => ({
            ...mensaje,
            nombreGrupo: mensaje.grupo?.nombre
        }));
    }

    // ==================== MENCIONES ====================

    static async agregarMencion(
        data: { mensajeId: string; usuarioMencionadoId: string },
        esGrupo: boolean
    ) {
        const tabla = esGrupo ? 'mencionMensajeGrupo' : 'mencionMensaje';
        const prismaDinamico = prisma as any;

        return prismaDinamico[tabla].create({
            data,
            include: {
                usuarioMencionado: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            }
        });
    }

    static async obtenerMencionesMensaje(mensajeId: string, esGrupo: boolean) {
        const tabla = esGrupo ? 'mencionMensajeGrupo' : 'mencionMensaje';
        const prismaDinamico = prisma as any;

        return prismaDinamico[tabla].findMany({
            where: { mensajeId },
            include: {
                usuarioMencionado: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    static async obtenerMencionesPendientes(usuarioId: string) {
        const prismaDinamico = prisma as any;

        // Obtener menciones en mensajes individuales
        const mencionesIndividuales = await prismaDinamico.mencionMensaje.findMany({
            where: { usuarioMencionadoId: usuarioId },
            include: {
                mensaje: {
                    include: {
                        emisor: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                usuarioMencionado: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Obtener menciones en mensajes de grupo
        const mencionesGrupo = await prismaDinamico.mencionMensajeGrupo.findMany({
            where: { usuarioMencionadoId: usuarioId },
            include: {
                mensaje: {
                    include: {
                        grupo: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        },
                        emisor: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                },
                usuarioMencionado: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return [...mencionesIndividuales, ...mencionesGrupo];
    }

    // ==================== REACCIONES ====================

    static async agregarReaccion(
        data: { mensajeId: string; usuarioId: string; emoji: string },
        esGrupo: boolean
    ) {
        const tabla = esGrupo ? 'reaccionMensajeGrupo' : 'reaccionMensaje';
        const prismaDinamico = prisma as any;

        return prismaDinamico[tabla].upsert({
            where: {
                mensajeId_usuarioId_emoji: {
                    mensajeId: data.mensajeId,
                    usuarioId: data.usuarioId,
                    emoji: data.emoji
                }
            },
            create: data,
            update: {}, // Si ya existe, no hacer nada (la reacción ya estaba)
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                },
                mensaje: true
            }
        });
    }

    static async removerReaccion(
        mensajeId: string,
        usuarioId: string,
        emoji: string,
        esGrupo: boolean
    ): Promise<any> {
        const tabla = esGrupo ? 'reaccionMensajeGrupo' : 'reaccionMensaje';
        const prismaDinamico = prisma as any;

        const reaccion = await prismaDinamico[tabla].findFirst({
            where: {
                mensajeId,
                usuarioId,
                emoji
            },
            include: {
                mensaje: true
            }
        });

        if (reaccion) {
            await prismaDinamico[tabla].deleteMany({
                where: {
                    mensajeId,
                    usuarioId,
                    emoji
                }
            });
        }

        return reaccion;
    }

    static async obtenerReaccionesMensaje(mensajeId: string, esGrupo: boolean) {
        const tabla = esGrupo ? 'reaccionMensajeGrupo' : 'reaccionMensaje';
        const prismaDinamico = prisma as any;

        const reacciones = await prismaDinamico[tabla].findMany({
            where: { mensajeId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Agrupar reacciones por emoji y contar usuarios
        const reaccionesAgrupadas = new Map<
            string,
            {
                emoji: string;
                count: number;
                usuarios: Array<{ id: string; nombre: string; apellido: string }>;
            }
        >();

        for (const reaccion of reacciones) {
            const key = reaccion.emoji;
            if (!reaccionesAgrupadas.has(key)) {
                reaccionesAgrupadas.set(key, {
                    emoji: reaccion.emoji,
                    count: 0,
                    usuarios: []
                });
            }
            const grupo = reaccionesAgrupadas.get(key)!;
            grupo.count++;
            if (grupo.usuarios.length < 3) {
                // Mostrar máximo 3 usuarios por emoji
                grupo.usuarios.push(reaccion.usuario);
            }
        }

        return Array.from(reaccionesAgrupadas.values());
    }
}
