import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository, notificacionRepository } from '../../../../container';
import { CanalNotificacion, TIPOS_NOTIFICACION, TipoNotificacion } from '../../domain/contracts';
import { NotificacionBase } from '../../../../shared/notificacion/INotificacion';

export class NotificacionController {
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

      const preferencias = await preferenciaRepository.obtenerPreferencias(
        usuarioId,
        tipoEvento as unknown as any
      );
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
          preferenciaRepository.obtenerPreferencias(usuarioId, tipo as unknown as any)
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
      const { canales } = req.body as { canales: CanalNotificacion[] };

      if (!Array.isArray(canales)) {
        return res.status(400).json({
          success: false,
          message: 'canales debe ser un arreglo (puede ser vacío si elige 0 canales)'
        });
      }

      const canalesPermitidos: CanalNotificacion[] = ['in-app', 'email', 'push', 'resumen-diario'];
      const tienenCanalesValidos = canales.every(canal => canalesPermitidos.includes(canal));

      if (!tienenCanalesValidos) {
        return res.status(400).json({
          success: false,
          message: `Arreglo contiene canales inválidos. Valores aceptados: ${canalesPermitidos.join(', ')}`
        });
      }

      const preferenciasActualizadas = await Promise.all(
        TIPOS_NOTIFICACION.map((tipo) =>
          preferenciaRepository.actualizarPreferencias(usuarioId, tipo as any, canales),
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

  static async enviarPrueba(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const { tipoEvento, mensaje } = req.body as { tipoEvento?: TipoNotificacion; mensaje?: string };

      const notificacion = new NotificacionBase(
        mensaje ?? 'Notificación de prueba',
        usuarioId,
      );

      const resultados = await notificacionService.notificar(
        notificacion.render(),
        usuarioId,
        (tipoEvento ?? 'mensaje') as unknown as any
      );

      return res.json({ success: true, data: resultados });
    } catch (error) {
      return handleControllerError(res, error, 'Error al enviar notificación de prueba');
    }
  }

  static async listar(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      const soloNoLeidas = req.query.noLeidas === 'true';
      const notificaciones = await notificacionRepository.listarPorUsuario(usuarioId, soloNoLeidas);
      const noLeidas = await notificacionRepository.contarNoLeidas(usuarioId);
      return res.json({ success: true, data: notificaciones, meta: { noLeidas } });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar notificaciones');
    }
  }

  static async marcarLeida(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await notificacionRepository.marcarComoLeida(id);
      return res.json({ success: true, message: 'Notificación marcada como leída' });
    } catch (error) {
      return handleControllerError(res, error, 'Error al marcar notificación como leída');
    }
  }

  static async marcarTodasLeidas(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      await notificacionRepository.marcarTodasComoLeidas(usuarioId);
      return res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      return handleControllerError(res, error, 'Error al marcar todas como leídas');
    }
  }
}