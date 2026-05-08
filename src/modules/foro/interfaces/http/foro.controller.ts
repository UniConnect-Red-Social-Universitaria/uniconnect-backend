import { Request, Response } from 'express';
import { foroUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class ForoController {
  static async publicarPregunta(req: Request, res: Response) {
    try {
      const resultado = await foroUseCases.publicarPregunta(
        req.usuario,
        req.params.materiaId,
        req.body?.titulo,
        req.body?.contenido,
      );
      res.status(201).json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al publicar pregunta');
    }
  }

  static async obtenerPreguntas(req: Request, res: Response) {
    try {
      const resultado = await foroUseCases.obtenerForo(req.params.materiaId);
      res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preguntas');
    }
  }

  static async publicarRespuesta(req: Request, res: Response) {
    try {
      const resultado = await foroUseCases.publicarRespuesta(
        req.usuario,
        req.body?.materiaId,
        req.params.preguntaId,
        req.body?.contenido,
      );
      res.status(201).json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al publicar respuesta');
    }
  }

  static async obtenerRespuestas(req: Request, res: Response) {
    try {
      const resultado = await foroUseCases.obtenerRespuestas(req.params.preguntaId);
      res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener respuestas');
    }
  }

  static async votarRespuesta(req: Request, res: Response) {
    try {
      const resultado = await foroUseCases.votarRespuesta(
        req.usuario,
        req.params.respuestaId,
        req.body?.valor,
      );
      res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al registrar voto');
    }
  }
}
