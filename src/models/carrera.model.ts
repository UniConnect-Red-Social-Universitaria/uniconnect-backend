import prisma from '../lib/prisma';

function carreraDelegate() {
    const prismaDinamico = prisma as unknown as {
        carrera: {
            findUnique: (args: unknown) => Promise<{ id: string; nombre: string } | null>;
            findMany: (args?: unknown) => Promise<Array<{ id: string; nombre: string }>>;
            createMany: (args: unknown) => Promise<{ count: number }>;
            count: () => Promise<number>;
        };
    };

    return prismaDinamico.carrera;
}

export class CarreraModel {
    static async buscarPorNombre(nombre: string) {
        return carreraDelegate().findUnique({
            where: { nombre }
        });
    }

    static async listarTodas() {
        return carreraDelegate().findMany({
            orderBy: { nombre: 'asc' }
        });
    }

    static async contar() {
        return carreraDelegate().count();
    }

    static async crearCatalogo(nombres: string[]) {
        if (nombres.length === 0) {
            return { count: 0 };
        }

        return carreraDelegate().createMany({
            data: nombres.map((nombre) => ({ nombre })),
            skipDuplicates: true
        });
    }
}
