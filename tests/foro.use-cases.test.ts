jest.mock('../src/modules/foro/application/validacion/ForoChainFactory');

import { crearCadenaForo } from '../src/modules/foro/application/validacion/ForoChainFactory';
import { ForoUseCases } from '../src/modules/foro/application/foro.use-cases';
import type { IForoRepository, ForoPreguntaDTO, ForoRespuestaDTO } from '../src/modules/foro/domain/IForoHandler';

const mockCrearCadenaForo = crearCadenaForo as jest.Mock;

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: ['Cálculo'] };

const PREGUNTA_MOCK: ForoPreguntaDTO = {
  id: 'preg-1',
  titulo: 'Título de prueba',
  contenido: 'Contenido válido de la pregunta',
  autorId: 'user-1',
  autorNombre: 'Test',
  materiaId: 'mat-1',
  createdAt: new Date(),
};

const RESPUESTA_MOCK: ForoRespuestaDTO = {
  id: 'resp-1',
  contenido: 'Respuesta de prueba con contenido',
  autorId: 'user-1',
  autorNombre: 'Test',
  preguntaId: 'preg-1',
  puntuacion: 0,
  createdAt: new Date(),
};

function makeRepo(overrides: Partial<IForoRepository> = {}): IForoRepository {
  return {
    crearPregunta: jest.fn().mockResolvedValue(PREGUNTA_MOCK),
    crearRespuesta: jest.fn().mockResolvedValue(RESPUESTA_MOCK),
    registrarVoto: jest.fn().mockResolvedValue({ ...RESPUESTA_MOCK, puntuacion: 1 }),
    obtenerPreguntasPorMateria: jest.fn().mockResolvedValue([PREGUNTA_MOCK]),
    obtenerRespuestasPorPregunta: jest.fn().mockResolvedValue([RESPUESTA_MOCK]),
    ...overrides,
  };
}

function cadenaValida() {
  mockCrearCadenaForo.mockReturnValue({ manejar: jest.fn().mockResolvedValue({ valido: true }) });
}

function cadenaInvalida(error: string) {
  mockCrearCadenaForo.mockReturnValue({ manejar: jest.fn().mockResolvedValue({ valido: false, error }) });
}

