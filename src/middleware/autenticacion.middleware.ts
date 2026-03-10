import { Request, Response, NextFunction } from 'express';
import { auth, AuthenticatedUser, AuthError } from '../lib/auth';
import { handler } from '../lib/handler';
import { logger } from '../lib/logger';

export type UsuarioAutenticado = AuthenticatedUser;

declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioAutenticado;
            token?: string;
            requestId?: string;
        }
    }
}

export function verificarJWT(req: Request, res: Response, next: NextFunction) {
    try {
        const token = auth.extractBearerToken(req.headers.authorization);
        const decoded = auth.verifyToken(token);
        
        req.usuario = decoded;
        req.token = token;
        next();

    } catch (error) {
        if (error instanceof AuthError) {
            if (error.statusCode >= 500) {
                logger.critical('Fallo crítico al verificar token', {
                    requestId: req.requestId,
                    error: error.message
                });
            } else {
                logger.warning('Token rechazado', {
                    requestId: req.requestId,
                    error: error.message
                });
            }

            return handler.failure(res, error.statusCode, error.message);
        }

        logger.error('Error inesperado en autenticación', {
            requestId: req.requestId,
            error
        });
        return handler.failure(res, 500, 'Error al verificar token', {
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
}
