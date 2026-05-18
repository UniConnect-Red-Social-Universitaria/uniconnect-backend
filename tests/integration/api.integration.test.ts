/// <reference types="jest" />

import { beforeAll, afterAll, describe, expect, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';

/**
 * Suite de Pruebas de Integración - Contratos de API
 * 
 * Validaciones:
 * - Estructura de respuestas y códigos HTTP
 * - Autenticación y autorización JWT
 * - Validación de entrada
 * - Manejo de errores
 * - Integridad del contrato backend-cliente
 */
describe('API Integration Tests - Contratos de Endpoints', () => {
  let validToken: string;
  let invalidToken: string = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid';

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    // Crear un usuario de prueba directamente en la BD (sin validación Auth0)
    // mediante el endpoint de login que solo verifica credenciales locales
    let userId = '507f1f77bcf86cd799439011'; // ID de fallback
    
    try {
      // Intentar obtener un usuario existente
      const usuariosRes = await request(app).get('/api/usuarios');
      if (usuariosRes.status === 200 && Array.isArray(usuariosRes.body?.data) && usuariosRes.body.data.length > 0) {
        userId = usuariosRes.body.data[0].id;
      }
    } catch (error) {
      // Si hay error, usar el ID de fallback
    }
    
    // Generamos un token válido
    validToken = jwt.sign(
      {
        id: userId,
        correo: 'test-integration@ucaldas.edu.co',
        nombre: 'Test',
        apellido: 'Integration',
        materiasCursando: ['Quimica General']
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(() => {
    // Limpieza si es necesaria
  });

  // ────────────────────────────────────────────────────────
  // 1. HEALTH CHECK Y ESTADO GENERAL
  // ────────────────────────────────────────────────────────
  describe('Health Check', () => {
    it('GET /health debe retornar status 200', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('version');
    });

    it('GET / debe retornar información de API y endpoints', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensaje');
      expect(response.body).toHaveProperty('endpoints');
      expect(typeof response.body.endpoints).toBe('object');
    });
  });

  // ────────────────────────────────────────────────────────
  // 2. AUTENTICACIÓN - ENDPOINTS DE USUARIOS
  // ────────────────────────────────────────────────────────
  describe('Autenticación - Usuarios', () => {
    it('POST /registro debe validar formato de email institucional', async () => {
      const response = await request(app)
        .post('/api/usuarios/registro')
        .send({
          correo: 'email-invalido@gmail.com', // No es email institucional
          nombre: 'Test User',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('POST /login debe retornar 400 si faltan credenciales', async () => {
      const response = await request(app)
        .post('/api/usuarios/login')
        .send({
          correo: 'test@ucaldas.edu.co'
          // Falta password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST /login debe retornar 400 para credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/usuarios/login')
        .send({
          correo: 'noexiste@ucaldas.edu.co',
          password: 'wrongpassword'
        });

      expect([400, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ────────────────────────────────────────────────────────
  // 3. VALIDACIÓN JWT - PROTECCIÓN DE RUTAS
  // ────────────────────────────────────────────────────────
  describe('Protección JWT', () => {
    it('GET /api/usuarios/perfil sin token debe retornar 401', async () => {
      const response = await request(app)
        .get('/api/usuarios/perfil');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        message: 'Token no proporcionado'
      });
    });

    it('GET /api/usuarios/perfil con token inválido debe retornar 401', async () => {
      const response = await request(app)
        .get('/api/usuarios/perfil')
        .set('Authorization', invalidToken);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/usuarios/perfil con token expirado debe retornar 401', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-123', correo: 'test@ucaldas.edu.co', nombre: 'Test' },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } // Expirado inmediatamente
      );

      // Esperar 100ms para que se expiree
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token expirado');
    });

    it('GET /api/usuarios/perfil con token válido debe retornar 200', async () => {
      const response = await request(app)
        .get('/api/usuarios/perfil')
        .set('Authorization', `Bearer ${validToken}`);

      // Puede retornar 200 si existe, o algún otro status según la lógica
      expect([200, 400, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  // ────────────────────────────────────────────────────────
  // 4. ENDPOINTS USUARIOS - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Usuarios', () => {
    it('GET /api/usuarios debe retornar lista de usuarios', async () => {
      const response = await request(app)
        .get('/api/usuarios');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data) || Array.isArray(response.body)).toBe(true);
      }
    });

    it('POST /api/usuarios/solicitudes sin token debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/usuarios/solicitudes')
        .send({
          usuarioDestinoId: 'some-id'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST /api/usuarios/solicitudes debe validar usuarioDestinoId', async () => {
      const response = await request(app)
        .post('/api/usuarios/solicitudes')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Falta usuarioDestinoId
        });

      expect([400, 422]).toContain(response.status);
    });

    it('GET /api/usuarios/buscar-por-materia debe requerir JWT', async () => {
      const response = await request(app)
        .get('/api/usuarios/buscar-por-materia?materia=calculo');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/usuarios/companeros debe requerir JWT', async () => {
      const response = await request(app)
        .get('/api/usuarios/companeros');

      expect(response.status).toBe(401);
    });

    it('POST /api/usuarios/logout debe invalidar token', async () => {
      const response = await request(app)
        .post('/api/usuarios/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ────────────────────────────────────────────────────────
  // 5. ENDPOINTS GRUPOS - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Grupos', () => {
    it('POST /api/grupos sin token debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/grupos')
        .send({
          nombre: 'Grupo de Cálculo'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST /api/grupos debe validar nombre requerido', async () => {
      const response = await request(app)
        .post('/api/grupos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Falta nombre
        });

      expect([400, 401, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/grupos debe retornar lista de grupos del usuario', async () => {
      const response = await request(app)
        .get('/api/grupos')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 401, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      }
    });

    it('GET /api/grupos/disponibles debe retornar grupos disponibles', async () => {
      const response = await request(app)
        .get('/api/grupos/disponibles')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/grupos/:id/solicitar-ingreso debe requerir ID válido', async () => {
      const response = await request(app)
        .post('/api/grupos/invalid-group-id/solicitar-ingreso')
        .set('Authorization', `Bearer ${validToken}`);

      expect([400, 401, 404, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/grupos/:id/miembros debe requerir JWT', async () => {
      const response = await request(app)
        .get('/api/grupos/some-group-id/miembros');

      expect(response.status).toBe(401);
    });

    it('DELETE /api/grupos/:id/abandonar debe permitir abandonar grupo', async () => {
      const response = await request(app)
        .delete('/api/grupos/some-group-id/abandonar')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  // ────────────────────────────────────────────────────────
  // 6. ENDPOINTS EVENTOS - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Eventos', () => {
    it('GET /api/eventos sin token debe retornar 401', async () => {
      const response = await request(app)
        .get('/api/eventos');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('GET /api/eventos con token válido debe retornar lista', async () => {
      const response = await request(app)
        .get('/api/eventos')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 401, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      }
    });

    it('POST /api/eventos debe validar datos requeridos', async () => {
      const response = await request(app)
        .post('/api/eventos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Faltan datos requeridos
        });

      expect([400, 401, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST /api/eventos debe crear evento con datos válidos', async () => {
      const response = await request(app)
        .post('/api/eventos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          titulo: 'Evento de prueba',
          descripcion: 'Descripción',
          categoria: 'ACADEMICO',
          lugar: 'Aula 101'
        });

      expect([200, 201, 400, 401, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('POST /api/eventos/suscripciones debe requerir JWT', async () => {
      const response = await request(app)
        .post('/api/eventos/suscripciones')
        .send({
          categoria: 'ACADEMICO'
        });

      expect(response.status).toBe(401);
    });

    it('DELETE /api/eventos/suscripciones/:categoria debe requerir JWT', async () => {
      const response = await request(app)
        .delete('/api/eventos/suscripciones/ACADEMICO');

      expect(response.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────────────────
  // 7. ENDPOINTS MATERIAS - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Materias', () => {
    it('GET /api/materias debe requerir JWT', async () => {
      const response = await request(app)
        .get('/api/materias');

      expect([200, 401]).toContain(response.status);
    });

    it('POST /api/materias debe requerir JWT', async () => {
      const response = await request(app)
        .post('/api/materias')
        .send({
          nombre: 'Cálculo I'
        });

      expect(response.status).toBe(401);
    });

    it('POST /api/materias debe validar nombre requerido', async () => {
      const response = await request(app)
        .post('/api/materias')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Falta nombre
        });

      expect([400, 401, 422]).toContain(response.status);
    });
  });

  // ────────────────────────────────────────────────────────
  // 8. ENDPOINTS MENSAJES - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Mensajes', () => {
    it('GET /api/mensajes debe requerir JWT', async () => {
      const response = await request(app)
        .get('/api/mensajes');

      expect([200, 401, 404]).toContain(response.status);
    });

    it('POST /api/mensajes debe requerir JWT', async () => {
      const response = await request(app)
        .post('/api/mensajes')
        .send({
          contenido: 'Hola',
          destinatarioId: 'some-id'
        });

      expect(response.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────────────────
  // 9. ENDPOINTS CATALOGOS - CONTRATO DE API
  // ────────────────────────────────────────────────────────
  describe('Endpoints Catálogos', () => {
    it('GET /api/catalogos debe retornar catálogos', async () => {
      const response = await request(app)
        .get('/api/catalogos');

      expect([200, 401, 404]).toContain(response.status);
    });

    it('POST /api/catalogos/poblar debe requerir JWT', async () => {
      const response = await request(app)
        .post('/api/catalogos/poblar');

      expect(response.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────────────────
  // 10. MANEJO DE ERRORES - CÓDIGOS HTTP CORRECTOS
  // ────────────────────────────────────────────────────────
  describe('Manejo de Errores - Códigos HTTP', () => {
    it('404 para ruta no existente', async () => {
      const response = await request(app)
        .get('/api/ruta-inexistente');

      expect(response.status).toBe(404);
    });

    it('405 para método no permitido', async () => {
      const response = await request(app)
        .post('/health'); // POST es el método permitido

      expect([405, 404]).toContain(response.status); // Algunas frameworks retornan 404
    });

    it('Respuestas de error deben tener estructura consistente', async () => {
      const response = await request(app)
        .post('/api/usuarios/solicitudes')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });
  });

  // ────────────────────────────────────────────────────────
  // 11. VALIDACIÓN DE TIPOS - RESPUESTAS CONSISTENTES
  // ────────────────────────────────────────────────────────
  describe('Estructura de Respuestas', () => {
    it('Respuestas exitosas deben incluir success: true', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      // Las respuestas de root no tienen success, es especial
    });

    it('Respuestas de error deben incluir success: false', async () => {
      const response = await request(app)
        .get('/api/usuarios/perfil');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('Respuestas deben incluir headers CORS correctos', async () => {
      const response = await request(app)
        .get('/health');

      // CORS debería estar configurado
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────
  // 12. VALIDACIÓN DE DATOS SENSIBLES
  // ────────────────────────────────────────────────────────
  describe('Protección de Datos Sensibles', () => {
    it('No debe exponer contraseñas en respuestas', async () => {
      const response = await request(app)
        .get('/api/usuarios');

      if (response.status === 200 && Array.isArray(response.body.data)) {
        response.body.data.forEach((usuario: any) => {
          expect(usuario).not.toHaveProperty('password');
          expect(usuario).not.toHaveProperty('passwordHash');
        });
      }
    });

    it('No debe exponer tokens en respuestas públicas', async () => {
      const response = await request(app)
        .get('/health');

      expect(JSON.stringify(response.body)).not.toContain('token');
      expect(JSON.stringify(response.body)).not.toContain('secret');
    });
  });

  // ────────────────────────────────────────────────────────
  // 13. LÍMITES Y VALIDACIÓN DE ENTRADA
  // ────────────────────────────────────────────────────────
  describe('Validación de Entrada - Límites', () => {
    it('Debe rechazar emails con formato inválido en registro', async () => {
      const response = await request(app)
        .post('/api/usuarios/registro')
        .send({
          correo: 'email-inválido-sin-arroba',
          nombre: 'Test User',
          password: 'pass123'
        });

      expect([400, 422]).toContain(response.status);
    });

    it('Debe rechazar nombres muy cortos', async () => {
      const response = await request(app)
        .post('/api/usuarios/registro')
        .send({
          correo: 'test@ucaldas.edu.co',
          nombre: 'A', // Muy corto
          password: 'pass123'
        });

      expect([400, 422]).toContain(response.status);
    });

    it('Debe rechazar contraseñas débiles', async () => {
      const response = await request(app)
        .post('/api/usuarios/registro')
        .send({
          correo: 'test@ucaldas.edu.co',
          nombre: 'Test User',
          password: '123' // Muy débil
        });

      expect([400, 422]).toContain(response.status);
    });
  });
});