describe('ForoUseCases', () => {

  // ─── publicarPregunta ─────────────────────────────────────────────────────

  describe('publicarPregunta', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(undefined, 'mat-1', 'Título válido', 'Contenido')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si materiaId está vacío', async () => {
      cadenaValida();
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, '   ', 'Título', 'Contenido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el título tiene menos de 5 caracteres', async () => {
      cadenaValida();
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, 'mat-1', 'Hi', 'Contenido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el título no es string', async () => {
      cadenaValida();
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, 'mat-1', 12345, 'Contenido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el contenido no es string', async () => {
      cadenaValida();
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, 'mat-1', 'Título válido', null)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 403 si la cadena de validación rechaza por falta de matrícula', async () => {
      cadenaInvalida('No tienes matrícula activa en esta asignatura');
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, 'mat-1', 'Título válido', 'Contenido extenso')).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 404 si la cadena rechaza porque la asignatura no existe', async () => {
      cadenaInvalida('La asignatura no existe');
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarPregunta(USUARIO, 'mat-inexistente', 'Título válido', 'Contenido')).rejects.toMatchObject({ status: 404 });
    });

    it('publica la pregunta correctamente cuando todo es válido', async () => {
      cadenaValida();
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.publicarPregunta(USUARIO, 'mat-1', 'Título válido', 'Contenido extenso');
      expect(repo.crearPregunta).toHaveBeenCalledWith(expect.objectContaining({
        autorId: 'user-1',
        materiaId: 'mat-1',
        titulo: 'Título válido',
      }));
      expect(result.data).toEqual(PREGUNTA_MOCK);
    });

    it('hace trim al título y contenido antes de guardar', async () => {
      cadenaValida();
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      await uc.publicarPregunta(USUARIO, 'mat-1', '  Título con espacios  ', '  Contenido con espacios  ');
      expect(repo.crearPregunta).toHaveBeenCalledWith(expect.objectContaining({
        titulo: 'Título con espacios',
        contenido: 'Contenido con espacios',
      }));
    });
  });

  // ─── publicarRespuesta ────────────────────────────────────────────────────

  describe('publicarRespuesta', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarRespuesta(undefined, 'mat-1', 'preg-1', 'Contenido')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si materiaId está vacío', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarRespuesta(USUARIO, '', 'preg-1', 'Contenido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si preguntaId está vacío', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarRespuesta(USUARIO, 'mat-1', '  ', 'Contenido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el contenido no es string', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarRespuesta(USUARIO, 'mat-1', 'preg-1', 999)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 403 si el usuario no tiene matrícula', async () => {
      cadenaInvalida('No tienes matrícula activa en esta asignatura');
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.publicarRespuesta(USUARIO, 'mat-1', 'preg-1', 'Contenido extenso')).rejects.toMatchObject({ status: 403 });
    });

    it('publica la respuesta correctamente', async () => {
      cadenaValida();
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.publicarRespuesta(USUARIO, 'mat-1', 'preg-1', 'Respuesta válida extensa');
      expect(repo.crearRespuesta).toHaveBeenCalledWith(expect.objectContaining({
        autorId: 'user-1',
        preguntaId: 'preg-1',
        materiaId: 'mat-1',
      }));
      expect(result.data).toEqual(RESPUESTA_MOCK);
    });
  });

  // ─── votarRespuesta ───────────────────────────────────────────────────────

  describe('votarRespuesta', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.votarRespuesta(undefined, 'resp-1', 1)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si respuestaId está vacío', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.votarRespuesta(USUARIO, '  ', 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el valor del voto no es 1 ni -1', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.votarRespuesta(USUARIO, 'resp-1', 0)).rejects.toMatchObject({ status: 400 });
      await expect(uc.votarRespuesta(USUARIO, 'resp-1', 2)).rejects.toMatchObject({ status: 400 });
    });

    it('registra voto positivo correctamente', async () => {
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.votarRespuesta(USUARIO, 'resp-1', 1);
      expect(repo.registrarVoto).toHaveBeenCalledWith('user-1', 'resp-1', 1);
      expect(result.data.puntuacion).toBe(1);
    });

    it('registra voto negativo correctamente', async () => {
      const repo = makeRepo({
        registrarVoto: jest.fn().mockResolvedValue({ ...RESPUESTA_MOCK, puntuacion: -1 }),
      });
      const uc = new ForoUseCases(repo);
      const result = await uc.votarRespuesta(USUARIO, 'resp-1', -1);
      expect(repo.registrarVoto).toHaveBeenCalledWith('user-1', 'resp-1', -1);
      expect(result.data.puntuacion).toBe(-1);
    });
  });

  // ─── obtenerForo ──────────────────────────────────────────────────────────

  describe('obtenerForo', () => {
    it('lanza 400 si materiaId no es string', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.obtenerForo(null)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiaId está vacío', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.obtenerForo('  ')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna las preguntas de la materia', async () => {
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.obtenerForo('mat-1');
      expect(repo.obtenerPreguntasPorMateria).toHaveBeenCalledWith('mat-1');
      expect(result.data).toEqual([PREGUNTA_MOCK]);
    });
  });

  // ─── obtenerRespuestas ────────────────────────────────────────────────────

  describe('obtenerRespuestas', () => {
    it('lanza 400 si preguntaId no es string', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.obtenerRespuestas(USUARIO, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si preguntaId está vacío', async () => {
      const uc = new ForoUseCases(makeRepo());
      await expect(uc.obtenerRespuestas(USUARIO, '   ')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna las respuestas de la pregunta pasando el usuarioId', async () => {
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.obtenerRespuestas(USUARIO, 'preg-1');
      expect(repo.obtenerRespuestasPorPregunta).toHaveBeenCalledWith('preg-1', 'user-1');
      expect(result.data).toEqual([RESPUESTA_MOCK]);
    });

    it('funciona sin usuario autenticado (pasa undefined como userId)', async () => {
      const repo = makeRepo();
      const uc = new ForoUseCases(repo);
      const result = await uc.obtenerRespuestas(undefined, 'preg-1');
      expect(repo.obtenerRespuestasPorPregunta).toHaveBeenCalledWith('preg-1', undefined);
      expect(result.data).toEqual([RESPUESTA_MOCK]);
    });
  });
});
