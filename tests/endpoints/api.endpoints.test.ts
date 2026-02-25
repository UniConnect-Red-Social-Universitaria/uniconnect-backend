import request from 'supertest';
import { app } from '../../src/app';

describe('API endpoints', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  });

  it('GET / responde estado de API y endpoints', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mensaje');
    expect(response.body).toHaveProperty('endpoints');
    expect(response.body.endpoints).toHaveProperty('usuarios');
  });

  it('GET /api/usuarios/perfil sin token responde 401', async () => {
    const response = await request(app).get('/api/usuarios/perfil');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Token no proporcionado'
    });
  });

  it('POST /api/materias sin token responde 401', async () => {
    const response = await request(app).post('/api/materias').send({
      nombre: 'Cálculo I'
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Token no proporcionado'
    });
  });

  it('GET /api/grupos con token inválido responde 401', async () => {
    const response = await request(app)
      .get('/api/grupos')
      .set('Authorization', 'Bearer token_invalido');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Token inválido'
    });
  });

  it('POST /api/eventos con token inválido responde 401', async () => {
    const response = await request(app)
      .post('/api/eventos')
      .set('Authorization', 'Bearer token_invalido')
      .send({
        titulo: 'Evento prueba',
        descripcion: 'Descripción prueba'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Token inválido'
    });
  });

  it('POST /api/catalogos/poblar sin token responde 401', async () => {
    const response = await request(app).post('/api/catalogos/poblar');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Token no proporcionado'
    });
  });
});
