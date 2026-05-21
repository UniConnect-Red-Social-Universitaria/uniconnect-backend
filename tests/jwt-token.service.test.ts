import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

import { JwtTokenService } from '../src/modules/users/infrastructure/jwt-token.service';

const service = new JwtTokenService();

describe('JwtTokenService', () => {
    beforeEach(() => { delete process.env.JWT_SECRET; delete process.env.JWT_EXPIRES_IN; });

    it('sign: lanza error si JWT_SECRET no esta configurado', () => {
        expect(() => service.sign({ id: 'u-1', correo: 't@t.com', nombre: 'T' })).toThrow('JWT_SECRET no configurado');
    });

    it('sign: genera token con JWT_SECRET y expiracion por defecto', () => {
        process.env.JWT_SECRET = 'secret';
        const token = service.sign({ id: 'u-1', correo: 't@t.com', nombre: 'T' });
        expect(typeof token).toBe('string');
        const decoded = jwt.decode(token) as any;
        expect(decoded.id).toBe('u-1');
        expect(decoded.exp - decoded.iat).toBeCloseTo(30 * 24 * 60 * 60, -2);
    });

    it('sign: usa JWT_EXPIRES_IN si esta configurado', () => {
        process.env.JWT_SECRET = 'secret';
        process.env.JWT_EXPIRES_IN = '7d';
        const token = service.sign({ id: 'u-1', correo: 't@t.com', nombre: 'T' });
        const decoded = jwt.decode(token) as any;
        expect(decoded.exp - decoded.iat).toBeCloseTo(7 * 24 * 60 * 60, -2);
    });

    it('decodeExpiration: retorna exp del token', () => {
        process.env.JWT_SECRET = 'secret';
        const token = service.sign({ id: 'u-1', correo: 't@t.com', nombre: 'T' });
        const exp = service.decodeExpiration(token);
        expect(typeof exp).toBe('number');
    });

    it('decodeExpiration: retorna null si el token no tiene exp', () => {
        const token = jwt.sign({ id: 'u-1' }, 'anysecret', { noTimestamp: true });
        const extraService = new JwtTokenService();
        const result = extraService.decodeExpiration(token);
        expect(result).toBeNull();
    });

    it('decodeExpiration: retorna null si el token es invalido', () => {
        const result = service.decodeExpiration('token-invalido');
        expect(result).toBeNull();
    });
});
