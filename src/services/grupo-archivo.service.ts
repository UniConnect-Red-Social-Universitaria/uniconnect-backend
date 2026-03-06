import fs from 'fs';
import path from 'path';
import { GrupoModel } from '../models/grupo.model';
import { GrupoArchivoModel } from '../models/grupo-archivo.model';
import { ServiceError } from './service-error';

export type ArchivoSubido = {
    originalname: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
};

export class GrupoArchivoService {
    static async subirPdf(usuarioId: string, grupoId: unknown, archivo?: ArchivoSubido) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), usuarioId);

        if (!pertenencia.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!pertenencia.pertenece) {
            throw new ServiceError(403, 'Solo los integrantes del grupo pueden subir archivos');
        }

        if (!archivo) {
            throw new ServiceError(400, 'Debes adjuntar un archivo PDF en el campo "archivo"');
        }

        return GrupoArchivoModel.crear({
            nombre: archivo.originalname,
            nombreFisico: archivo.filename,
            ruta: archivo.path,
            mimeType: archivo.mimetype,
            tamanoBytes: archivo.size,
            grupoId: grupoId.trim(),
            subidoPorId: usuarioId
        });
    }

    static async listarPdfGrupo(usuarioId: string, grupoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), usuarioId);

        if (!pertenencia.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!pertenencia.pertenece) {
            throw new ServiceError(403, 'Solo los integrantes del grupo pueden consultar archivos');
        }

        const archivos = await GrupoArchivoModel.listarPorGrupo(grupoId.trim());

        return archivos.map((archivo) => ({
            id: archivo.id,
            nombre: archivo.nombre,
            mimeType: archivo.mimeType,
            tamanoBytes: archivo.tamanoBytes,
            grupoId: archivo.grupoId,
            subidoPor: archivo.subidoPor,
            createdAt: archivo.createdAt,
            descargarUrl: `/api/grupos/${archivo.grupoId}/archivos/${archivo.id}/descargar`
        }));
    }

    static async prepararDescarga(usuarioId: string, grupoId: unknown, archivoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof archivoId !== 'string' || !archivoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un archivoId válido');
        }

        const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), usuarioId);

        if (!pertenencia.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!pertenencia.pertenece) {
            throw new ServiceError(403, 'Solo los integrantes del grupo pueden descargar archivos');
        }

        const archivo = await GrupoArchivoModel.buscarPorId(archivoId.trim());

        if (!archivo || archivo.grupoId !== grupoId.trim()) {
            throw new ServiceError(404, 'Archivo no encontrado en este grupo');
        }

        const rutaAbsoluta = path.resolve(archivo.ruta);

        if (!fs.existsSync(rutaAbsoluta)) {
            throw new ServiceError(404, 'El archivo no está disponible en el servidor');
        }

        return {
            rutaAbsoluta,
            nombre: archivo.nombre
        };
    }
}
