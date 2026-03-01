import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { GrupoModel } from '../models/grupo.model';
import { GrupoArchivoModel } from '../models/grupo-archivo.model';

export class GrupoArchivoController {
    static async subirPdf(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;

            if (typeof grupoId !== 'string' || !grupoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un grupoId válido'
                });
            }

            const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), req.usuario.id);

            if (!pertenencia.existe) {
                return res.status(404).json({
                    success: false,
                    message: 'El grupo no existe'
                });
            }

            if (!pertenencia.pertenece) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los integrantes del grupo pueden subir archivos'
                });
            }

            const archivo = req.file;

            if (!archivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes adjuntar un archivo PDF en el campo "archivo"'
                });
            }

            const archivoCreado = await GrupoArchivoModel.crear({
                nombre: archivo.originalname,
                nombreFisico: archivo.filename,
                ruta: archivo.path,
                mimeType: archivo.mimetype,
                tamanoBytes: archivo.size,
                grupoId: grupoId.trim(),
                subidoPorId: req.usuario.id
            });

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

            if (typeof grupoId !== 'string' || !grupoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un grupoId válido'
                });
            }

            const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), req.usuario.id);

            if (!pertenencia.existe) {
                return res.status(404).json({
                    success: false,
                    message: 'El grupo no existe'
                });
            }

            if (!pertenencia.pertenece) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los integrantes del grupo pueden consultar archivos'
                });
            }

            const archivos = await GrupoArchivoModel.listarPorGrupo(grupoId.trim());

            return res.json({
                success: true,
                data: archivos.map((archivo) => ({
                    id: archivo.id,
                    nombre: archivo.nombre,
                    mimeType: archivo.mimeType,
                    tamanoBytes: archivo.tamanoBytes,
                    grupoId: archivo.grupoId,
                    subidoPor: archivo.subidoPor,
                    createdAt: archivo.createdAt,
                    descargarUrl: `/api/grupos/${archivo.grupoId}/archivos/${archivo.id}/descargar`
                }))
            });
        } catch (error) {
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

            if (typeof grupoId !== 'string' || !grupoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un grupoId válido'
                });
            }

            if (typeof archivoId !== 'string' || !archivoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un archivoId válido'
                });
            }

            const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), req.usuario.id);

            if (!pertenencia.existe) {
                return res.status(404).json({
                    success: false,
                    message: 'El grupo no existe'
                });
            }

            if (!pertenencia.pertenece) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los integrantes del grupo pueden descargar archivos'
                });
            }

            const archivo = await GrupoArchivoModel.buscarPorId(archivoId.trim());

            if (!archivo || archivo.grupoId !== grupoId.trim()) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado en este grupo'
                });
            }

            const rutaAbsoluta = path.resolve(archivo.ruta);

            if (!fs.existsSync(rutaAbsoluta)) {
                return res.status(404).json({
                    success: false,
                    message: 'El archivo no está disponible en el servidor'
                });
            }

            return res.download(rutaAbsoluta, archivo.nombre);
        } catch (error) {
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
