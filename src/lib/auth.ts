import jwt from 'jsonwebtoken';
import { isTokenRevoked } from './token-blacklist';

export interface AuthenticatedUser {
    id: string;
    correo: string;
    nombre: string;
}

export class AuthError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = statusCode;
    }
}

class Auth {
    private static instance: Auth;

    private constructor() {}

    static getInstance(): Auth {
        if (!Auth.instance) {
            Auth.instance = new Auth();
        }

        return Auth.instance;
    }

    extractBearerToken(authorizationHeader?: string): string {
        const token = authorizationHeader?.split(' ')[1];

        if (!token) {
            throw new AuthError(401, 'Token no proporcionado');
        }

        return token;
    }

    verifyToken(token: string): AuthenticatedUser {
        if (isTokenRevoked(token)) {
            throw new AuthError(401, 'Token revocado');
        }

        if (!process.env.JWT_SECRET) {
            throw new AuthError(500, 'JWT_SECRET no configurado en .env');
        }

        try {
            return jwt.verify(token, process.env.JWT_SECRET) as AuthenticatedUser;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError(401, 'Token expirado');
            }

            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthError(401, 'Token inválido');
            }

            throw new AuthError(500, 'Error al verificar token');
        }
    }
}

export const auth = Auth.getInstance();
