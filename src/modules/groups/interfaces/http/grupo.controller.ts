import { Request, Response } from 'express';

import { groupUseCases, materiaUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class GrupoController {
  static async crearMateria(req: Request, res: Response) {
    try {
      const resultado = await materiaUseCases.crear(req.body?.nombre);

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear materia');
    }
  }

  static async crearGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.crearGrupo(req.usuario, {
        nombre: req.body?.nombre,
        materiaId: req.body?.materiaId,
      });

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear grupo');
    }
  }

  static async listarMisGrupos(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarMisGrupos(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar grupos');
    }
  }

  static async listarGruposDisponibles(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarGruposDisponibles(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar grupos disponibles');
    }
  }

  static async unirseAGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.unirseAGrupo(req.usuario, req.params.id);

      return res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al unirte al grupo');
    }
  }

  static async subirArchivo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.subirArchivo(
        req.usuario,
        req.params.id,
        req.file,
        req.body?.nombre,
      );
      return res.status(201).json({ success: true, message: resultado.message, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al subir el archivo');
    }
  }

  static async listarArchivos(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarArchivos(req.usuario, req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar archivos');
    }
  }

  static async descargarArchivo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.obtenerRutaArchivo(
        req.usuario,
        req.params.id,
        req.params.archivoId,
      );
      return res.download(resultado.data.ruta, resultado.data.nombre);
    } catch (error) {
      return handleControllerError(res, error, 'Error al descargar el archivo');
    }
  }

  static async cederAdministracion(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.cederAdministracion(
        req.usuario,
        req.params.id,
        req.body?.nuevoAdminId,
      );
      return res.json({ success: true, message: resultado.message });
    } catch (error) {
      return handleControllerError(res, error, 'Error al ceder la administración');
    }
  }
}
