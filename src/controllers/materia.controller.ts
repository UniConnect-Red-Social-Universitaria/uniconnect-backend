import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MateriaService } from '../services/materia.service';
import { ServiceError } from '../services/service-error';

export class MateriaController {
    static async crear(req: Request, res: Response) {
        try {
            const materia = await MateriaService.crear((req.body as Record<string, unknown>).nombre);

            return res.status(201).json({
                success: true,
                message: 'Materia creada correctamente',
                data: {
                    id: materia.id,
                    nombre: materia.nombre,
                    createdAt: materia.createdAt
                }
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'La materia ya existe'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al crear materia',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const materias = await MateriaService.listar();

            return res.status(200).json({
                success: true,
                data: materias
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar materias',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
