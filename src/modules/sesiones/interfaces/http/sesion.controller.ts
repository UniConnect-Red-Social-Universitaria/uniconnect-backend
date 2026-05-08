import { Request, Response } from 'express';
import { sesionUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class SesionController {
  static async crearSerie(req: Request, res: Response) {
    try {
      const resultado = await sesionUseCases.crearSerie(
        req.usuario,
        req.body?.titulo,
        req.body?.descripcion,
        req.body?.lugar,
        req.body?.frecuencia,
        req.body?.fechaInicio,
        req.body?.fechaFin,
        req.body?.recordatorioMinutos,
      );
      return res.status(201).json({ success: true, ...resultado });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear serie de sesiones');
    }
  }

  static async obtenerSesiones(req: Request, res: Response) {
    try {
      const resultado = await sesionUseCases.obtenerSesiones(req.usuario);
      return res.json({ success: true, ...resultado });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener sesiones');
    }
  }

  static async modificarSesion(req: Request, res: Response) {
    try {
      const resultado = await sesionUseCases.modificarSesion(
        req.usuario,
        String(req.params['sesionId'] ?? ''),
        req.body?.alcance,
        req.body?.titulo,
        req.body?.descripcion,
        req.body?.lugar,
        req.body?.fecha,
        req.body?.recordatorioMinutos,
      );
      return res.json({ success: true, ...resultado });
    } catch (error) {
      return handleControllerError(res, error, 'Error al modificar sesión');
    }
  }

  static async cancelarSesion(req: Request, res: Response) {
    try {
      const resultado = await sesionUseCases.cancelarSesion(
        req.usuario,
        String(req.params['sesionId'] ?? ''),
        req.body?.alcance,
      );
      return res.json({ success: true, ...resultado });
    } catch (error) {
      return handleControllerError(res, error, 'Error al cancelar sesión');
    }
  }
}
