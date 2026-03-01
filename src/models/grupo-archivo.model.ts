import prisma from '../lib/prisma';

function grupoArchivoDelegate() {
    const prismaDinamico = prisma as unknown as {
        grupoArchivo: {
            create: (args: unknown) => Promise<{
                id: string;
                nombre: string;
                nombreFisico: string;
                ruta: string;
                mimeType: string;
                tamanoBytes: number;
                grupoId: string;
                subidoPorId: string;
                createdAt: Date;
                subidoPor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>;
            findMany: (args: unknown) => Promise<Array<{
                id: string;
                nombre: string;
                nombreFisico: string;
                ruta: string;
                mimeType: string;
                tamanoBytes: number;
                grupoId: string;
                subidoPorId: string;
                createdAt: Date;
                subidoPor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            }>>;
            findUnique: (args: unknown) => Promise<{
                id: string;
                nombre: string;
                nombreFisico: string;
                ruta: string;
                mimeType: string;
                tamanoBytes: number;
                grupoId: string;
                subidoPorId: string;
                createdAt: Date;
                subidoPor?: {
                    id: string;
                    nombre: string;
                    apellido: string;
                };
            } | null>;
        };
    };

    return prismaDinamico.grupoArchivo;
}

export class GrupoArchivoModel {
    static async crear(data: {
        nombre: string;
        nombreFisico: string;
        ruta: string;
        mimeType: string;
        tamanoBytes: number;
        grupoId: string;
        subidoPorId: string;
    }) {
        return grupoArchivoDelegate().create({
            data,
            include: {
                subidoPor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    }

    static async listarPorGrupo(grupoId: string) {
        return grupoArchivoDelegate().findMany({
            where: {
                grupoId
            },
            include: {
                subidoPor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async buscarPorId(archivoId: string) {
        return grupoArchivoDelegate().findUnique({
            where: {
                id: archivoId
            },
            include: {
                subidoPor: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    }
}
