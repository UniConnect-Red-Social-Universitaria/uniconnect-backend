import { Request, Response } from 'express';

import { eventUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';
import { EventoPublicador, SocketEventoObserver } from '../../../../shared/eventos-observer';
import { CategoriaEvento, CATEGORIAS_EVENTO } from '../../../../domain/contracts';

export class EventoController {
  static async crear(req: Request, res: Response) {
    try {
      const resultado = await eventUseCases.crear(
        req.usuario,
        req.body?.titulo,
        req.body?.descripcion,
        req.body?.lugar,
        req.body?.fechaEvento,
        req.body?.categoria,
      );

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear evento');
    }
  }

  static async listarGlobal(req: Request, res: Response) {
    try {
      const { categoria } = req.query;

      if (typeof categoria === 'string' && categoria.trim()) {
        const resultado = await eventUseCases.filtrarPorCategoria(categoria.trim());
        return res.json({ success: true, data: resultado.data });
      }

      const resultado = await eventUseCases.listarGlobal();
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar eventos');
    }
  }

  static async suscribir(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      const { categoria } = req.body;
      if (typeof categoria !== 'string' || !(CATEGORIAS_EVENTO as string[]).includes(categoria)) {
        return res.status(400).json({
          success: false,
          message: `Categoría inválida. Valores posibles: ${CATEGORIAS_EVENTO.join(', ')}`,
        });
      }

      const publicador = EventoPublicador.getInstance();
      const observer = new SocketEventoObserver(usuarioId);
      publicador.suscribir(categoria as CategoriaEvento, observer);

      return res.json({
        success: true,
        message: `Suscrito a eventos de categoría "${categoria}"`,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al suscribirse a categoría');
    }
  }

  static async desuscribir(req: Request, res: Response) {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      const categoria = String(req.params['categoria'] ?? '');
      if (!(CATEGORIAS_EVENTO as string[]).includes(categoria)) {
        return res.status(400).json({
          success: false,
          message: `Categoría inválida. Valores posibles: ${CATEGORIAS_EVENTO.join(', ')}`,
        });
      }

      const publicador = EventoPublicador.getInstance();
      const observer = new SocketEventoObserver(usuarioId);
      publicador.desuscribir(categoria as CategoriaEvento, observer);

      return res.json({
        success: true,
        message: `Desuscrito de eventos de categoría "${categoria}"`,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al desuscribirse de categoría');
    }
  }
}
