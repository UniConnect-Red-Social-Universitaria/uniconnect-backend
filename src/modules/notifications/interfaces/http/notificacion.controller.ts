import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { notificacionService, preferenciaRepository } from '../../../../container';
import { CanalNotificacion, TIPOS_NOTIFICACION, TipoNotificacion } from '../../domain/contracts';
import { NotificacionBase } from '../../../../shared/notificacion/INotificacion';

export class NotificacionController {
  static async obtenerPreferencias(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario!.id;
      // 1. Casteamos a TipoNotificacion para evitar el error de TypeScript
      const tipoEvento = req.params.tipoEvento as TipoNotificacion;

      if (!TIPOS_NOTIFICACION.includes(tipoEvento)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de evento inválido. Valores posibles: ${TIPOS_NOTIFICACION.join(', ')}`,
        });
      }

      // TypeScript ya no marca error porque reconoce 'tipoEvento' como TipoNotificacion
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
          preferenciaRepository.obtenerPreferencias(usuarioId, tipo as unknown as any) // <--- Aquí
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
        (tipoEvento ?? 'mensaje') as unknown as any // <--- Aquí
      );

      return res.json({ success: true, data: resultados });
    } catch (error) {
      return handleControllerError(res, error, 'Error al enviar notificación de prueba');
    }
  }
}