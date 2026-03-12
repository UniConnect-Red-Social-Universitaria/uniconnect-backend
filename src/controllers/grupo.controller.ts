import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { GrupoService } from '../services/grupo.service';
import { ServiceError } from '../services/service-error';

export class GrupoController {
    static async buscar(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar el parámetro de búsqueda "q"'
                });
            }

            const grupos = await GrupoService.buscarPorTexto(req.usuario.id, q);

            return res.status(200).json({
                success: true,
                data: grupos
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al buscar grupos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async crearMateria(req: Request, res: Response) {
        try {
            const materia = await GrupoService.crearMateria((req.body as Record<string, unknown>).nombre);

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

    static async crearGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const body = req.body as Record<string, unknown>;
            const grupo = await GrupoService.crearGrupo(req.usuario.id, body.nombre, body.materiaId);

            return res.status(201).json({
                success: true,
                message: 'Grupo creado correctamente',
                data: grupo
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

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

            const gruposFormateados = await GrupoService.listarMisGrupos(req.usuario.id);

            return res.status(200).json({
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

    static async listarDisponibles(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const gruposFormateados = await GrupoService.listarGruposDisponibles(req.usuario.id);

            return res.status(200).json({
                success: true,
                data: gruposFormateados
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar grupos disponibles',
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
            const grupoActualizado = await GrupoService.unirseGrupo(req.usuario.id, grupoId);

            return res.status(201).json({
                success: true,
                message: 'Te uniste al grupo correctamente',
                data: grupoActualizado
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya perteneces a este grupo'
                    });
                }

                if (error.code === 'P2025') {
                    return res.status(404).json({
                        success: false,
                        message: 'El grupo no existe o ya no está disponible'
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
            const body = req.body as Record<string, unknown>;
            const grupoActualizado = await GrupoService.agregarMiembro(req.usuario.id, grupoId, body.usuarioId);

            return res.status(201).json({
                success: true,
                message: 'Miembro agregado correctamente',
                data: grupoActualizado
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

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

    static async cerrarGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const grupo = await GrupoService.cerrarGrupo(req.usuario.id, grupoId);

            return res.status(200).json({
                success: true,
                message: 'Grupo cerrado correctamente',
                data: grupo
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al cerrar el grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async cambiarAdministrador(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const body = req.body as Record<string, unknown>;
            const grupo = await GrupoService.cambiarAdministrador(req.usuario.id, grupoId, body.usuarioId);

            return res.status(200).json({
                success: true,
                message: 'Administrador asignado correctamente',
                data: grupo
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId o usuarioId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al cambiar el administrador del grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async salirGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const grupo = await GrupoService.salirGrupo(req.usuario.id, grupoId);

            return res.status(200).json({
                success: true,
                message: 'Saliste del grupo correctamente',
                data: grupo
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al salir del grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async removerMiembro(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId, usuarioId } = req.params;
            const grupo = await GrupoService.removerMiembro(req.usuario.id, grupoId, usuarioId);

            return res.status(200).json({
                success: true,
                message: 'Miembro removido correctamente',
                data: grupo
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId o usuarioId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al remover miembro del grupo',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
