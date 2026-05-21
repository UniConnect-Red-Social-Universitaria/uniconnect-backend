/**
 * Controller para Retrospectiva
 */

import { Request, Response } from 'express';
import { retrospectivaUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class RetrospectivaController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await retrospectivaUseCases.crearRetrospectiva(
        req.usuario,
        req.params.sprintId,
        req.body,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear retrospectiva');
    }
  }

  static async obtener(req: Request, res: Response) {
    try {
      const resultado = await retrospectivaUseCases.obtenerRetrospectiva(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener retrospectiva');
    }
  }

  static async agregarAcuerdo(req: Request, res: Response) {
    try {
      const resultado = await retrospectivaUseCases.agregarAcuerdo(
        req.usuario,
        req.params.retroId,
        req.body?.descripcion,
        req.body?.responsable,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al agregar acuerdo');
    }
  }

  static async agregarImpedimento(req: Request, res: Response) {
    try {
      const resultado = await retrospectivaUseCases.agregarImpedimento(
        req.usuario,
        req.params.retroId,
        req.body?.descripcion,
        req.body?.impacto,
        req.body?.responsable,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al agregar impedimento');
    }
  }
}
