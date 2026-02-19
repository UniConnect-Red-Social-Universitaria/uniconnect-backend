import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { UsuarioModel } from '../models/usuario.model'
import { esCorreoInstitucional, validarCorreoConGoogle } from '../utils/registro.util';

export class UsuarioController {
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
                carrera: carrera.trim(),
                semestre,
                materiasCursando: materiasCursando.map((materia) => materia.trim()),
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
                    carrera: carrera.trim(),
                    semestre,
                    materiasCursando: materiasCursando.map((materia) => materia.trim()),
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
}