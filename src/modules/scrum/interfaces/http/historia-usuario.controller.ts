/**
 * Controller para Historia Usuario
 */

import { Request, Response } from 'express';
import { historiaUsuarioUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class HistoriaUsuarioController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.crearHU(
        req.usuario,
        req.params.sprintId,
        req.body?.codigo,
        req.body?.titulo,
        req.body?.descripcion,
        req.body?.storyPoints,
        req.body?.prioridad,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear historia de usuario');
    }
  }

  static async listarPorSprint(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.listarHUsPorSprint(
        req.usuario,
        req.params.sprintId,
        req.query.estado,
      );

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar historias de usuario');
    }
  }

  static async obtener(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.obtenerHU(req.usuario, req.params.huId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener historia de usuario');
    }
  }

  static async actualizar(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.actualizarHU(req.usuario, req.params.huId, req.body);

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar historia de usuario');
    }
  }

  static async cambiarEstado(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.cambiarEstado(
        req.usuario,
        req.params.huId,
        req.body?.estado,
      );

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al cambiar estado de HU');
    }
  }

  static async asignar(req: Request, res: Response) {
    try {
      const resultado = await historiaUsuarioUseCases.asignarHU(
        req.usuario,
        req.params.huId,
        req.body?.usuarioId,
      );

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al asignar historia de usuario');
    }
  }
}
