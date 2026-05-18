import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository } from '../../../../container';
import { CanalNotificacion, TipoNotificacion, TIPOS_NOTIFICACION, CANALES_DISPONIBLES } from '../../domain/contracts';
import { NotificacionBase } from '../../../../shared/notificacion/INotificacion';

export class NotificacionController {
  /**
   * GET /api/notificaciones/tipos
   * Devuelve los tipos de evento disponibles y los canales válidos,
   * para que el frontend pueda construir la UI de preferencias.
   */
  static async obtenerTiposYCanales(_req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        tiposEvento: TIPOS_NOTIFICACION,
        canalesDisponibles: CANALES_DISPONIBLES,
      },
    });
  }

  /**
   * GET /api/notificaciones/preferencias/:tipoEvento
   * Devuelve los canales activos del usuario para ese tipo de evento.
   */
  static async obtenerPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento } = req.params;

      if (!TIPOS_NOTIFICACION.includes(tipoEvento as TipoNotificacion)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
      }

      const preferencias = await preferenciaRepository.obtenerPreferencias(
        usuarioId,
        tipoEvento as TipoNotificacion,
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
    }
  }

  /**
   * PUT /api/notificaciones/preferencias/:tipoEvento
   * Actualiza los canales activos del usuario para ese tipo de evento.
   * Body: { canales: CanalNotificacion[] }  (e.g. ["in-app", "email"])
   */
  static async actualizarPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento } = req.params;
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

      const canalesInvalidos = canales.filter(
        (c) => !CANALES_DISPONIBLES.includes(c as CanalNotificacion),
      );
      if (canalesInvalidos.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Canales inválidos: ${canalesInvalidos.join(', ')}. Válidos: ${CANALES_DISPONIBLES.join(', ')}`,
        });
      }

      const preferencias = await preferenciaRepository.actualizarPreferencias(
        usuarioId,
        tipoEvento as TipoNotificacion,
        canales,
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar preferencias');
    }
  }

  /**
   * GET /api/notificaciones/preferencias
   * Devuelve las preferencias del usuario para TODOS los tipos de evento.
   */
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

  /**
   * POST /api/notificaciones/prueba
   * Envía una notificación de prueba al usuario autenticado.
   * Body: { tipoEvento: TipoNotificacion, mensaje?: string }
   */
  static async enviarPrueba(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento, mensaje } = req.body as { tipoEvento: TipoNotificacion; mensaje: string };

      if (!TIPOS_NOTIFICACION.includes(tipoEvento)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
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
