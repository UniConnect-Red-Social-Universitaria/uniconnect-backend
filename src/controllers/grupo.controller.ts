import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MateriaModel } from '../models/materia.model';
import { GrupoModel } from '../models/grupo.model';

export class GrupoController {
    static async crearMateria(req: Request, res: Response) {
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

    static async crearGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { nombre, materiaId } = req.body;

            if (typeof nombre !== 'string' || !nombre.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un nombre de grupo válido'
                });
            }

            if (typeof materiaId !== 'string' || !materiaId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un materiaId válido'
                });
            }

            const materia = await MateriaModel.buscarPorId(materiaId.trim());

            if (!materia) {
                return res.status(404).json({
                    success: false,
                    message: 'La materia asociada no existe'
                });
            }

            const grupo = await GrupoModel.crear({
                nombre: nombre.trim(),
                materiaId: materia.id,
                creadorId: req.usuario.id
            });

            return res.status(201).json({
                success: true,
                message: 'Grupo creado correctamente',
                data: {
                    id: grupo.id,
                    nombre: grupo.nombre,
                    materia: grupo.materia,
                    creadorId: grupo.creadorId,
                    cantidadMiembros: grupo.miembros.length,
                    createdAt: grupo.createdAt
                }
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'materiaId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al crear grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
