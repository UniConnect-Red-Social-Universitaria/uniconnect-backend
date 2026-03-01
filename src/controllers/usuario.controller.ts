import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { UsuarioModel } from '../models/usuario.model'
import { ContactoModel } from '../models/contacto.model';
import { esCorreoInstitucional, validarCorreoConGoogle } from '../utils/registro.util';
import { revokeToken } from '../lib/token-blacklist';
import { CarreraModel } from '../models/carrera.model';
import { MateriaModel } from '../models/materia.model';

export class UsuarioController {
    private static extraerMateriaBusqueda(req: Request): string | null {
        const queryMateria = typeof req.query.materia === 'string' ? req.query.materia : null;
        const queryQ = typeof req.query.q === 'string' ? req.query.q : null;

        const body = (req.body ?? {}) as Record<string, unknown>;
        const bodyMateria = typeof body.materia === 'string' ? body.materia : null;
        const bodyQ = typeof body.q === 'string'
            ? body.q
            : typeof body.query === 'string'
                ? body.query
                : null;

        const materia = queryMateria ?? queryQ ?? bodyMateria ?? bodyQ;

        if (!materia || !materia.trim()) {
            return null;
        }

        return materia.trim();
    }

    // Buscar estudiantes por materia (excluye solo al usuario autenticado)
    static async buscarPorMateria(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const materia = UsuarioController.extraerMateriaBusqueda(req);

            if (!materia) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar la materia a buscar en "materia" o "q"'
                });
            }

            const resultados = await UsuarioModel.buscarPorMateriaExcluyendo(materia, req.usuario.id, []);

            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al buscar estudiantes por materia',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Enviar solicitud de conexión
    static async enviarSolicitudConexion(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { usuarioDestinoId } = req.body;

            if (!usuarioDestinoId || typeof usuarioDestinoId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'usuarioDestinoId es obligatorio'
                });
            }

            if (usuarioDestinoId === req.usuario.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes enviarte solicitud a ti mismo'
                });
            }

            const usuarioDestino = await UsuarioModel.buscarPorId(usuarioDestinoId);

            if (!usuarioDestino) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario destino inexistente'
                });
            }

            const relacionExistente = await ContactoModel.existeRelacionEntreUsuarios(req.usuario.id, usuarioDestinoId);

            if (relacionExistente) {
                if (relacionExistente.estado === 'ACEPTADA') {
                    return res.status(409).json({
                        success: false,
                        message: 'Este compañero ya está agregado'
                    });
                }

                return res.status(409).json({
                    success: false,
                    message: 'Ya existe una solicitud de conexión entre estos usuarios'
                });
            }

            const solicitud = await ContactoModel.crearSolicitud(req.usuario.id, usuarioDestinoId);

            res.status(201).json({
                success: true,
                message: 'Solicitud de conexión enviada',
                data: {
                    id: solicitud.id,
                    estado: solicitud.estado,
                    solicitanteId: solicitud.solicitanteId,
                    receptorId: solicitud.receptorId,
                    createdAt: solicitud.createdAt
                }
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'usuarioDestinoId tiene formato inválido'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al enviar solicitud de conexión',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Listar compañeros agregados (solo relaciones aceptadas)
    static async listarCompaneros(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const companeros = await ContactoModel.listarCompanerosAceptados(req.usuario.id);

            res.json({
                success: true,
                data: companeros
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al listar compañeros',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Listar solicitudes recibidas (pendientes)
    static async listarSolicitudesRecibidas(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const solicitudes = await ContactoModel.listarSolicitudesRecibidas(req.usuario.id);

            res.json({
                success: true,
                data: solicitudes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al listar solicitudes recibidas',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Aceptar solicitud de conexión
    static async aceptarSolicitud(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { solicitudId } = req.body;

            if (!solicitudId || typeof solicitudId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'solicitudId es obligatorio'
                });
            }

            const solicitudActualizada = await ContactoModel.aceptarSolicitud(solicitudId, req.usuario.id);

            res.json({
                success: true,
                message: 'Solicitud aceptada correctamente',
                data: {
                    id: solicitudActualizada.id,
                    estado: solicitudActualizada.estado,
                    updatedAt: solicitudActualizada.updatedAt
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Solicitud no encontrada') {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }

                if (error.message === 'No tienes permiso para aceptar esta solicitud' || error.message === 'La solicitud ya fue procesada') {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                }
            }

            res.status(500).json({
                success: false,
                message: 'Error al aceptar solicitud',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Rechazar solicitud de conexión
    static async rechazarSolicitud(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { solicitudId } = req.body;

            if (!solicitudId || typeof solicitudId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'solicitudId es obligatorio'
                });
            }

            const solicitudRechazada = await ContactoModel.rechazarSolicitud(solicitudId, req.usuario.id);

            res.json({
                success: true,
                message: 'Solicitud rechazada correctamente',
                data: {
                    id: solicitudRechazada.id,
                    estado: solicitudRechazada.estado,
                    updatedAt: solicitudRechazada.updatedAt
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Solicitud no encontrada') {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }

                if (error.message === 'No tienes permiso para rechazar esta solicitud' || error.message === 'La solicitud ya fue procesada') {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                }
            }

            res.status(500).json({
                success: false,
                message: 'Error al rechazar solicitud',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Registrar usuario
    static async registrar(req: Request, res: Response) {
        try {
            const {
                nombre,
                apellido,
                correo,
                contrasena,
                carrera,
                semestre,
                materiasCursando,
                googleIdToken
            } = req.body;

            if (!nombre || !apellido || !correo || !contrasena || !carrera || semestre === undefined || !materiasCursando || !googleIdToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios para el registro'
                });
            }

            if (typeof nombre !== 'string' || typeof apellido !== 'string' || typeof correo !== 'string' || typeof contrasena !== 'string' || typeof carrera !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Formato inválido en los campos de texto'
                });
            }

            if (!Number.isInteger(semestre) || semestre <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El semestre debe ser un número entero mayor a 0'
                });
            }

            if (!Array.isArray(materiasCursando) || materiasCursando.length === 0 || materiasCursando.some((materia) => typeof materia !== 'string' || !materia.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar al menos una materia válida'
                });
            }

            const [cantidadCarreras, cantidadMaterias] = await Promise.all([
                CarreraModel.contar(),
                MateriaModel.contar()
            ]);

            const carreraNormalizada = carrera.trim();
            const materiasNormalizadas = materiasCursando.map((materia) => materia.trim());

            let carreraCatalogo: { id: string; nombre: string } | null = null;

            if (cantidadCarreras > 0) {
                carreraCatalogo = await CarreraModel.buscarPorNombre(carreraNormalizada);

                if (!carreraCatalogo) {
                    return res.status(400).json({
                        success: false,
                        message: 'La carrera no existe en el catálogo oficial'
                    });
                }
            }

            if (cantidadMaterias > 0) {
                const materiasCatalogo = await MateriaModel.listarTodas();
                const setMaterias = new Set(materiasCatalogo.map((materia) => materia.nombre.toLowerCase()));
                const materiaInvalida = materiasNormalizadas.find(
                    (materia) => !setMaterias.has(materia.toLowerCase())
                );

                if (materiaInvalida) {
                    return res.status(400).json({
                        success: false,
                        message: `La materia "${materiaInvalida}" no existe en el catálogo oficial`
                    });
                }
            }

            if (contrasena.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener mínimo 8 caracteres'
                });
            }

            // Validar correo de la U
            if (!esCorreoInstitucional(correo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten correos institucionales'
                });
            }

            let verificacionGoogle;
            
            if (process.env.DEV_MODE === 'true') {
                // Modo desarrollo: saltarse validación Google
                verificacionGoogle = {
                    correoVerificado: true,
                    googleSub: `dev-${Date.now()}`
                };
            } else {
                // Modo producción: validar Google
                verificacionGoogle = await validarCorreoConGoogle(googleIdToken, correo);
            }

            // Verificar si ya existe
            const existe = await UsuarioModel.buscarPorCorreo(correo);
            if (existe) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo ya está registrado'
                });
            }

            const contrasenaHash = await bcrypt.hash(contrasena, 10);

            // Crear usuario
            const usuario = await UsuarioModel.crear({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                correo: correo.trim().toLowerCase(),
                contrasenaHash,
                carrera: carreraNormalizada,
                carreraId: carreraCatalogo?.id,
                semestre,
                materiasCursando: materiasNormalizadas,
                correoVerificado: verificacionGoogle.correoVerificado,
                googleSub: verificacionGoogle.googleSub
            });

            res.status(201).json({
                success: true,
                message: 'Registro completado correctamente',
                data: {
                    id: usuario.id,
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    correo: correo.trim().toLowerCase(),
                    carrera: carreraNormalizada,
                    semestre,
                    materiasCursando: materiasNormalizadas,
                    correoVerificado: verificacionGoogle.correoVerificado,
                    createdAt: usuario.createdAt
                }
            });

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'El correo ya está registrado'
                });
            }

            if (error instanceof Error && (error.message.includes('Google') || error.message.includes('correo'))) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al registrar usuario',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Obtener todos los usuarios
    static async obtenerTodos(req: Request, res: Response) {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.json({
                success: true,
                data: usuarios
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios'
            });
        }
    }

    // Logout: invalida el token actual
    static async logout(req: Request, res: Response) {
        try {
            if (!req.token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }

            const decoded = jwt.decode(req.token) as { exp?: number } | null;

            if (!decoded?.exp) {
                return res.status(400).json({
                    success: false,
                    message: 'No fue posible invalidar el token'
                });
            }

            revokeToken(req.token, decoded.exp);

            return res.json({
                success: true,
                message: 'Sesión cerrada correctamente'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Login: autenticar usuario con correo y contraseña
    static async login(req: Request, res: Response) {
        try {
            const { correo, contrasena } = req.body;

            // Validar campos
            if (!correo || !contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo y contraseña son requeridos'
                });
            }

            if (typeof correo !== 'string' || typeof contrasena !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Formato inválido'
                });
            }

            // Buscar usuario por correo (con contraseña hash)
            const usuario = await UsuarioModel.buscarPorCorreoConContrasena(correo.trim().toLowerCase());
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos'
                });
            }

            // Validar contraseña
            const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash as string);
            
            if (!contrasenaValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos'
                });
            }

            // Generar JWT
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET no configurado en .env');
            }

            const token = jwt.sign(
                {
                    id: usuario.id,
                    correo: usuario.correo,
                    nombre: usuario.nombre
                },
                process.env.JWT_SECRET,
                { expiresIn: (process.env.JWT_EXPIRES_IN ?? '30d') as SignOptions['expiresIn'] }
            );

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo: usuario.correo,
                        carrera: usuario.carrera
                    }
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Obtener perfil del usuario autenticado (protegido)
    static async obtenerPerfil(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const usuario = await UsuarioModel.obtenerPorIdSeguro(req.usuario.id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    // Actualizar perfil del usuario autenticado (protegido)
    static async actualizarPerfil(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { carrera, semestre, materiasCursando } = req.body;

            const materiaCatalogo = await MateriaModel.listarTodas();
            const setMaterias = new Set(materiaCatalogo.map((materia) => materia.nombre.toLowerCase()));
            const cantidadCarreras = await CarreraModel.contar();

            let carreraId: string | undefined;

            // Validaciones
            if (carrera !== undefined && typeof carrera !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Carrera debe ser texto'
                });
            }

            if (typeof carrera === 'string' && cantidadCarreras > 0) {
                const carreraCatalogo = await CarreraModel.buscarPorNombre(carrera.trim());

                if (!carreraCatalogo) {
                    return res.status(400).json({
                        success: false,
                        message: 'La carrera no existe en el catálogo oficial'
                    });
                }

                carreraId = carreraCatalogo.id;
            }

            if (semestre !== undefined && (!Number.isInteger(semestre) || semestre <= 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Semestre debe ser un número entero mayor a 0'
                });
            }

            if (materiasCursando !== undefined) {
                if (!Array.isArray(materiasCursando) || materiasCursando.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Materias debe ser un array no vacío'
                    });
                }

                if (materiasCursando.some((materia) => typeof materia !== 'string' || !materia.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Todas las materias deben ser textos válidos'
                    });
                }

                if (setMaterias.size > 0) {
                    const materiaInvalida = materiasCursando.find(
                        (materia) => !setMaterias.has(String(materia).trim().toLowerCase())
                    );

                    if (materiaInvalida) {
                        return res.status(400).json({
                            success: false,
                            message: `La materia "${String(materiaInvalida)}" no existe en el catálogo oficial`
                        });
                    }
                }
            }

            // Actualizar
            const usuarioActualizado = await UsuarioModel.actualizar(req.usuario.id, {
                carrera: carrera?.trim(),
                carreraId,
                semestre,
                materiasCursando: materiasCursando?.map((m: string) => m.trim())
            });

            const usuarioDinamico = usuarioActualizado as unknown as Record<string, unknown>;

            res.json({
                success: true,
                message: 'Perfil actualizado correctamente',
                data: {
                    id: usuarioActualizado.id,
                    nombre: usuarioActualizado.nombre,
                    apellido: usuarioActualizado.apellido,
                    correo: usuarioActualizado.correo,
                    carrera: usuarioActualizado.carrera,
                    semestre: typeof usuarioDinamico.semestre === 'number' ? usuarioDinamico.semestre : null,
                    materiasCursando: Array.isArray(usuarioDinamico.materiasCursando)
                        ? (usuarioDinamico.materiasCursando as string[])
                        : [],
                    correoVerificado: typeof usuarioDinamico.correoVerificado === 'boolean'
                        ? usuarioDinamico.correoVerificado
                        : false,
                    updatedAt: usuarioActualizado.updatedAt
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar perfil',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}