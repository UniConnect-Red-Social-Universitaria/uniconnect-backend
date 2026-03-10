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
            orderBy: { nombre: 'asc' },
            select: {
                id: true,
                nombre: true
            }
        });
    }

    static async contar() {
        return carreraDelegate().count();
    }

    static async crearCatalogo(nombres: string[]) {
        if (nombres.length === 0) {
            return { count: 0 };
        }

        const nombresNormalizados = nombres
            .map((nombre) => nombre.trim())
            .filter((nombre) => nombre.length > 0);

        if (nombresNormalizados.length === 0) {
            return { count: 0 };
        }

        const existentes = await carreraDelegate().findMany({
            where: {
                nombre: {
                    in: nombresNormalizados
                }
            },
            select: {
                nombre: true
            }
        });

        const existentesSet = new Set(existentes.map((carrera) => carrera.nombre));
        const nuevosNombres = nombresNormalizados.filter((nombre) => !existentesSet.has(nombre));

        if (nuevosNombres.length === 0) {
            return { count: 0 };
        }

        return carreraDelegate().createMany({
            data: nuevosNombres.map((nombre) => ({ nombre }))
        });
    }
}
