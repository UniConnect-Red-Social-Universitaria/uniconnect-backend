import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository } from '../../../../container';
import { CategoriaEvento, CATEGORIAS_EVENTO } from '../../../../domain/contracts';
import { CanalNotificacion } from '../../domain/contracts';
import { NotificacionBase } from '../../../../shared/notificacion/INotificacion';

export class NotificacionController {
  static async obtenerPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento } = req.params;

      if (!CATEGORIAS_EVENTO.includes(tipoEvento as CategoriaEvento)) {
        return res.status(400).json({ success: false, message: 'Tipo de evento inválido' });
      }

      const preferencias = await preferenciaRepository.obtenerPreferencias(
        usuarioId,
        tipoEvento as CategoriaEvento,
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
    }
  }

  static async actualizarPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento } = req.params;
      const { canales } = req.body as { canales: CanalNotificacion[] };

      if (!CATEGORIAS_EVENTO.includes(tipoEvento as CategoriaEvento)) {
        return res.status(400).json({ success: false, message: 'Tipo de evento inválido' });
      }

      if (!Array.isArray(canales)) {
        return res.status(400).json({ success: false, message: 'canales debe ser un arreglo' });
      }

      const preferencias = await preferenciaRepository.actualizarPreferencias(
        usuarioId,
        tipoEvento as CategoriaEvento,
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
      const { tipoEvento, mensaje } = req.body as { tipoEvento: CategoriaEvento; mensaje: string };

      if (!CATEGORIAS_EVENTO.includes(tipoEvento)) {
        return res.status(400).json({ success: false, message: 'Tipo de evento inválido' });
      }

      const notificacion = new NotificacionBase(
        mensaje ?? 'Notificación de prueba',
        usuarioId,
      );

      const resultados = await notificacionService.notificar(
        notificacion.render(),
        usuarioId,
        tipoEvento,
      );

      return res.json({ success: true, data: resultados });
    } catch (error) {
      return handleControllerError(res, error, 'Error al enviar notificación de prueba');
    }
  }
}
