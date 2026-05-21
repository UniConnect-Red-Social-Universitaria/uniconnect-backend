import { describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

import { BcryptPasswordService } from '../src/modules/users/infrastructure/bcrypt-password.service';

const service = new BcryptPasswordService();

describe('BcryptPasswordService', () => {
    it('hash: genera hash y compare: verifica coincidencia', async () => {
        const hash = await service.hash('mi-contrasena');
        expect(hash).not.toBe('mi-contrasena');
        expect(hash).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix

        const match = await service.compare('mi-contrasena', hash);
        expect(match).toBe(true);
    });

    it('compare: retorna false si no coincide', async () => {
        const hash = await bcrypt.hash('otra', 4);
        const match = await service.compare('mi-contrasena', hash);
        expect(match).toBe(false);
    });
});
