/// <reference types="jest" />

import { describe, expect, it, beforeAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';

describe('Endpoints de recursos', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
    });

    it('GET /api/recursos/grupo/:grupoId requiere JWT', async () => {
        const response = await request(app).get('/api/recursos/grupo/grupo-1');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
    });

    it('POST /api/recursos requiere JWT', async () => {
        const response = await request(app).post('/api/recursos').send({
            titulo: 'Clase 1',
            contenido: 'https://example.com',
            grupoId: 'grupo-1',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
    });
});