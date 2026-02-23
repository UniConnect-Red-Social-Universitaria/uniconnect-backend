import prisma from '../lib/prisma';

function materiaDelegate() {
    const prismaDinamico = prisma as unknown as {
        materia: {
            create: (args: unknown) => Promise<{ id: string; nombre: string; createdAt: Date }>;
            findUnique: (args: unknown) => Promise<{ id: string; nombre: string } | null>;
            findMany: (args?: unknown) => Promise<Array<{ id: string; nombre: string }>>;
            createMany: (args: unknown) => Promise<{ count: number }>;
            count: () => Promise<number>;
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

    static async listarTodas() {
        return materiaDelegate().findMany({
            orderBy: { nombre: 'asc' }
        });
    }

    static async contar() {
        return materiaDelegate().count();
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

        const existentes = await materiaDelegate().findMany({
            where: {
                nombre: {
                    in: nombresNormalizados
                }
            },
            select: {
                nombre: true
            }
        });

        const existentesSet = new Set(existentes.map((materia) => materia.nombre));
        const nuevosNombres = nombresNormalizados.filter((nombre) => !existentesSet.has(nombre));

        if (nuevosNombres.length === 0) {
            return { count: 0 };
        }

        return materiaDelegate().createMany({
            data: nuevosNombres.map((nombre) => ({ nombre }))
        });
    }
}
