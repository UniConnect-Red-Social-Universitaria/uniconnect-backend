import { RetrospectivaUseCases } from '../src/modules/scrum/application/retrospectiva.use-cases';
import type {
  RetrospectivaRepository,
  RetrospectivaRecord,
  AccuerdoRetroRecord,
  ImpedimentoRetroRecord,
} from '../src/modules/scrum/domain/scrum-contracts';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<RetrospectivaRepository> = {}): RetrospectivaRepository {
  return {
    create: jest.fn(),
    findBySprint: jest.fn().mockResolvedValue(null),
    createAcuerdo: jest.fn(),
    createImpedimento: jest.fn(),
    ...overrides,
  };
}

const RETRO_MOCK: RetrospectivaRecord = {
  id: 'retro-1',
  sprintId: 'sprint-1',
  fechaRetrospectiva: new Date(),
  comentariosGenerales: 'Sprint exitoso',
  acuerdos: [],
  impedimentos: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ACUERDO_MOCK: AccuerdoRetroRecord = {
  id: 'acuerdo-1',
  retroId: 'retro-1',
  descripcion: 'Mejorar comunicación entre frontend y backend',
  responsable: 'user-1',
  estado: 'PENDIENTE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const IMPEDIMENTO_RETRO_MOCK: ImpedimentoRetroRecord = {
  id: 'imp-retro-1',
  retroId: 'retro-1',
  descripcion: 'Falta de acceso al servidor de producción',
  impacto: 'Bloquea el despliegue',
  responsable: 'user-1',
  estado: 'ABIERTO',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RetrospectivaUseCases', () => {

  // ─── crearRetrospectiva ───────────────────────────────────────────────────────

  describe('crearRetrospectiva', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.crearRetrospectiva(undefined, 'sprint-1', { fechaRetrospectiva: new Date().toISOString() })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.crearRetrospectiva(USUARIO, '', { fechaRetrospectiva: new Date().toISOString() })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si data no es objeto', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.crearRetrospectiva(USUARIO, 'sprint-1', 'datos')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si data es null', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.crearRetrospectiva(USUARIO, 'sprint-1', null)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si falta fechaRetrospectiva', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.crearRetrospectiva(USUARIO, 'sprint-1', { comentariosGenerales: 'Bien' })).rejects.toMatchObject({ status: 400 });
    });

    it('crea la retrospectiva correctamente', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(RETRO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      const result = await uc.crearRetrospectiva(USUARIO, 'sprint-1', {
        fechaRetrospectiva: new Date().toISOString(),
        comentariosGenerales: 'Sprint exitoso',
      });
      expect(repo.create).toHaveBeenCalledWith('sprint-1', expect.objectContaining({ fechaRetrospectiva: expect.any(String) }));
      expect(result.data).toEqual(RETRO_MOCK);
      expect(result.message).toMatch(/creada/i);
    });
  });

  // ─── obtenerRetrospectiva ─────────────────────────────────────────────────────

  describe('obtenerRetrospectiva', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.obtenerRetrospectiva(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.obtenerRetrospectiva(USUARIO, '  ')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si no existe retrospectiva para el sprint', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.obtenerRetrospectiva(USUARIO, 'sprint-sin-retro')).rejects.toMatchObject({ status: 404 });
    });

    it('retorna la retrospectiva cuando existe', async () => {
      const repo = makeRepo({ findBySprint: jest.fn().mockResolvedValue(RETRO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      const result = await uc.obtenerRetrospectiva(USUARIO, 'sprint-1');
      expect(result.data).toEqual(RETRO_MOCK);
    });
  });

  // ─── agregarAcuerdo ───────────────────────────────────────────────────────────

  describe('agregarAcuerdo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarAcuerdo(undefined, 'retro-1', 'Mejorar code reviews', 'user-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si retroId está vacío', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarAcuerdo(USUARIO, '', 'Desc', 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarAcuerdo(USUARIO, 'retro-1', '  ', 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('agrega acuerdo correctamente', async () => {
      const repo = makeRepo({ createAcuerdo: jest.fn().mockResolvedValue(ACUERDO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      const result = await uc.agregarAcuerdo(USUARIO, 'retro-1', 'Mejorar comunicación', 'user-1');
      expect(repo.createAcuerdo).toHaveBeenCalledWith('retro-1', expect.objectContaining({
        descripcion: 'Mejorar comunicación',
        estado: 'PENDIENTE',
      }));
      expect(result.message).toMatch(/agregado/i);
    });

    it('acepta null como responsable', async () => {
      const repo = makeRepo({ createAcuerdo: jest.fn().mockResolvedValue(ACUERDO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      await uc.agregarAcuerdo(USUARIO, 'retro-1', 'Desc', null);
      expect(repo.createAcuerdo).toHaveBeenCalledWith('retro-1', expect.objectContaining({ responsable: undefined }));
    });
  });

  // ─── agregarImpedimento ───────────────────────────────────────────────────────

  describe('agregarImpedimento', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarImpedimento(undefined, 'retro-1', 'Falta acceso', 'Alto', 'user-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si retroId está vacío', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarImpedimento(USUARIO, '', 'Desc', 'Alto', 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new RetrospectivaUseCases(makeRepo());
      await expect(uc.agregarImpedimento(USUARIO, 'retro-1', '', 'Alto', 'user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('agrega impedimento correctamente', async () => {
      const repo = makeRepo({ createImpedimento: jest.fn().mockResolvedValue(IMPEDIMENTO_RETRO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      const result = await uc.agregarImpedimento(USUARIO, 'retro-1', 'Falta acceso', 'Bloquea deploy', 'user-1');
      expect(repo.createImpedimento).toHaveBeenCalledWith('retro-1', expect.objectContaining({
        descripcion: 'Falta acceso',
        estado: 'ABIERTO',
      }));
      expect(result.message).toMatch(/agregado/i);
    });

    it('omite impacto si no es string', async () => {
      const repo = makeRepo({ createImpedimento: jest.fn().mockResolvedValue(IMPEDIMENTO_RETRO_MOCK) });
      const uc = new RetrospectivaUseCases(repo);
      await uc.agregarImpedimento(USUARIO, 'retro-1', 'Falta acceso', 123, 'user-1');
      expect(repo.createImpedimento).toHaveBeenCalledWith('retro-1', expect.objectContaining({ impacto: undefined }));
    });
  });
});
