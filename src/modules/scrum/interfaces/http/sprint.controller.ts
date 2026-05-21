/**
 * Controller para Sprint
 */

import { Request, Response } from 'express';
import { sprintUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class SprintController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await sprintUseCases.crearSprint(
        req.usuario,
        req.body?.numero,
        req.body?.nombre,
        req.body?.descripcion,
        req.body?.velocidadPlaneada,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear sprint');
    }
  }

  static async listar(req: Request, res: Response) {
    try {
      const soloActivos = req.query.activos === 'true';
      const resultado = await sprintUseCases.listarSprints(req.usuario, soloActivos);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar sprints');
    }
  }

  static async obtener(req: Request, res: Response) {
    try {
      const resultado = await sprintUseCases.obtenerSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener sprint');
    }
  }

  static async actualizar(req: Request, res: Response) {
    try {
      const resultado = await sprintUseCases.actualizarSprint(req.usuario, req.params.sprintId, req.body);

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar sprint');
    }
  }

  static async iniciar(req: Request, res: Response) {
    try {
      const resultado = await sprintUseCases.iniciarSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al iniciar sprint');
    }
  }

  static async cerrar(req: Request, res: Response) {
    try {
      const resultado = await sprintUseCases.cerrarSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al cerrar sprint');
    }
  }
}
