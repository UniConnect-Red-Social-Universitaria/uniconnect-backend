import prisma from '../lib/prisma';

type EstadoContacto = 'PENDIENTE' | 'ACEPTADA';

interface UsuarioBasico {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    carrera: string;
    semestre: number;
    materiasCursando: string[];
}

interface ContactoConUsuarios {
    id: string;
    estado: EstadoContacto;
    solicitanteId: string;
    receptorId: string;
    solicitante: UsuarioBasico;
    receptor: UsuarioBasico;
}

function contactoDelegate() {
    const prismaDinamico = prisma as unknown as {
        contacto: {
            findFirst: (args: unknown) => Promise<{ estado: EstadoContacto } | null>;
            create: (args: unknown) => Promise<{
                id: string;
                estado: EstadoContacto;
                solicitanteId: string;
                receptorId: string;
                createdAt: Date;
            }>;
            findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
        };
    };

    return prismaDinamico.contacto;
}

export class ContactoModel {
    static async existeRelacionEntreUsuarios(usuarioAId: string, usuarioBId: string) {
        return contactoDelegate().findFirst({
            where: {
                OR: [
                    {
                        solicitanteId: usuarioAId,
                        receptorId: usuarioBId
                    },
                    {
                        solicitanteId: usuarioBId,
                        receptorId: usuarioAId
                    }
                ]
            }
        });
    }

    static async crearSolicitud(solicitanteId: string, receptorId: string) {
        return contactoDelegate().create({
            data: {
                solicitanteId,
                receptorId,
                estado: 'PENDIENTE'
            }
        });
    }

    static async obtenerIdsRelacionados(usuarioId: string) {
        const relaciones = await contactoDelegate().findMany({
            where: {
                OR: [
                    { solicitanteId: usuarioId },
                    { receptorId: usuarioId }
                ]
            },
            select: {
                solicitanteId: true,
                receptorId: true
            }
        });

        const ids = new Set<string>();

        for (const relacion of relaciones) {
            const solicitanteId = String(relacion.solicitanteId ?? '');
            const receptorId = String(relacion.receptorId ?? '');

            if (solicitanteId && solicitanteId !== usuarioId) {
                ids.add(solicitanteId);
            }

            if (receptorId && receptorId !== usuarioId) {
                ids.add(receptorId);
            }
        }

        return Array.from(ids);
    }

    static async listarCompanerosAceptados(usuarioId: string) {
        const contactosRaw = await contactoDelegate().findMany({
            where: {
                estado: 'ACEPTADA',
                OR: [
                    { solicitanteId: usuarioId },
                    { receptorId: usuarioId }
                ]
            },
            include: {
                solicitante: true,
                receptor: true
            }
        });

        const contactos = contactosRaw as unknown as ContactoConUsuarios[];

        return contactos.map((contacto: ContactoConUsuarios) => {
            const companero = contacto.solicitanteId === usuarioId
                ? contacto.receptor
                : contacto.solicitante;

            return {
                contactoId: contacto.id,
                estado: contacto.estado,
                usuario: {
                    id: companero.id,
                    nombre: companero.nombre,
                    apellido: companero.apellido,
                    correo: companero.correo,
                    carrera: companero.carrera,
                    semestre: companero.semestre,
                    materiasCursando: companero.materiasCursando
                }
            };
        });
    }
}
