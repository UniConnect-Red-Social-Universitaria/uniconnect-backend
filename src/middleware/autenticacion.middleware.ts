import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenRevoked } from '../lib/token-blacklist';

export interface UsuarioAutenticado {
    id: string;
    correo: string;
    nombre: string;
}

declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioAutenticado;
            token?: string;
        }
    }
}

export function verificarJWT(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        if (isTokenRevoked(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token revocado'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no configurado en .env');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as UsuarioAutenticado;
        
        req.usuario = decoded;
        req.token = token;
        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al verificar token',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
}
