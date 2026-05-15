import { PrismaClient } from '@prisma/client';
import { RecursoBase } from '../../domain/recursos/RecursoBase';
import { RecursoComponent } from '../../domain/recursos/RecursoComponent';
import { extractOpenGraph, findUrlsInText, getDomain, detectResourceType } from '../../utils/open-graph.util';

const prisma = new PrismaClient();

export class RecursoService {
    async crearRecurso(data: {
        titulo: string;
        contenido: string;
        tipo?: string;
        metadata?: any;
        grupoId: string;
        creadorId: string;
    }) {
        let metadataMergeada = { ...data.metadata };

        // Always try OG extraction for any URL content
        const urls = findUrlsInText(data.contenido);
        const targetUrl = data.contenido.startsWith('http') ? data.contenido.trim() : (urls[0] || '');

        if (targetUrl) {
            const ogData = await extractOpenGraph(targetUrl);
            if (ogData) {
                metadataMergeada = {
                    ...metadataMergeada,
                    openGraph: ogData,
                    domain: ogData.domain,
                    resourceType: ogData.resourceType,
                };
            } else {
                // Minimal fallback so card can still render
                metadataMergeada = {
                    ...metadataMergeada,
                    domain: getDomain(targetUrl),
                    resourceType: detectResourceType(targetUrl),
                };
            }
        }

        const recursoBase: RecursoComponent = new RecursoBase(
            data.titulo,
            data.contenido,
            metadataMergeada
        );

        const newRecurso = await prisma.recurso.create({
            data: {
                titulo: data.titulo,
                contenido: recursoBase.getContenido(),
                tipo: data.tipo || 'ARCHIVO',
                metadata: recursoBase.getMetadata(),
                grupoId: data.grupoId,
                creadorId: data.creadorId,
            },
        });

        return newRecurso;
    }

    async obtenerRecursos(grupoId: string) {
        return prisma.recurso.findMany({
            where: { grupoId },
            include: {
                creador: { select: { nombre: true, apellido: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async editarRecurso(id: string, data: {
        titulo?: string;
        contenido?: string;
        metadata?: any;
    }, usuarioId: string) {
        const recursoExistente = await prisma.recurso.findUnique({
            where: { id },
            include: { grupo: true }
        });

        if (!recursoExistente) throw new Error('Recurso no encontrado');

        // Validaciones de permisos: Solo creador del recurso o administrador del grupo
        if (recursoExistente.creadorId !== usuarioId && recursoExistente.grupo.administradorId !== usuarioId) {
            throw new Error('No tienes permisos para editar este recurso');
        }

        let metadataMergeada = { ...(recursoExistente.metadata as any || {}), ...(data.metadata || {}) };

        // Volver a extraer Open Graph si se cambia el contenido
        if (data.contenido && data.contenido !== recursoExistente.contenido) {
            const urls = findUrlsInText(data.contenido);
            if (urls.length > 0 || recursoExistente.tipo === 'URL' || recursoExistente.tipo === 'LINK') {
                const baseUrl = recursoExistente.tipo === 'URL' ? data.contenido.trim() : urls[0];
                const ogData = await extractOpenGraph(baseUrl);
                if (ogData) {
                    metadataMergeada = { ...metadataMergeada, openGraph: ogData };
                }
            }
        }

        const recursoBase = new RecursoBase(
            data.titulo ?? recursoExistente.titulo,
            data.contenido ?? recursoExistente.contenido,
            metadataMergeada
        );

        return prisma.recurso.update({
            where: { id },
            data: {
                titulo: data.titulo ?? recursoExistente.titulo,
                contenido: recursoBase.getContenido(),
                metadata: recursoBase.getMetadata(),
            },
        });
    }

    async eliminarRecurso(id: string, usuarioId: string) {
        const recursoExistente = await prisma.recurso.findUnique({
            where: { id },
            include: { grupo: true }
        });

        if (!recursoExistente) throw new Error('Recurso no encontrado');

        // Validaciones de permisos: Solo creador del recurso o administrador del grupo
        if (recursoExistente.creadorId !== usuarioId && recursoExistente.grupo.administradorId !== usuarioId) {
            throw new Error('No tienes permisos para eliminar este recurso');
        }

        return prisma.recurso.delete({ where: { id } });
    }
}

export const recursoService = new RecursoService();