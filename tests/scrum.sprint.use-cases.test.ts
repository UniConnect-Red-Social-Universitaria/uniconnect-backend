import { SprintUseCases } from '../src/modules/scrum/application/sprint.use-cases';
import type { SprintRepository, SprintRecord } from '../src/modules/scrum/domain/scrum-contracts';
import { ApplicationError } from '../src/shared/application-error';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<SprintRepository> = {}): SprintRepository {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByNumero: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findActivos: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

const SPRINT_PLANEACION: SprintRecord = {
  id: 'sprint-1',
  numero: 1,
  nombre: 'Sprint 1',
  descripcion: 'Primer sprint',
  estado: 'PLANEACION',
  velocidadPlaneada: 20,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SPRINT_ACTIVO: SprintRecord = { ...SPRINT_PLANEACION, estado: 'ACTIVO' };
const SPRINT_COMPLETADO: SprintRecord = { ...SPRINT_PLANEACION, estado: 'COMPLETADO' };

describe('SprintUseCases', () => {

  // ─── crearSprint ──────────────────────────────────────────────────────────────

  describe('crearSprint', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(undefined, 1, 'Sprint 1', '', 20)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si numero no es número', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(USUARIO, 'uno', 'Sprint 1', '', 20)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si numero es 0', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(USUARIO, 0, 'Sprint 1', '', 20)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si numero es negativo', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(USUARIO, -1, 'Sprint 1', '', 20)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si nombre está vacío', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(USUARIO, 1, '   ', '', 20)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si nombre no es string', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.crearSprint(USUARIO, 1, 123, '', 20)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 409 si ya existe un sprint con el mismo número', async () => {
      const repo = makeRepo({ findByNumero: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      await expect(uc.crearSprint(USUARIO, 1, 'Sprint 1', '', 20)).rejects.toMatchObject({ status: 409 });
    });

    it('crea el sprint y retorna mensaje de éxito', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      const result = await uc.crearSprint(USUARIO, 1, 'Sprint 1', 'Descripción', 20);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ numero: 1, nombre: 'Sprint 1' }));
      expect(result.data).toEqual(SPRINT_PLANEACION);
      expect(result.message).toMatch(/creado/i);
    });

    it('usa 0 como velocidadPlaneada si no se provee', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      await uc.crearSprint(USUARIO, 1, 'Sprint 1', '', undefined);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ velocidadPlaneada: 0 }));
    });

    it('omite descripcion si no es string', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      await uc.crearSprint(USUARIO, 1, 'Sprint 1', 123, 20);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ descripcion: undefined }));
    });
  });

  // ─── obtenerSprint ────────────────────────────────────────────────────────────

  describe('obtenerSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.obtenerSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId no es string', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.obtenerSprint(USUARIO, 123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.obtenerSprint(USUARIO, '   ')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new SprintUseCases(repo);
      await expect(uc.obtenerSprint(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('retorna el sprint cuando existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      const result = await uc.obtenerSprint(USUARIO, 'sprint-1');
      expect(result.data).toEqual(SPRINT_PLANEACION);
    });
  });

  // ─── listarSprints ────────────────────────────────────────────────────────────

  describe('listarSprints', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.listarSprints(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna todos los sprints cuando soloActivos=false', async () => {
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([SPRINT_PLANEACION, SPRINT_ACTIVO]) });
      const uc = new SprintUseCases(repo);
      const result = await uc.listarSprints(USUARIO, false);
      expect(repo.findAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
    });

    it('retorna solo activos cuando soloActivos=true', async () => {
      const repo = makeRepo({ findActivos: jest.fn().mockResolvedValue([SPRINT_ACTIVO]) });
      const uc = new SprintUseCases(repo);
      const result = await uc.listarSprints(USUARIO, true);
      expect(repo.findActivos).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('retorna todos por defecto cuando soloActivos no se provee', async () => {
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([SPRINT_PLANEACION]) });
      const uc = new SprintUseCases(repo);
      await uc.listarSprints(USUARIO);
      expect(repo.findAll).toHaveBeenCalled();
    });
  });

  // ─── actualizarSprint ─────────────────────────────────────────────────────────

  describe('actualizarSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.actualizarSprint(undefined, 'sprint-1', { nombre: 'Nuevo' })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId no es string', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.actualizarSprint(USUARIO, 123, { nombre: 'Nuevo' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new SprintUseCases(repo);
      await expect(uc.actualizarSprint(USUARIO, 'inexistente', { nombre: 'Nuevo' })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si updates no es objeto válido', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      await expect(uc.actualizarSprint(USUARIO, 'sprint-1', null)).rejects.toMatchObject({ status: 400 });
    });

    it('actualiza el sprint y retorna datos actualizados', async () => {
      const sprintActualizado = { ...SPRINT_PLANEACION, nombre: 'Sprint Modificado' };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(SPRINT_PLANEACION),
        update: jest.fn().mockResolvedValue(sprintActualizado),
      });
      const uc = new SprintUseCases(repo);
      const result = await uc.actualizarSprint(USUARIO, 'sprint-1', { nombre: 'Sprint Modificado' });
      expect(repo.update).toHaveBeenCalledWith('sprint-1', { nombre: 'Sprint Modificado' });
      expect(result.data).toEqual(sprintActualizado);
      expect(result.message).toMatch(/actualizado/i);
    });
  });

  // ─── iniciarSprint ────────────────────────────────────────────────────────────

  describe('iniciarSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.iniciarSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId no es string', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.iniciarSprint(USUARIO, null)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new SprintUseCases(repo);
      await expect(uc.iniciarSprint(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si el sprint no está en PLANEACION', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO) });
      const uc = new SprintUseCases(repo);
      await expect(uc.iniciarSprint(USUARIO, 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el sprint está COMPLETADO', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_COMPLETADO) });
      const uc = new SprintUseCases(repo);
      await expect(uc.iniciarSprint(USUARIO, 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('inicia el sprint correctamente desde PLANEACION', async () => {
      const sprintIniciado = { ...SPRINT_ACTIVO, estado: 'ACTIVO' as const };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(SPRINT_PLANEACION),
        update: jest.fn().mockResolvedValue(sprintIniciado),
      });
      const uc = new SprintUseCases(repo);
      const result = await uc.iniciarSprint(USUARIO, 'sprint-1');
      expect(repo.update).toHaveBeenCalledWith('sprint-1', expect.objectContaining({ estado: 'ACTIVO' }));
      expect(result.data.estado).toBe('ACTIVO');
      expect(result.message).toMatch(/iniciado/i);
    });
  });

  // ─── cerrarSprint ─────────────────────────────────────────────────────────────

  describe('cerrarSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.cerrarSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new SprintUseCases(makeRepo());
      await expect(uc.cerrarSprint(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new SprintUseCases(repo);
      await expect(uc.cerrarSprint(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si el sprint está en PLANEACION', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_PLANEACION) });
      const uc = new SprintUseCases(repo);
      await expect(uc.cerrarSprint(USUARIO, 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el sprint ya está COMPLETADO', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(SPRINT_COMPLETADO) });
      const uc = new SprintUseCases(repo);
      await expect(uc.cerrarSprint(USUARIO, 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('cierra el sprint correctamente desde ACTIVO', async () => {
      const sprintCerrado = { ...SPRINT_COMPLETADO, estado: 'COMPLETADO' as const };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO),
        update: jest.fn().mockResolvedValue(sprintCerrado),
      });
      const uc = new SprintUseCases(repo);
      const result = await uc.cerrarSprint(USUARIO, 'sprint-1');
      expect(repo.update).toHaveBeenCalledWith('sprint-1', expect.objectContaining({ estado: 'COMPLETADO' }));
      expect(result.data.estado).toBe('COMPLETADO');
      expect(result.message).toMatch(/cerrado/i);
    });
  });
});
