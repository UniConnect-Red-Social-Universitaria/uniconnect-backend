import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository } from '../../../../container';
import { 
  CanalNotificacion, 
  TipoNotificacion, 
  TIPOS_NOTIFICACION, 
  CANALES_DISPONIBLES 
} from '../../domain/contracts';
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
      const tipoEvento = req.params.tipoEvento as TipoNotificacion;

      if (!TIPOS_NOTIFICACION.includes(tipoEvento)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
      }

      // Tipado limpio, sin necesidad de 'as unknown as any'
      const preferencias = await preferenciaRepository.obtenerPreferencias(usuarioId, tipoEvento);
      
      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
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
          preferenciaRepository.obtenerPreferencias(usuarioId, tipo)
        ),
      );

      return res.json({ success: true, data: preferencias });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener preferencias');
    }
  }

  /**
   * PUT /api/notificaciones/preferencias
   * Actualiza los canales activos del usuario de manera global para todos los eventos.
   * Body: { canales: CanalNotificacion[] }  (e.g. ["in-app", "email"])
   */
  static async actualizarPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { canales } = req.body as { canales: CanalNotificacion[] };

      if (!Array.isArray(canales)) {
        return res.status(400).json({
          success: false,
          message: 'canales debe ser un arreglo (puede ser vacío si elige 0 canales)'
        });
      }

      // Usamos la validación limpia introducida en developer
      const canalesInvalidos = canales.filter(
        (c) => !CANALES_DISPONIBLES.includes(c as CanalNotificacion),
      );
      
      if (canalesInvalidos.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Canales inválidos: ${canalesInvalidos.join(', ')}. Válidos: ${CANALES_DISPONIBLES.join(', ')}`,
        });
      }

      // Conservamos tu lógica de actualización global de feature/canales
      const preferenciasActualizadas = await Promise.all(
        TIPOS_NOTIFICACION.map((tipo) =>
          preferenciaRepository.actualizarPreferencias(usuarioId, tipo, canales),
        ),
      );

      return res.json({
        success: true,
        message: 'Preferencias globales actualizadas exitosamente',
        data: preferenciasActualizadas
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar preferencias globales');
    }
  }

  /**
   * POST /api/notificaciones/prueba
   * Envía una notificación de prueba al usuario autenticado.
   * Body: { tipoEvento?: TipoNotificacion, mensaje?: string }
   */
  static async enviarPrueba(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento, mensaje } = req.body as { tipoEvento?: TipoNotificacion; mensaje?: string };

      // Combina la validación estricta de developer con tus fallbacks de feature/canales
      const eventoFinal = tipoEvento ?? 'mensaje';

      if (!TIPOS_NOTIFICACION.includes(eventoFinal)) {
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
        eventoFinal
      );

      return res.json({ success: true, data: resultados });
    } catch (error) {
      return handleControllerError(res, error, 'Error al enviar notificación de prueba');
    }
  }
}