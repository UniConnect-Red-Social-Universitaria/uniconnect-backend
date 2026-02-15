import { Request, Response } from 'express';
import { UsuarioModel } from '../models/usuario.model'

export class UsuarioController {
    // Crear usuario (para probar)
    static async crear(req: Request, res: Response) {
        try {
            const { nombre, apellido, correo, carrera } = req.body;

            // Validar correo de la U
            if (!correo.endsWith('@ucaldas.edu.co')) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten correos @ucaldas.edu.co'
                });
            }

            // Verificar si ya existe
            const existe = await UsuarioModel.buscarPorCorreo(correo);
            if (existe) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo ya está registrado'
                });
            }

            // Crear usuario
            const usuario = await UsuarioModel.crear({
                nombre,
                apellido,
                correo,
                carrera
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: usuario
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
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