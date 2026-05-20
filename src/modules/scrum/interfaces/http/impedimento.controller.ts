/**
 * Controller para Impedimento
 */

import { Request, Response } from 'express';
import { impedimentoUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class ImpedimentoController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.crearImpedimento(
        req.usuario,
        req.body?.descripcion,
        req.body?.estado,
        req.body?.responsable,
        req.body?.sprintId,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear impedimento');
    }
  }

  static async obtener(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.obtenerImpedimento(req.usuario, req.params.impedimentoId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener impedimento');
    }
  }

  static async listarAbiertos(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.listarAbiertos(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar impedimentos abiertos');
    }
  }

  static async listarCriticos(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.listarCriticos(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar impedimentos críticos');
    }
  }

  static async listarPorSprint(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.listarPorSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar impedimentos del sprint');
    }
  }

  static async actualizarEstado(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.actualizarEstado(
        req.usuario,
        req.params.impedimentoId,
        req.body?.estado,
      );

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar estado');
    }
  }

  static async detectarCriticos(req: Request, res: Response) {
    try {
      const resultado = await impedimentoUseCases.detectarYMarcarCriticos(req.usuario);

      return res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al detectar impedimentos críticos');
    }
  }
}
