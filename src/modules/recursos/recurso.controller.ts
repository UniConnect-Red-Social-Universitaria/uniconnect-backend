import { Request, Response } from 'express';
import { recursoService } from './recurso.service';

export class RecursoController {
    async crearRecurso(req: Request, res: Response) {
        try {
            const { titulo, contenido, tipo, metadata, grupoId } = req.body;
            const creadorId = req.usuario?.id || req.body.creadorId; // Asegurar tener el ID del creador

            if (!creadorId) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const recurso = await recursoService.crearRecurso({
                titulo,
                contenido,
                tipo,
                metadata,
                grupoId,
                creadorId
            });

            res.status(201).json(recurso);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async obtenerRecursos(req: Request, res: Response) {
        try {
            const { grupoId } = req.params;
            const recursos = await recursoService.obtenerRecursos(grupoId as string);
            res.json(recursos);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async editarRecurso(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const usuarioId = req.usuario?.id;

            if (!usuarioId) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const recurso = await recursoService.editarRecurso(id as string, data, usuarioId);
            res.json(recurso);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async eliminarRecurso(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario?.id;

            if (!usuarioId) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            await recursoService.eliminarRecurso(id as string, usuarioId);
            res.status(200).json({ message: 'Recurso eliminado correctamente' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const recursoController = new RecursoController();