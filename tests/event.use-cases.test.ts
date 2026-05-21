import { EventUseCases } from '../src/modules/events/application/event.use-cases';
import type { EventRepository, EventRecord, CategoriaEvento } from '../src/domain/contracts';
import { EventoPublicador } from '../src/shared/eventos-observer/EventoPublicador';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

// Neutralizar el publicador de eventos (singleton)
jest.mock('../src/shared/eventos-observer/EventoPublicador', () => ({
  EventoPublicador: {
    getInstance: () => ({ notificar: jest.fn() }),
  },
}));

function makeRepo(overrides: Partial<EventRepository> = {}): EventRepository {
  return {
    create: jest.fn(),
    listUpcoming: jest.fn().mockResolvedValue([]),
    listByCategoria: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function fechaFutura(horasSumar = 25) {
  return new Date(Date.now() + horasSumar * 60 * 60 * 1000).toISOString();
}

const EVENTO_MOCK: EventRecord = {
  id: 'evento-1',
  titulo: 'Hackathon Ucaldas',
  descripcion: 'Competencia de programación',
  lugar: 'Auditorio',
  fechaEvento: new Date(Date.now() + 48 * 60 * 60 * 1000),
  categoria: 'academico',
  creadorId: 'user-1',
  createdAt: new Date(),
};

describe('EventUseCases', () => {

  // ─── crear ────────────────────────────────────────────────────────────────────

  describe('crear', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(undefined, 'Título', 'Desc', 'Lugar', fechaFutura(), 'academico')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si titulo está vacío', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, '  ', 'Desc', 'Lugar', fechaFutura(), 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si titulo no es string', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 123, 'Desc', 'Lugar', fechaFutura(), 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 'Título', '', 'Lugar', fechaFutura(), 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si lugar no es string pero tampoco undefined', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 'Título', 'Desc', 123, fechaFutura(), 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaEvento no es string', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 'Título', 'Desc', 'Lugar', new Date(), 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaEvento tiene formato inválido', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 'Título', 'Desc', 'Lugar', 'no-es-fecha', 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaEvento es en el pasado', async () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const uc = new EventUseCases(makeRepo());
      await expect(uc.crear(USUARIO, 'Título', 'Desc', 'Lugar', ayer, 'academico')).rejects.toMatchObject({ status: 400 });
    });

    it('crea evento con categoría válida', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(EVENTO_MOCK) });
      const uc = new EventUseCases(repo);
      const result = await uc.crear(USUARIO, 'Hackathon', 'Competencia', 'Auditorio', fechaFutura(), 'academico');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'academico' }));
      expect(result.message).toMatch(/creado/i);
      expect(result.data).toEqual(EVENTO_MOCK);
    });

    it.each(['academico', 'cultural', 'deportivo', 'otro'] as CategoriaEvento[])(
      'acepta la categoría válida: %s',
      async (categoria) => {
        const repo = makeRepo({ create: jest.fn().mockResolvedValue(EVENTO_MOCK) });
        const uc = new EventUseCases(repo);
        await expect(uc.crear(USUARIO, 'Título', 'Desc', 'Lugar', fechaFutura(), categoria)).resolves.toBeDefined();
      }
    );

    it('usa categoría "otro" cuando se provee una inválida', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(EVENTO_MOCK) });
      const uc = new EventUseCases(repo);
      await uc.crear(USUARIO, 'Título', 'Desc', 'Lugar', fechaFutura(), 'invalida');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'otro' }));
    });

    it('usa "Por definir" como lugar cuando lugar es undefined', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(EVENTO_MOCK) });
      const uc = new EventUseCases(repo);
      await uc.crear(USUARIO, 'Título', 'Desc', undefined, fechaFutura(), 'academico');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ lugar: 'Por definir' }));
    });

    it('usa "Por definir" como lugar cuando lugar es string vacío', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(EVENTO_MOCK) });
      const uc = new EventUseCases(repo);
      await uc.crear(USUARIO, 'Título', 'Desc', '  ', fechaFutura(), 'academico');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ lugar: 'Por definir' }));
    });
  });

  // ─── listarGlobal ─────────────────────────────────────────────────────────────

  describe('listarGlobal', () => {
    it('retorna lista de eventos próximos', async () => {
      const repo = makeRepo({ listUpcoming: jest.fn().mockResolvedValue([EVENTO_MOCK]) });
      const uc = new EventUseCases(repo);
      const result = await uc.listarGlobal();
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(EVENTO_MOCK);
    });

    it('retorna lista vacía cuando no hay eventos', async () => {
      const uc = new EventUseCases(makeRepo());
      const result = await uc.listarGlobal();
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── filtrarPorCategoria ──────────────────────────────────────────────────────

  describe('filtrarPorCategoria', () => {
    it('lanza 400 si la categoría es inválida', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.filtrarPorCategoria('fiesta')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si categoria no es string', async () => {
      const uc = new EventUseCases(makeRepo());
      await expect(uc.filtrarPorCategoria(123)).rejects.toMatchObject({ status: 400 });
    });

    it.each(['academico', 'cultural', 'deportivo', 'otro'] as CategoriaEvento[])(
      'filtra correctamente por la categoría: %s',
      async (categoria) => {
        const repo = makeRepo({ listByCategoria: jest.fn().mockResolvedValue([EVENTO_MOCK]) });
        const uc = new EventUseCases(repo);
        const result = await uc.filtrarPorCategoria(categoria);
        expect(repo.listByCategoria).toHaveBeenCalledWith(categoria);
        expect(result.data).toHaveLength(1);
      }
    );
  });
});
