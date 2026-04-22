import prisma from '../lib/prisma';

type EventoRow = {
    id: string;
    titulo: string;
    descripcion: string;
    lugar: string | null;
    fechaEvento: Date;
    categoria: string;
    creadorId: string;
    createdAt: Date;
    creador: {
        id: string;
        nombre: string;
        apellido: string;
        correo: string;
    };
};

function eventoDelegate() {
    const prismaDinamico = prisma as unknown as {
        evento: {
            create: (args: unknown) => Promise<EventoRow>;
            findMany: (args: unknown) => Promise<EventoRow[]>;
        };
    };

    return prismaDinamico.evento;
}

export class EventoModel {
    static async crear(data: {
        titulo: string;
        descripcion: string;
        lugar: string;
        fechaEvento: Date;
        categoria: string;
        creadorId: string;
    }) {
        return eventoDelegate().create({ data });
    }

    static async listarGlobalNoVencidos() {
        return eventoDelegate().findMany({
            where: {
                fechaEvento: { gte: new Date() },
            },
            include: {
                creador: {
                    select: { id: true, nombre: true, apellido: true, correo: true },
                },
            },
            orderBy: { fechaEvento: 'asc' },
        });
    }

    static async listarPorCategoria(categoria: string) {
        return eventoDelegate().findMany({
            where: {
                categoria,
                fechaEvento: { gte: new Date() },
            },
            include: {
                creador: {
                    select: { id: true, nombre: true, apellido: true, correo: true },
                },
            },
            orderBy: { fechaEvento: 'asc' },
        });
    }
}
