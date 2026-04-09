import prisma from '../lib/prisma';

type EstadoContacto = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

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

interface ContactoBasico {
    id: string;
    estado: EstadoContacto;
    solicitanteId: string;
    receptorId: string;
    createdAt?: Date;
}

function contactoDelegate() {
    const prismaDinamico = prisma as unknown as {
        contacto: {
            findFirst: (args: unknown) => Promise<{ id: string; estado: EstadoContacto; solicitanteId: string; receptorId: string } | null>;
            findUnique: (args: unknown) => Promise<{ id: string; estado: EstadoContacto; solicitanteId: string; receptorId: string } | null>;
            create: (args: unknown) => Promise<{
                id: string;
                estado: EstadoContacto;
                solicitanteId: string;
                receptorId: string;
                createdAt: Date;
            }>;
            update: (args: unknown) => Promise<{
                id: string;
                estado: EstadoContacto;
                solicitanteId: string;
                receptorId: string;
                updatedAt: Date;
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

    static async reactivarSolicitudRechazada(solicitanteId: string, receptorId: string) {
        const relacion = await contactoDelegate().findFirst({
            where: {
                estado: 'RECHAZADA',
                OR: [
                    {
                        solicitanteId,
                        receptorId
                    },
                    {
                        solicitanteId: receptorId,
                        receptorId: solicitanteId
                    }
                ]
            }
        });

        if (!relacion) {
            throw new Error('No existe una solicitud rechazada para reactivar');
        }

        return contactoDelegate().update({
            where: { id: relacion.id },
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
            select: {
                id: true,
                estado: true,
                solicitanteId: true,
                receptorId: true,
            }
        });

        const contactos = contactosRaw as unknown as ContactoBasico[];

        const idsCompaneros = Array.from(
            new Set(
                contactos.map((contacto) =>
                    contacto.solicitanteId === usuarioId
                        ? contacto.receptorId
                        : contacto.solicitanteId,
                ),
            ),
        );

        const usuarios = await prisma.usuario.findMany({
            where: {
                id: { in: idsCompaneros },
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                correo: true,
                carrera: true,
                semestre: true,
                materiasCursando: true,
            },
        });

        const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));

        return contactos
            .map((contacto) => {
                const companeroId =
                    contacto.solicitanteId === usuarioId
                        ? contacto.receptorId
                        : contacto.solicitanteId;

                const companero = usuariosPorId.get(companeroId);
                if (!companero) {
                    return null;
                }

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
                        materiasCursando: companero.materiasCursando,
                    },
                };
            })
            .filter((item): item is {
                contactoId: string;
                estado: EstadoContacto;
                usuario: UsuarioBasico;
            } => item !== null);
    }

    static async listarSolicitudesRecibidas(usuarioId: string) {
        const solicitudesRaw = await contactoDelegate().findMany({
            where: {
                receptorId: usuarioId,
                estado: 'PENDIENTE'
            },
            select: {
                id: true,
                estado: true,
                createdAt: true,
                solicitanteId: true,
            }
        });

        const solicitudes = solicitudesRaw as unknown as Array<{
            id: string;
            estado: EstadoContacto;
            createdAt: Date;
            solicitanteId: string;
        }>;

        const solicitanteIds = Array.from(
            new Set(solicitudes.map((solicitud) => solicitud.solicitanteId)),
        );

        const usuariosSolicitantes = await prisma.usuario.findMany({
            where: {
                id: { in: solicitanteIds },
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                correo: true,
                carrera: true,
                semestre: true,
                materiasCursando: true,
            },
        });

        const solicitantesPorId = new Map(
            usuariosSolicitantes.map((usuario) => [usuario.id, usuario]),
        );

        return solicitudes
            .map((solicitud) => {
                const solicitante = solicitantesPorId.get(solicitud.solicitanteId);
                if (!solicitante) {
                    return null;
                }

                return {
                    solicitudId: solicitud.id,
                    estado: solicitud.estado,
                    createdAt: solicitud.createdAt,
                    solicitante: {
                        id: solicitante.id,
                        nombre: solicitante.nombre,
                        apellido: solicitante.apellido,
                        correo: solicitante.correo,
                        carrera: solicitante.carrera,
                        semestre: solicitante.semestre,
                        materiasCursando: solicitante.materiasCursando,
                    },
                };
            })
            .filter((item): item is {
                solicitudId: string;
                estado: EstadoContacto;
                createdAt: Date;
                solicitante: UsuarioBasico;
            } => item !== null);
    }

    static async aceptarSolicitud(solicitudId: string, usuarioReceptorId: string) {
        const solicitud = await contactoDelegate().findUnique({
            where: { id: solicitudId }
        });

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        if (solicitud.receptorId !== usuarioReceptorId) {
            throw new Error('No tienes permiso para aceptar esta solicitud');
        }

        if (solicitud.estado !== 'PENDIENTE') {
            throw new Error('La solicitud ya fue procesada');
        }

        return contactoDelegate().update({
            where: { id: solicitudId },
            data: { estado: 'ACEPTADA' }
        });
    }

    static async rechazarSolicitud(solicitudId: string, usuarioReceptorId: string) {
        const solicitud = await contactoDelegate().findUnique({
            where: { id: solicitudId }
        });

        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        if (solicitud.receptorId !== usuarioReceptorId) {
            throw new Error('No tienes permiso para rechazar esta solicitud');
        }

        if (solicitud.estado !== 'PENDIENTE') {
            throw new Error('La solicitud ya fue procesada');
        }

        return contactoDelegate().update({
            where: { id: solicitudId },
            data: { estado: 'RECHAZADA' }
        });
    }
}
