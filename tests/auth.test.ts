import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

jest.mock('../src/lib/token-blacklist', () => ({
    isTokenRevoked: jest.fn(),
}));

import { auth, AuthError } from '../src/lib/auth';
import { isTokenRevoked } from '../src/lib/token-blacklist';

const mockedIsTokenRevoked = isTokenRevoked as jest.MockedFunction<typeof isTokenRevoked>;

describe('Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.JWT_SECRET;
        mockedIsTokenRevoked.mockReturnValue(false);
    });

    describe('singleton', () => {
        it('exporta una instancia con los métodos esperados', () => {
            expect(auth).toBeDefined();
            expect(typeof auth.extractBearerToken).toBe('function');
            expect(typeof auth.verifyToken).toBe('function');
        });
    });

    describe('extractBearerToken', () => {
        it('extrae el token del header Authorization', () => {
            const token = auth.extractBearerToken('Bearer mi-token');
            expect(token).toBe('mi-token');
        });

        it('lanza AuthError(401) si no hay header', () => {
            expect(() => auth.extractBearerToken(undefined)).toThrow(AuthError);
            expect(() => auth.extractBearerToken(undefined)).toThrow('Token no proporcionado');
        });

        it('lanza AuthError(401) si el token está vacío', () => {
            expect(() => auth.extractBearerToken('Bearer ')).toThrow(AuthError);
            expect(() => auth.extractBearerToken('Bearer ')).toThrow('Token no proporcionado');
        });
    });

    describe('verifyToken', () => {
        const payload = { id: 'user-1', correo: 'test@test.com', nombre: 'Test' };

        it('verifica un token válido', () => {
            process.env.JWT_SECRET = 'secret';
            jest.spyOn(jwt, 'verify').mockReturnValue(payload as any);

            const result = auth.verifyToken('token-valido');
            expect(result).toEqual(payload);
        });

        it('lanza AuthError(401) si el token está revocado', () => {
            mockedIsTokenRevoked.mockReturnValue(true);
            expect(() => auth.verifyToken('token-revocado')).toThrow('Token revocado');
        });

        it('lanza AuthError(500) si JWT_SECRET no está configurado', () => {
            expect(() => auth.verifyToken('token')).toThrow('JWT_SECRET no configurado en .env');
        });

        it('lanza AuthError(401) si el token expiró', () => {
            process.env.JWT_SECRET = 'secret';
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new jwt.TokenExpiredError('expirado', new Date()); });
            expect(() => auth.verifyToken('token-expirado')).toThrow('Token expirado');
        });

        it('lanza AuthError(401) si el token es inválido', () => {
            process.env.JWT_SECRET = 'secret';
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new jwt.JsonWebTokenError('invalido'); });
            expect(() => auth.verifyToken('token-invalido')).toThrow('Token inválido');
        });

        it('lanza AuthError(500) si ocurre otro error', () => {
            process.env.JWT_SECRET = 'secret';
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('otro error'); });
            expect(() => auth.verifyToken('token-error')).toThrow('Error al verificar token');
        });
    });
});
