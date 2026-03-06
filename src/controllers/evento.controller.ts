import { Request, Response } from 'express';
import { EventoService } from '../services/evento.service';
import { ServiceError } from '../services/service-error';

export class EventoController {
    static async crear(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const body = req.body as Record<string, unknown>;
            const evento = await EventoService.crear(req.usuario.id, {
                titulo: body.titulo,
                descripcion: body.descripcion,
                fechaEvento: body.fechaEvento
            });

            return res.status(201).json({
                success: true,
                message: 'Evento creado correctamente',
                data: evento
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al crear evento',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async listarGlobal(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const eventos = await EventoService.listarGlobal(req.usuario.id);

            return res.status(200).json({
                success: true,
                data: eventos
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar eventos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
