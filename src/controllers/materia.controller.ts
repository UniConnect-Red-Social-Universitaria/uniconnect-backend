import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MateriaModel } from '../models/materia.model';

export class MateriaController {
    static async crear(req: Request, res: Response) {
        try {
            const { nombre } = req.body;

            if (typeof nombre !== 'string' || !nombre.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un nombre de materia válido'
                });
            }

            const nombreNormalizado = nombre.trim();
            const materiaExistente = await MateriaModel.buscarPorNombre(nombreNormalizado);

            if (materiaExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'La materia ya existe'
                });
            }

            const materia = await MateriaModel.crear(nombreNormalizado);

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
            const materias = await MateriaModel.listarTodas();

            return res.json({
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
