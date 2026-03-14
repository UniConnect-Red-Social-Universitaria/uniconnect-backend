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
        const mensajes = await mensajeDelegate().findMany({
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
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Return oldest -> newest for UI rendering, but query latest N first.
        return mensajes.reverse();
    }

    static async crearMensajeGrupo(data: { contenido: string; grupoId: string; emisorId: string }) {
        return grupoMensajeDelegate().create({
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

    static async obtenerHistorialGrupo(grupoId: string, limit: number) {
        const mensajes = await grupoMensajeDelegate().findMany({
            where: {
                grupoId
            },
            include: {
                emisor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
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
}
