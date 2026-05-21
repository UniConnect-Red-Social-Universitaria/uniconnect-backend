import { MetricasUseCases } from '../src/modules/scrum/application/metricas.use-cases';
import type {
  SprintRepository,
  HistoriaUsuarioRepository,
  VelocidadSprintRepository,
  BurndownDiarioRepository,
  CriterioAceptacionRepository,
  EvaluacionCriterioRepository,
  SprintRecord,
  HistoriaUsuarioRecord,
} from '../src/modules/scrum/domain/scrum-contracts';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeSprintRepo(overrides: Partial<SprintRepository> = {}): SprintRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    findByNumero: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findActivos: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

function makeHURepo(overrides: Partial<HistoriaUsuarioRepository> = {}): HistoriaUsuarioRepository {
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

function makeVelocidadRepo(overrides: Partial<VelocidadSprintRepository> = {}): VelocidadSprintRepository {
  return {
    create: jest.fn(),
    findBySprint: jest.fn().mockResolvedValue(null),
    findLast: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeBurndownRepo(overrides: Partial<BurndownDiarioRepository> = {}): BurndownDiarioRepository {
  return {
    create: jest.fn(),
    findBySprint: jest.fn().mockResolvedValue([]),
    findBySprintAndFecha: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

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

function makeUC(
  sprintOverrides: Partial<SprintRepository> = {},
  huOverrides: Partial<HistoriaUsuarioRepository> = {},
  velocidadOverrides: Partial<VelocidadSprintRepository> = {},
  burndownOverrides: Partial<BurndownDiarioRepository> = {},
  criterioOverrides: Partial<CriterioAceptacionRepository> = {},
  evaluacionOverrides: Partial<EvaluacionCriterioRepository> = {},
) {
  return new MetricasUseCases(
    makeSprintRepo(sprintOverrides),
    makeHURepo(huOverrides),
    makeVelocidadRepo(velocidadOverrides),
    makeBurndownRepo(burndownOverrides),
    makeCriterioRepo(criterioOverrides),
    makeEvaluacionRepo(evaluacionOverrides),
  );
}

const SPRINT_ACTIVO: SprintRecord = {
  id: 'sprint-1',
  numero: 1,
  nombre: 'Sprint 1',
  estado: 'ACTIVO',
  velocidadPlaneada: 20,
  fechaInicio: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const HU_COMPLETADA: HistoriaUsuarioRecord = {
  id: 'hu-1',
  codigo: 'HU-001',
  titulo: 'Login',
  descripcion: 'Iniciar sesión',
  storyPoints: 8,
  estado: 'COMPLETADA',
  prioridad: 1,
  sprintId: 'sprint-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const HU_EN_PROGRESO: HistoriaUsuarioRecord = {
  ...HU_COMPLETADA,
  id: 'hu-2',
  codigo: 'HU-002',
  storyPoints: 5,
  estado: 'EN_PROGRESO',
};

const HU_BLOQUEADA: HistoriaUsuarioRecord = {
  ...HU_COMPLETADA,
  id: 'hu-3',
  codigo: 'HU-003',
  storyPoints: 3,
  estado: 'BLOQUEADA',
};

describe('MetricasUseCases', () => {

  // ─── calcularMetricasSprint ───────────────────────────────────────────────────

  describe('calcularMetricasSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.calcularMetricasSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.calcularMetricasSprint(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(null) });
      await expect(uc.calcularMetricasSprint(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('calcula métricas correctamente con HUs en distintos estados', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO) },
        { findBySprint: jest.fn().mockResolvedValue([HU_COMPLETADA, HU_EN_PROGRESO, HU_BLOQUEADA]) },
      );
      const result = await uc.calcularMetricasSprint(USUARIO, 'sprint-1');
      expect(result.data.huTotales).toBe(3);
      expect(result.data.huCompletadas).toBe(1);
      expect(result.data.huEnProgreso).toBe(1);
      expect(result.data.huBloqueadas).toBe(1);
      expect(result.data.velocidadReal).toBe(8); // solo HU_COMPLETADA
    });

    it('calcula porcentaje de cumplimiento correcto', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO) }, // velocidadPlaneada = 20
        { findBySprint: jest.fn().mockResolvedValue([HU_COMPLETADA]) }, // velocidadReal = 8
      );
      const result = await uc.calcularMetricasSprint(USUARIO, 'sprint-1');
      expect(result.data.porcentajeCumplimiento).toBe(40); // 8/20 * 100
    });

    it('retorna 0% cumplimiento si velocidadPlaneada es 0', async () => {
      const sprintSinVelocidad = { ...SPRINT_ACTIVO, velocidadPlaneada: 0 };
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(sprintSinVelocidad) },
        { findBySprint: jest.fn().mockResolvedValue([HU_COMPLETADA]) },
      );
      const result = await uc.calcularMetricasSprint(USUARIO, 'sprint-1');
      expect(result.data.porcentajeCumplimiento).toBe(0);
    });

    it('incluye promedio de últimos sprints cuando hay datos', async () => {
      const velocidades = [
        { sprintId: 'sp-0', velocidadPlaneada: 20, velocidadReal: 18, porcentajeCumplimiento: 90, huCompletadas: 4, huTotales: 5, id: 'v1', createdAt: new Date(), updatedAt: new Date() },
        { sprintId: 'sp-00', velocidadPlaneada: 20, velocidadReal: 14, porcentajeCumplimiento: 70, huCompletadas: 3, huTotales: 5, id: 'v2', createdAt: new Date(), updatedAt: new Date() },
      ];
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO) },
        { findBySprint: jest.fn().mockResolvedValue([]) },
        { findLast: jest.fn().mockResolvedValue(velocidades) },
      );
      const result = await uc.calcularMetricasSprint(USUARIO, 'sprint-1');
      expect(result.data.promedio3Sprints).toBe(16); // (18+14)/2
    });
  });

  // ─── calcularBurndown ─────────────────────────────────────────────────────────

  describe('calcularBurndown', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.calcularBurndown(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.calcularBurndown(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el sprint no existe', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(null) });
      await expect(uc.calcularBurndown(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si el sprint no está iniciado', async () => {
      const sprintSinFechaInicio = { ...SPRINT_ACTIVO, fechaInicio: undefined };
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(sprintSinFechaInicio) });
      await expect(uc.calcularBurndown(USUARIO, 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna datos de burndown con lista vacía cuando no hay días registrados', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(SPRINT_ACTIVO) },
        { findBySprint: jest.fn().mockResolvedValue([HU_COMPLETADA]) },
        {},
        { findBySprint: jest.fn().mockResolvedValue([]) },
      );
      const result = await uc.calcularBurndown(USUARIO, 'sprint-1');
      expect(result.data.dias).toHaveLength(0);
      expect(result.data.spCompletados).toBe(8);
      expect(result.data.totalSpPlaneados).toBe(20);
    });
  });

  // ─── calcularCumplimientoGlobalSprint ────────────────────────────────────────

  describe('calcularCumplimientoGlobalSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.calcularCumplimientoGlobalSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.calcularCumplimientoGlobalSprint(USUARIO, '  ')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna 0% cuando no hay HUs en el sprint', async () => {
      const uc = makeUC({}, { findBySprint: jest.fn().mockResolvedValue([]) });
      const result = await uc.calcularCumplimientoGlobalSprint(USUARIO, 'sprint-1');
      expect(result.data.porcentajeCumplimiento).toBe(0);
      expect(result.data.criteriosTotales).toBe(0);
    });

    it('calcula cumplimiento global correctamente', async () => {
      const criterioMock = { id: 'crit-1', numero: 1, descripcion: 'Crit', huId: 'hu-1', createdAt: new Date(), updatedAt: new Date() };
      const evalCumplida = { id: 'ev-1', criterioId: 'crit-1', cumplido: true, fechaEvaluacion: new Date(), createdAt: new Date() };
      const uc = makeUC(
        {},
        { findBySprint: jest.fn().mockResolvedValue([HU_COMPLETADA]) },
        {},
        {},
        { findByHU: jest.fn().mockResolvedValue([criterioMock]) },
        { findLatest: jest.fn().mockResolvedValue(evalCumplida) },
      );
      const result = await uc.calcularCumplimientoGlobalSprint(USUARIO, 'sprint-1');
      expect(result.data.criteriosTotales).toBe(1);
      expect(result.data.criteriosCumplidos).toBe(1);
      expect(result.data.porcentajeCumplimiento).toBe(100);
    });
  });

  // ─── calcularVelocidadHistorica ───────────────────────────────────────────────

  describe('calcularVelocidadHistorica', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.calcularVelocidadHistorica(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna lista vacía cuando no hay sprints anteriores', async () => {
      const uc = makeUC();
      const result = await uc.calcularVelocidadHistorica(USUARIO);
      expect(result.data).toHaveLength(0);
    });

    it('retorna velocidades históricas formateadas', async () => {
      const velocidades = [
        { id: 'v1', sprintId: 'sp-1', velocidadPlaneada: 20, velocidadReal: 18, porcentajeCumplimiento: 90, huCompletadas: 4, huTotales: 5, createdAt: new Date(), updatedAt: new Date() },
      ];
      const uc = makeUC({}, {}, { findLast: jest.fn().mockResolvedValue(velocidades) });
      const result = await uc.calcularVelocidadHistorica(USUARIO);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        sprintId: 'sp-1',
        velocidadPlaneada: 20,
        velocidadReal: 18,
        porcentajeCumplimiento: 90,
      });
    });
  });
});
