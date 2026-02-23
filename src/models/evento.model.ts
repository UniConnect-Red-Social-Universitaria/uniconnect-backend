import prisma from '../lib/prisma';

function eventoDelegate() {
    const prismaDinamico = prisma as unknown as {
        evento: {
            create: (args: unknown) => Promise<{
                id: string;
                titulo: string;
                descripcion: string;
                fechaEvento: Date;
                creadorId: string;
                createdAt: Date;
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                titulo: string;
                descripcion: string;
                fechaEvento: Date;
                creadorId: string;
                createdAt: Date;
                creador: {
                    id: string;
                    nombre: string;
                    apellido: string;
                    correo: string;
                };
            }>>;
        };
    };

    return prismaDinamico.evento;
}

export class EventoModel {
    static async crear(data: {
        titulo: string;
        descripcion: string;
        fechaEvento: Date;
        creadorId: string;
    }) {
        return eventoDelegate().create({
            data
        });
    }

    static async listarGlobalNoVencidos() {
        return eventoDelegate().findMany({
            where: {
                fechaEvento: {
                    gte: new Date()
                }
            },
            include: {
                creador: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            },
            orderBy: {
                fechaEvento: 'asc'
            }
        });
    }
}
