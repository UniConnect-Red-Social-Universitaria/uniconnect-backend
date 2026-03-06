import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { GrupoArchivoService, ArchivoSubido } from '../services/grupo-archivo.service';
import { ServiceError } from '../services/service-error';

type RequestConArchivo = Request & {
    file?: ArchivoSubido;
};

export class GrupoArchivoController {
    static async subirPdf(req: Request, res: Response) {
        try {
            const reqConArchivo = req as RequestConArchivo;

            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const archivoCreado = await GrupoArchivoService.subirPdf(req.usuario.id, grupoId, reqConArchivo.file);

            return res.status(201).json({
                success: true,
                message: 'PDF subido correctamente al repositorio del grupo',
                data: {
                    id: archivoCreado.id,
                    nombre: archivoCreado.nombre,
                    tamanoBytes: archivoCreado.tamanoBytes,
                    grupoId: archivoCreado.grupoId,
                    subidoPor: archivoCreado.subidoPor,
                    createdAt: archivoCreado.createdAt
                }
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al subir PDF al grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async listarPdfGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const archivos = await GrupoArchivoService.listarPdfGrupo(req.usuario.id, grupoId);

            return res.status(200).json({
                success: true,
                data: archivos
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al listar archivos del grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async descargarPdfGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId, archivoId } = req.params;
            const descarga = await GrupoArchivoService.prepararDescarga(req.usuario.id, grupoId, archivoId);

            res.status(200);
            return res.download(descarga.rutaAbsoluta, descarga.nombre);
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId o archivoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al descargar archivo del grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
