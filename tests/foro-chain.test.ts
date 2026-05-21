const prismaMock = {
  usuario: { findUnique: jest.fn() },
  materia: { findUnique: jest.fn() },
};

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
}));

import { ValidarAutenticacionForoHandler } from '../src/modules/foro/application/validacion/ValidarAutenticacionForoHandler';
import { ValidarMatriculaForoHandler } from '../src/modules/foro/application/validacion/ValidarMatriculaForoHandler';
import { ValidarContenidoForoHandler } from '../src/modules/foro/application/validacion/ValidarContenidoForoHandler';
import { crearCadenaForo } from '../src/modules/foro/application/validacion/ForoChainFactory';
import type { ForoContexto } from '../src/modules/foro/domain/IForoHandler';

const CTX: ForoContexto = {
  usuarioId: 'user-1',
  materiaId: 'mat-1',
  contenido: 'Contenido válido para la prueba',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chain of Responsibility — Foro', () => {

  // ─── ValidarAutenticacionForoHandler ──────────────────────────────────────

  describe('ValidarAutenticacionForoHandler', () => {
    it('rechaza cuando usuarioId está vacío', async () => {
      const handler = new ValidarAutenticacionForoHandler();
      const resultado = await handler.manejar({ ...CTX, usuarioId: '' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/autenticad/i);
    });

    it('rechaza cuando el usuario no existe en la base de datos', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      const handler = new ValidarAutenticacionForoHandler();
      const resultado = await handler.manejar({ ...CTX, usuarioId: 'no-existe' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/usuario no encontrado/i);
    });

    it('aprueba cuando el usuario existe', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 'user-1' });
      const handler = new ValidarAutenticacionForoHandler();
      const resultado = await handler.manejar(CTX);
      expect(resultado.valido).toBe(true);
    });
  });

  // ─── ValidarMatriculaForoHandler ──────────────────────────────────────────

  describe('ValidarMatriculaForoHandler', () => {
    it('rechaza cuando la asignatura no existe', async () => {
      prismaMock.materia.findUnique.mockResolvedValue(null);
      const handler = new ValidarMatriculaForoHandler();
      const resultado = await handler.manejar(CTX);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/asignatura no existe/i);
    });

    it('rechaza cuando el usuario no está matriculado', async () => {
      prismaMock.materia.findUnique.mockResolvedValue({ nombre: 'Cálculo' });
      prismaMock.usuario.findUnique.mockResolvedValue({ materiasCursando: ['Física'] });
      const handler = new ValidarMatriculaForoHandler();
      const resultado = await handler.manejar(CTX);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/matrícula/i);
    });

    it('rechaza cuando el usuario no existe', async () => {
      prismaMock.materia.findUnique.mockResolvedValue({ nombre: 'Cálculo' });
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      const handler = new ValidarMatriculaForoHandler();
      const resultado = await handler.manejar(CTX);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/matrícula/i);
    });

    it('aprueba cuando el usuario está matriculado en la asignatura', async () => {
      prismaMock.materia.findUnique.mockResolvedValue({ nombre: 'Cálculo' });
      prismaMock.usuario.findUnique.mockResolvedValue({ materiasCursando: ['Cálculo', 'Física'] });
      const handler = new ValidarMatriculaForoHandler();
      const resultado = await handler.manejar(CTX);
      expect(resultado.valido).toBe(true);
    });
  });

  // ─── ValidarContenidoForoHandler ──────────────────────────────────────────

  describe('ValidarContenidoForoHandler', () => {
    it('rechaza contenido vacío', async () => {
      const handler = new ValidarContenidoForoHandler();
      const resultado = await handler.manejar({ ...CTX, contenido: '' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/vacío/i);
    });

    it('rechaza contenido de solo espacios', async () => {
      const handler = new ValidarContenidoForoHandler();
      const resultado = await handler.manejar({ ...CTX, contenido: '   ' });
      expect(resultado.valido).toBe(false);
    });

    it('rechaza contenido con menos de 10 caracteres', async () => {
      const handler = new ValidarContenidoForoHandler();
      const resultado = await handler.manejar({ ...CTX, contenido: 'Corto' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/10/);
    });

    it('aprueba contenido válido con al menos 10 caracteres', async () => {
      const handler = new ValidarContenidoForoHandler();
      const resultado = await handler.manejar({ ...CTX, contenido: 'Contenido válido extenso' });
      expect(resultado.valido).toBe(true);
    });
  });

  // ─── ForoHandlerBase — encadenamiento ─────────────────────────────────────

  describe('ForoHandlerBase — encadenamiento', () => {
    it('setSiguiente retorna el handler siguiente (fluido)', () => {
      const h1 = new ValidarContenidoForoHandler();
      const h2 = new ValidarContenidoForoHandler();
      expect(h1.setSiguiente(h2)).toBe(h2);
    });

    it('la cadena se detiene en el primer fallo', async () => {
      const h1 = new ValidarAutenticacionForoHandler();
      const h2 = new ValidarContenidoForoHandler();
      h1.setSiguiente(h2);

      // h1 rechazará (usuarioId vacío), h2 nunca debe ejecutarse
      const resultado = await h1.manejar({ ...CTX, usuarioId: '' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/autenticad/i);
    });

    it('la cadena pasa todos los handlers cuando todo es válido', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.materia.findUnique.mockResolvedValue({ nombre: 'Cálculo' });
      // segundo findUnique para el handler de matrícula
      prismaMock.usuario.findUnique
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({ materiasCursando: ['Cálculo'] });

      const cadena = crearCadenaForo();
      const resultado = await cadena.manejar(CTX);
      expect(resultado.valido).toBe(true);
    });
  });

  // ─── crearCadenaForo — factory ────────────────────────────────────────────

  describe('crearCadenaForo', () => {
    it('retorna un handler con método manejar', () => {
      const cadena = crearCadenaForo();
      expect(typeof cadena.manejar).toBe('function');
    });

    it('el primer handler rechaza si el usuario está vacío sin llegar a los siguientes', async () => {
      const cadena = crearCadenaForo();
      const resultado = await cadena.manejar({ ...CTX, usuarioId: '' });
      expect(resultado.valido).toBe(false);
      // prisma.materia nunca debería haberse llamado
      expect(prismaMock.materia.findUnique).not.toHaveBeenCalled();
    });
  });
});
