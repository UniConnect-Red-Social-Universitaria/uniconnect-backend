import { Request, Response } from 'express';
import { CatalogoService } from '../services/catalogo.service';

export class CatalogoController {
    static async poblar(req: Request, res: Response) {
        try {
            const data = await CatalogoService.poblar();

            return res.status(201).json({
                success: true,
                message: 'Catálogo oficial cargado',
                data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al poblar catálogos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const data = await CatalogoService.listar();

            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar catálogos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
