/**
 * Controller para Criterio Aceptacion
 */

import { Request, Response } from 'express';
import { criterioAceptacionUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class CriterioAceptacionController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await criterioAceptacionUseCases.crearCriterio(
        req.usuario,
        req.params.huId,
        req.body?.numero,
        req.body?.descripcion,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear criterio de aceptación');
    }
  }

  static async listarDeHU(req: Request, res: Response) {
    try {
      const resultado = await criterioAceptacionUseCases.listarCriteriosDeHU(req.usuario, req.params.huId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar criterios');
    }
  }

  static async evaluar(req: Request, res: Response) {
    try {
      const resultado = await criterioAceptacionUseCases.evaluarCriterio(
        req.usuario,
        req.params.criterioId,
        req.body?.cumplido,
        req.body?.observaciones,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al evaluar criterio');
    }
  }

  static async obtenerHistorial(req: Request, res: Response) {
    try {
      const resultado = await criterioAceptacionUseCases.obtenerHistorialEvaluaciones(
        req.usuario,
        req.params.criterioId,
      );

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener historial de evaluaciones');
    }
  }

  static async calcularCumplimiento(req: Request, res: Response) {
    try {
      const resultado = await criterioAceptacionUseCases.calcularCumplimientoPorHU(req.usuario, req.params.huId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al calcular cumplimiento');
    }
  }
}
