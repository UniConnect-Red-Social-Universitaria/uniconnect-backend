import { Request, Response } from 'express';
import { EventoModel } from '../models/evento.model';

export class EventoController {
    static async crear(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { titulo, descripcion, fechaEvento } = req.body;

            if (typeof titulo !== 'string' || !titulo.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un título válido'
                });
            }

            if (typeof descripcion !== 'string' || !descripcion.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar una descripción válida'
                });
            }

            if (typeof fechaEvento !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar fechaEvento en formato ISO'
                });
            }

            const fecha = new Date(fechaEvento);

            if (Number.isNaN(fecha.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'fechaEvento tiene formato inválido'
                });
            }

            if (fecha <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha del evento debe ser futura'
                });
            }

            const evento = await EventoModel.crear({
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                fechaEvento: fecha,
                creadorId: req.usuario.id
            });

            return res.status(201).json({
                success: true,
                message: 'Evento creado correctamente',
                data: evento
            });
        } catch (error) {
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

            const eventos = await EventoModel.listarGlobalNoVencidosDeOtros(req.usuario.id);

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
