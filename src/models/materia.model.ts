import prisma from '../lib/prisma';

function materiaDelegate() {
    const prismaDinamico = prisma as unknown as {
        materia: {
            create: (args: unknown) => Promise<{ id: string; nombre: string; createdAt: Date }>;
            findUnique: (args: unknown) => Promise<{ id: string; nombre: string } | null>;
        };
    };

    return prismaDinamico.materia;
}

export class MateriaModel {
    static async crear(nombre: string) {
        return materiaDelegate().create({
            data: { nombre }
        });
    }

    static async buscarPorId(id: string) {
        return materiaDelegate().findUnique({
            where: { id }
        });
    }

    static async buscarPorNombre(nombre: string) {
        return materiaDelegate().findUnique({
            where: { nombre }
        });
    }
}
