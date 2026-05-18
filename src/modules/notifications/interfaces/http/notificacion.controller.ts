import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository } from '../../../../container';
import { CanalNotificacion, TIPOS_NOTIFICACION, TipoNotificacion } from '../../domain/contracts';
import { NotificacionBase } from '../../../../shared/notificacion/INotificacion';

export class NotificacionController {
  static async obtenerPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const tipoEvento = req.params.tipoEvento as string;

      if (!TIPOS_NOTIFICACION.includes(tipoEvento as TipoNotificacion)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
      }

      const preferencias = await preferenciaRepository.obtenerPreferencias(usuarioId, tipoEvento);
      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
    }
  }

  static async obtenerTodasLasPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;

      const preferencias = await Promise.all(
        TIPOS_NOTIFICACION.map((tipo) =>
          preferenciaRepository.obtenerPreferencias(usuarioId, tipo),
        ),
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
    }
  }

  static async actualizarPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const tipoEvento = req.params.tipoEvento as string;
      const { canales } = req.body as { canales: CanalNotificacion[] };

      if (!TIPOS_NOTIFICACION.includes(tipoEvento as TipoNotificacion)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
      }

      if (!Array.isArray(canales)) {
        return res.status(400).json({ success: false, message: 'canales debe ser un arreglo' });
      }

      const preferencias = await preferenciaRepository.actualizarPreferencias(
        usuarioId,
        tipoEvento,
        canales,
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar preferencias');
    }
  }

  static async enviarPrueba(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento, mensaje } = req.body as { tipoEvento?: string; mensaje?: string };

      const notificacion = new NotificacionBase(
        mensaje ?? 'Notificación de prueba',
        usuarioId,
      );

      const resultados = await notificacionService.notificar(
        notificacion.render(),
        usuarioId,
        tipoEvento ?? 'mensaje',
      );

      return res.json({ success: true, data: resultados });
    } catch (error) {
      return handleControllerError(res, error, 'Error al enviar notificación de prueba');
    }
  }
}
