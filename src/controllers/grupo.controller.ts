import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MateriaModel } from '../models/materia.model';
import { GrupoModel } from '../models/grupo.model';
import { UsuarioModel } from '../models/usuario.model';

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

    static async listarMisGrupos(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const grupos = await GrupoModel.listarPorUsuario(req.usuario.id);

            const gruposFormateados = grupos.map((grupo) => ({
                id: grupo.id,
                nombre: grupo.nombre,
                materia: {
                    id: grupo.materia.id,
                    nombre: grupo.materia.nombre
                },
                creadorId: grupo.creadorId,
                cantidadMiembros: grupo.miembros.length,
                miembros: grupo.miembros.map((m) => ({
                    id: m.usuario.id,
                    nombre: m.usuario.nombre,
                    apellido: m.usuario.apellido
                })),
                createdAt: grupo.createdAt
            }));

            return res.json({
                success: true,
                data: gruposFormateados
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar grupos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async unirseGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;

            if (typeof grupoId !== 'string' || !grupoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un grupoId válido'
                });
            }

            const grupo = await GrupoModel.obtenerPorId(grupoId.trim());

            if (!grupo) {
                return res.status(404).json({
                    success: false,
                    message: 'El grupo no existe'
                });
            }

            const grupoActualizado = await GrupoModel.agregarMiembro(grupoId.trim(), req.usuario.id);

            return res.status(201).json({
                success: true,
                message: 'Te uniste al grupo correctamente',
                data: {
                    id: grupoActualizado.id,
                    nombre: grupoActualizado.nombre,
                    cantidadMiembros: grupoActualizado.miembros.length
                }
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya perteneces a este grupo'
                    });
                }

                if (error.code === 'P2023') {
                    return res.status(400).json({
                        success: false,
                        message: 'grupoId tiene formato inválido'
                    });
                }
            }

            return res.status(500).json({
                success: false,
                message: 'Error al unirse al grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async agregarMiembro(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const { usuarioId } = req.body;

            if (typeof grupoId !== 'string' || !grupoId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un grupoId válido'
                });
            }

            if (typeof usuarioId !== 'string' || !usuarioId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un usuarioId válido'
                });
            }

            const permiso = await GrupoModel.usuarioEsCreador(grupoId.trim(), req.usuario.id);

            if (!permiso.existe) {
                return res.status(404).json({
                    success: false,
                    message: 'El grupo no existe'
                });
            }

            if (!permiso.esCreador) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el creador del grupo puede agregar miembros'
                });
            }

            const usuario = await UsuarioModel.buscarPorId(usuarioId.trim());

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'El usuario a agregar no existe'
                });
            }

            const grupoActualizado = await GrupoModel.agregarMiembro(grupoId.trim(), usuarioId.trim());

            return res.status(201).json({
                success: true,
                message: 'Miembro agregado correctamente',
                data: {
                    id: grupoActualizado.id,
                    nombre: grupoActualizado.nombre,
                    cantidadMiembros: grupoActualizado.miembros.length
                }
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(409).json({
                        success: false,
                        message: 'El usuario ya pertenece a este grupo'
                    });
                }

                if (error.code === 'P2023') {
                    return res.status(400).json({
                        success: false,
                        message: 'grupoId o usuarioId tiene formato inválido'
                    });
                }
            }

            return res.status(500).json({
                success: false,
                message: 'Error al agregar miembro',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
