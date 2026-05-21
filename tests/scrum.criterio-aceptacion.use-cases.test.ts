import { CriterioAceptacionUseCases } from '../src/modules/scrum/application/criterio-aceptacion.use-cases';
import type {
  CriterioAceptacionRepository,
  EvaluacionCriterioRepository,
  CriterioAceptacionRecord,
  EvaluacionCriterioRecord,
} from '../src/modules/scrum/domain/scrum-contracts';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeCriterioRepo(overrides: Partial<CriterioAceptacionRepository> = {}): CriterioAceptacionRepository {
  return {
    create: jest.fn(),
    findByHU: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

function makeEvaluacionRepo(overrides: Partial<EvaluacionCriterioRepository> = {}): EvaluacionCriterioRepository {
  return {
    create: jest.fn(),
    findByCriterio: jest.fn().mockResolvedValue([]),
    findLatest: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const CRITERIO_MOCK: CriterioAceptacionRecord = {
  id: 'criterio-1',
  numero: 1,
  descripcion: 'Dado que el usuario tiene cuenta, cuando inicia sesión, entonces accede al dashboard',
  huId: 'hu-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const EVALUACION_MOCK: EvaluacionCriterioRecord = {
  id: 'eval-1',
  criterioId: 'criterio-1',
  cumplido: true,
  observaciones: 'Prueba exitosa',
  evaluador: 'user-1',
  fechaEvaluacion: new Date(),
  createdAt: new Date(),
};

describe('CriterioAceptacionUseCases', () => {

  // ─── crearCriterio ────────────────────────────────────────────────────────────

  describe('crearCriterio', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.crearCriterio(undefined, 'hu-1', 1, 'Desc')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.crearCriterio(USUARIO, '', 1, 'Desc')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si numero es 0', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.crearCriterio(USUARIO, 'hu-1', 0, 'Desc')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si numero no es número', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.crearCriterio(USUARIO, 'hu-1', 'uno', 'Desc')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.crearCriterio(USUARIO, 'hu-1', 1, '   ')).rejects.toMatchObject({ status: 400 });
    });

    it('crea el criterio y retorna datos', async () => {
      const cRepo = makeCriterioRepo({ create: jest.fn().mockResolvedValue(CRITERIO_MOCK) });
      const uc = new CriterioAceptacionUseCases(cRepo, makeEvaluacionRepo());
      const result = await uc.crearCriterio(USUARIO, 'hu-1', 1, 'Dado que...');
      expect(cRepo.create).toHaveBeenCalledWith('hu-1', expect.objectContaining({ numero: 1 }));
      expect(result.data).toEqual(CRITERIO_MOCK);
      expect(result.message).toMatch(/creado/i);
    });
  });

  // ─── listarCriteriosDeHU ──────────────────────────────────────────────────────

  describe('listarCriteriosDeHU', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.listarCriteriosDeHU(undefined, 'hu-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.listarCriteriosDeHU(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna lista de criterios', async () => {
      const cRepo = makeCriterioRepo({ findByHU: jest.fn().mockResolvedValue([CRITERIO_MOCK]) });
      const uc = new CriterioAceptacionUseCases(cRepo, makeEvaluacionRepo());
      const result = await uc.listarCriteriosDeHU(USUARIO, 'hu-1');
      expect(result.data).toHaveLength(1);
    });

    it('retorna lista vacía cuando no hay criterios', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      const result = await uc.listarCriteriosDeHU(USUARIO, 'hu-1');
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── evaluarCriterio ──────────────────────────────────────────────────────────

  describe('evaluarCriterio', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.evaluarCriterio(undefined, 'criterio-1', true, '')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si criterioId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.evaluarCriterio(USUARIO, '', true, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si cumplido no es booleano', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.evaluarCriterio(USUARIO, 'criterio-1', 'si', '')).rejects.toMatchObject({ status: 400 });
    });

    it('evalúa criterio como cumplido', async () => {
      const eRepo = makeEvaluacionRepo({ create: jest.fn().mockResolvedValue(EVALUACION_MOCK) });
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), eRepo);
      const result = await uc.evaluarCriterio(USUARIO, 'criterio-1', true, 'Todo bien');
      expect(eRepo.create).toHaveBeenCalledWith('criterio-1', expect.objectContaining({ cumplido: true }));
      expect(result.message).toMatch(/evaluado/i);
    });

    it('evalúa criterio como no cumplido con observación', async () => {
      const evalNoAprobada = { ...EVALUACION_MOCK, cumplido: false };
      const eRepo = makeEvaluacionRepo({ create: jest.fn().mockResolvedValue(evalNoAprobada) });
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), eRepo);
      const result = await uc.evaluarCriterio(USUARIO, 'criterio-1', false, 'Falta validación');
      expect(eRepo.create).toHaveBeenCalledWith('criterio-1', expect.objectContaining({ cumplido: false, observaciones: 'Falta validación' }));
    });

    it('omite observaciones si no es string', async () => {
      const eRepo = makeEvaluacionRepo({ create: jest.fn().mockResolvedValue(EVALUACION_MOCK) });
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), eRepo);
      await uc.evaluarCriterio(USUARIO, 'criterio-1', true, 123);
      expect(eRepo.create).toHaveBeenCalledWith('criterio-1', expect.objectContaining({ observaciones: undefined }));
    });
  });

  // ─── obtenerHistorialEvaluaciones ────────────────────────────────────────────

  describe('obtenerHistorialEvaluaciones', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.obtenerHistorialEvaluaciones(undefined, 'criterio-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si criterioId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.obtenerHistorialEvaluaciones(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna historial de evaluaciones', async () => {
      const eRepo = makeEvaluacionRepo({ findByCriterio: jest.fn().mockResolvedValue([EVALUACION_MOCK]) });
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), eRepo);
      const result = await uc.obtenerHistorialEvaluaciones(USUARIO, 'criterio-1');
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── obtenerEvaluacionMasReciente ────────────────────────────────────────────

  describe('obtenerEvaluacionMasReciente', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.obtenerEvaluacionMasReciente(undefined, 'criterio-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si criterioId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.obtenerEvaluacionMasReciente(USUARIO, '  ')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si no hay evaluaciones', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.obtenerEvaluacionMasReciente(USUARIO, 'criterio-1')).rejects.toMatchObject({ status: 404 });
    });

    it('retorna la evaluación más reciente', async () => {
      const eRepo = makeEvaluacionRepo({ findLatest: jest.fn().mockResolvedValue(EVALUACION_MOCK) });
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), eRepo);
      const result = await uc.obtenerEvaluacionMasReciente(USUARIO, 'criterio-1');
      expect(result.data).toEqual(EVALUACION_MOCK);
    });
  });

  // ─── calcularCumplimientoPorHU ────────────────────────────────────────────────

  describe('calcularCumplimientoPorHU', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.calcularCumplimientoPorHU(undefined, 'hu-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si huId está vacío', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      await expect(uc.calcularCumplimientoPorHU(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna 0% cuando no hay criterios', async () => {
      const uc = new CriterioAceptacionUseCases(makeCriterioRepo(), makeEvaluacionRepo());
      const result = await uc.calcularCumplimientoPorHU(USUARIO, 'hu-1');
      expect(result.data).toEqual({ cumplidos: 0, total: 0, porcentaje: 0 });
    });

    it('calcula 100% cuando todos los criterios están cumplidos', async () => {
      const cRepo = makeCriterioRepo({ findByHU: jest.fn().mockResolvedValue([CRITERIO_MOCK]) });
      const eRepo = makeEvaluacionRepo({ findLatest: jest.fn().mockResolvedValue(EVALUACION_MOCK) });
      const uc = new CriterioAceptacionUseCases(cRepo, eRepo);
      const result = await uc.calcularCumplimientoPorHU(USUARIO, 'hu-1');
      expect(result.data.porcentaje).toBe(100);
      expect(result.data.cumplidos).toBe(1);
      expect(result.data.total).toBe(1);
    });

    it('calcula 0% cuando ningún criterio está cumplido', async () => {
      const evalNoCumplida = { ...EVALUACION_MOCK, cumplido: false };
      const cRepo = makeCriterioRepo({ findByHU: jest.fn().mockResolvedValue([CRITERIO_MOCK]) });
      const eRepo = makeEvaluacionRepo({ findLatest: jest.fn().mockResolvedValue(evalNoCumplida) });
      const uc = new CriterioAceptacionUseCases(cRepo, eRepo);
      const result = await uc.calcularCumplimientoPorHU(USUARIO, 'hu-1');
      expect(result.data.porcentaje).toBe(0);
      expect(result.data.cumplidos).toBe(0);
    });

    it('calcula 50% cuando la mitad de criterios están cumplidos', async () => {
      const criterio2 = { ...CRITERIO_MOCK, id: 'criterio-2', numero: 2 };
      const evalNoCumplida = { ...EVALUACION_MOCK, cumplido: false };
      const cRepo = makeCriterioRepo({ findByHU: jest.fn().mockResolvedValue([CRITERIO_MOCK, criterio2]) });
      const eRepo = makeEvaluacionRepo({
        findLatest: jest.fn()
          .mockResolvedValueOnce(EVALUACION_MOCK)
          .mockResolvedValueOnce(evalNoCumplida),
      });
      const uc = new CriterioAceptacionUseCases(cRepo, eRepo);
      const result = await uc.calcularCumplimientoPorHU(USUARIO, 'hu-1');
      expect(result.data.porcentaje).toBe(50);
    });
  });
});
