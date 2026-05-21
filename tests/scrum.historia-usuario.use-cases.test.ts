import { HistoriaUsuarioUseCases } from '../src/modules/scrum/application/historia-usuario.use-cases';
import type { HistoriaUsuarioRepository, HistoriaUsuarioRecord } from '../src/modules/scrum/domain/scrum-contracts';
import { ApplicationError } from '../src/shared/application-error';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<HistoriaUsuarioRepository> = {}): HistoriaUsuarioRepository {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByCodigoAndSprint: jest.fn(),
    findBySprint: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

const HU_MOCK: HistoriaUsuarioRecord = {
  id: 'hu-1',
  codigo: 'HU-001',
  titulo: 'Como usuario quiero iniciar sesión',
  descripcion: 'Implementar login con Google',
  storyPoints: 5,
  estado: 'PENDIENTE',
  prioridad: 1,
  sprintId: 'sprint-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('HistoriaUsuarioUseCases', () => {

  // ─── crearHU ──────────────────────────────────────────────────────────────────

  describe('crearHU', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(undefined, 'sprint-1', 'HU-001', 'Título', 'Desc', 5, 1)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, '  ', 'HU-001', 'Título', 'Desc', 5, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si sprintId no es string', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 123, 'HU-001', 'Título', 'Desc', 5, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si codigo está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', '', 'Título', 'Desc', 5, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si titulo está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', 'HU-001', '  ', 'Desc', 5, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', 'HU-001', 'Título', '', 5, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si storyPoints es 0', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', 'HU-001', 'Título', 'Desc', 0, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si storyPoints es negativo', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', 'HU-001', 'Título', 'Desc', -3, 1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si storyPoints no es número', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.crearHU(USUARIO, 'sprint-1', 'HU-001', 'Título', 'Desc', 'cinco', 1)).rejects.toMatchObject({ status: 400 });
    });

    it('crea la HU y retorna datos', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(HU_MOCK) });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.crearHU(USUARIO, 'sprint-1', 'hu-001', 'Título', 'Desc', 5, 1);
      expect(repo.create).toHaveBeenCalledWith('sprint-1', expect.objectContaining({
        codigo: 'HU-001', // debe convertir a uppercase
        storyPoints: 5,
      }));
      expect(result.data).toEqual(HU_MOCK);
      expect(result.message).toMatch(/creada/i);
    });

    it('usa 100 como prioridad por defecto si no se provee', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(HU_MOCK) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await uc.crearHU(USUARIO, 'sprint-1', 'HU-001', 'Título', 'Desc', 5, undefined);
      expect(repo.create).toHaveBeenCalledWith('sprint-1', expect.objectContaining({ prioridad: 100 }));
    });
  });

  // ─── obtenerHU ───────────────────────────────────────────────────────────────

  describe('obtenerHU', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.obtenerHU(undefined, 'hu-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.obtenerHU(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si huId no es string', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.obtenerHU(USUARIO, 42)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la HU no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.obtenerHU(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('retorna la HU cuando existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(HU_MOCK) });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.obtenerHU(USUARIO, 'hu-1');
      expect(result.data).toEqual(HU_MOCK);
    });
  });

  // ─── listarHUsPorSprint ───────────────────────────────────────────────────────

  describe('listarHUsPorSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.listarHUsPorSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.listarHUsPorSprint(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lista todas las HUs del sprint sin filtro de estado', async () => {
      const repo = makeRepo({ findBySprint: jest.fn().mockResolvedValue([HU_MOCK]) });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.listarHUsPorSprint(USUARIO, 'sprint-1');
      expect(repo.findBySprint).toHaveBeenCalledWith('sprint-1', undefined);
      expect(result.data).toHaveLength(1);
    });

    it('filtra por estado cuando se provee', async () => {
      const repo = makeRepo({ findBySprint: jest.fn().mockResolvedValue([HU_MOCK]) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await uc.listarHUsPorSprint(USUARIO, 'sprint-1', 'PENDIENTE');
      expect(repo.findBySprint).toHaveBeenCalledWith('sprint-1', 'PENDIENTE');
    });
  });

  // ─── actualizarHU ────────────────────────────────────────────────────────────

  describe('actualizarHU', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.actualizarHU(undefined, 'hu-1', { titulo: 'Nuevo' })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.actualizarHU(USUARIO, '   ', { titulo: 'Nuevo' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la HU no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.actualizarHU(USUARIO, 'inexistente', { titulo: 'Nuevo' })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si updates es null', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(HU_MOCK) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.actualizarHU(USUARIO, 'hu-1', null)).rejects.toMatchObject({ status: 400 });
    });

    it('actualiza la HU correctamente', async () => {
      const huActualizada = { ...HU_MOCK, titulo: 'Nuevo título' };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(HU_MOCK),
        update: jest.fn().mockResolvedValue(huActualizada),
      });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.actualizarHU(USUARIO, 'hu-1', { titulo: 'Nuevo título' });
      expect(repo.update).toHaveBeenCalledWith('hu-1', { titulo: 'Nuevo título' });
      expect(result.data.titulo).toBe('Nuevo título');
    });
  });

  // ─── cambiarEstado ────────────────────────────────────────────────────────────

  describe('cambiarEstado', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.cambiarEstado(undefined, 'hu-1', 'EN_PROGRESO')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.cambiarEstado(USUARIO, '', 'EN_PROGRESO')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el estado es inválido', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.cambiarEstado(USUARIO, 'hu-1', 'HECHA')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el estado no es string', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.cambiarEstado(USUARIO, 'hu-1', 123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la HU no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.cambiarEstado(USUARIO, 'inexistente', 'COMPLETADA')).rejects.toMatchObject({ status: 404 });
    });

    it.each(['PENDIENTE', 'EN_PROGRESO', 'BLOQUEADA', 'COMPLETADA', 'CANCELADA'])(
      'acepta el estado válido: %s',
      async (estado) => {
        const huActualizada = { ...HU_MOCK, estado: estado as any };
        const repo = makeRepo({
          findById: jest.fn().mockResolvedValue(HU_MOCK),
          update: jest.fn().mockResolvedValue(huActualizada),
        });
        const uc = new HistoriaUsuarioUseCases(repo);
        await expect(uc.cambiarEstado(USUARIO, 'hu-1', estado)).resolves.toBeDefined();
      }
    );

    it('cambia estado y retorna mensaje con el nuevo estado', async () => {
      const huActualizada = { ...HU_MOCK, estado: 'COMPLETADA' as const };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(HU_MOCK),
        update: jest.fn().mockResolvedValue(huActualizada),
      });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.cambiarEstado(USUARIO, 'hu-1', 'COMPLETADA');
      expect(result.message).toContain('COMPLETADA');
      expect(repo.update).toHaveBeenCalledWith('hu-1', { estado: 'COMPLETADA' });
    });
  });

  // ─── asignarHU ───────────────────────────────────────────────────────────────

  describe('asignarHU', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.asignarHU(undefined, 'hu-1', 'user-2')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.asignarHU(USUARIO, '', 'user-2')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si usuarioIdAsignado es string vacío', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.asignarHU(USUARIO, 'hu-1', '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si usuarioIdAsignado es número', async () => {
      const uc = new HistoriaUsuarioUseCases(makeRepo());
      await expect(uc.asignarHU(USUARIO, 'hu-1', 42)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la HU no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.asignarHU(USUARIO, 'inexistente', 'user-2')).rejects.toMatchObject({ status: 404 });
    });

    it('asigna la HU a un usuario', async () => {
      const huAsignada = { ...HU_MOCK, asignadoA: 'user-2' };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(HU_MOCK),
        update: jest.fn().mockResolvedValue(huAsignada),
      });
      const uc = new HistoriaUsuarioUseCases(repo);
      const result = await uc.asignarHU(USUARIO, 'hu-1', 'user-2');
      expect(repo.update).toHaveBeenCalledWith('hu-1', { asignadoA: 'user-2' });
      expect(result.message).toMatch(/asignada/i);
    });

    it('acepta null para desasignar la HU', async () => {
      const huDesasignada = { ...HU_MOCK, asignadoA: undefined };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(HU_MOCK),
        update: jest.fn().mockResolvedValue(huDesasignada),
      });
      const uc = new HistoriaUsuarioUseCases(repo);
      await expect(uc.asignarHU(USUARIO, 'hu-1', null)).resolves.toBeDefined();
      expect(repo.update).toHaveBeenCalledWith('hu-1', { asignadoA: null });
    });
  });
});
