import { ImpedimentoUseCases } from '../src/modules/scrum/application/impedimento.use-cases';
import type { ImpedimentoRepository, ImpedimentoRecord } from '../src/modules/scrum/domain/scrum-contracts';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<ImpedimentoRepository> = {}): ImpedimentoRepository {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAbiertos: jest.fn().mockResolvedValue([]),
    findCriticos: jest.fn().mockResolvedValue([]),
    findBySprint: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    marcarComoCritico: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ID MongoDB válido (24 hex chars)
const MONGO_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

const IMPEDIMENTO_ABIERTO: ImpedimentoRecord = {
  id: 'imp-1',
  descripcion: 'No hay acceso al servidor de pruebas',
  estado: 'ABIERTO',
  esCritico: false,
  diasAbierto: 1,
  responsable: MONGO_ID,
  fechaApertura: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const IMPEDIMENTO_CRITICO: ImpedimentoRecord = {
  ...IMPEDIMENTO_ABIERTO,
  id: 'imp-2',
  esCritico: true,
  diasAbierto: 5,
  fechaApertura: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
};

describe('ImpedimentoUseCases', () => {

  // ─── crearImpedimento ─────────────────────────────────────────────────────────

  describe('crearImpedimento', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.crearImpedimento(undefined, 'Descripción', 'ABIERTO', 'user-1', 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si descripcion está vacía', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.crearImpedimento(USUARIO, '  ', 'ABIERTO', 'user-1', 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si descripcion no es string', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.crearImpedimento(USUARIO, 123, 'ABIERTO', 'user-1', 'sprint-1')).rejects.toMatchObject({ status: 400 });
    });

    it('crea impedimento y retorna datos', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.crearImpedimento(USUARIO, 'No hay acceso', 'ABIERTO', MONGO_ID, 'sprint-1');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ descripcion: 'No hay acceso' }));
      expect(result.data).toEqual(IMPEDIMENTO_ABIERTO);
      expect(result.message).toMatch(/creado/i);
    });

    it('usa ABIERTO como estado por defecto cuando estado no es string', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO) });
      const uc = new ImpedimentoUseCases(repo);
      await uc.crearImpedimento(USUARIO, 'Desc', undefined, undefined, undefined);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ estado: 'ABIERTO' }));
    });

    it('omite sprintId si no es string', async () => {
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO) });
      const uc = new ImpedimentoUseCases(repo);
      await uc.crearImpedimento(USUARIO, 'Desc', 'ABIERTO', undefined, 123);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ sprintId: undefined }));
    });
  });

  // ─── obtenerImpedimento ───────────────────────────────────────────────────────

  describe('obtenerImpedimento', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.obtenerImpedimento(undefined, 'imp-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si id está vacío', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.obtenerImpedimento(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new ImpedimentoUseCases(repo);
      await expect(uc.obtenerImpedimento(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('retorna el impedimento cuando existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.obtenerImpedimento(USUARIO, 'imp-1');
      expect(result.data).toEqual(IMPEDIMENTO_ABIERTO);
    });
  });

  // ─── listarAbiertos ───────────────────────────────────────────────────────────

  describe('listarAbiertos', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.listarAbiertos(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna impedimentos abiertos', async () => {
      const repo = makeRepo({ findAbiertos: jest.fn().mockResolvedValue([IMPEDIMENTO_ABIERTO]) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.listarAbiertos(USUARIO);
      expect(result.data).toHaveLength(1);
    });

    it('retorna lista vacía cuando no hay abiertos', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      const result = await uc.listarAbiertos(USUARIO);
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── listarCriticos ───────────────────────────────────────────────────────────

  describe('listarCriticos', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.listarCriticos(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna impedimentos críticos', async () => {
      const repo = makeRepo({ findCriticos: jest.fn().mockResolvedValue([IMPEDIMENTO_CRITICO]) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.listarCriticos(USUARIO);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].esCritico).toBe(true);
    });
  });

  // ─── listarPorSprint ──────────────────────────────────────────────────────────

  describe('listarPorSprint', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.listarPorSprint(undefined, 'sprint-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sprintId está vacío', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.listarPorSprint(USUARIO, '  ')).rejects.toMatchObject({ status: 400 });
    });

    it('retorna impedimentos del sprint', async () => {
      const repo = makeRepo({ findBySprint: jest.fn().mockResolvedValue([IMPEDIMENTO_ABIERTO]) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.listarPorSprint(USUARIO, 'sprint-1');
      expect(repo.findBySprint).toHaveBeenCalledWith('sprint-1');
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── actualizarEstado ─────────────────────────────────────────────────────────

  describe('actualizarEstado', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.actualizarEstado(undefined, 'imp-1', 'EN_PROGRESO')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si id está vacío', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.actualizarEstado(USUARIO, '', 'EN_PROGRESO')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si estado es inválido', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.actualizarEstado(USUARIO, 'imp-1', 'ELIMINADO')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si no existe', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const uc = new ImpedimentoUseCases(repo);
      await expect(uc.actualizarEstado(USUARIO, 'inexistente', 'RESUELTO')).rejects.toMatchObject({ status: 404 });
    });

    it.each(['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'])(
      'acepta el estado válido: %s',
      async (estado) => {
        const impActualizado = { ...IMPEDIMENTO_ABIERTO, estado: estado as any };
        const repo = makeRepo({
          findById: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO),
          update: jest.fn().mockResolvedValue(impActualizado),
        });
        const uc = new ImpedimentoUseCases(repo);
        await expect(uc.actualizarEstado(USUARIO, 'imp-1', estado)).resolves.toBeDefined();
      }
    );

    it('agrega fechaResolucion cuando estado es CERRADO', async () => {
      const impCerrado = { ...IMPEDIMENTO_ABIERTO, estado: 'CERRADO' as const };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO),
        update: jest.fn().mockResolvedValue(impCerrado),
      });
      const uc = new ImpedimentoUseCases(repo);
      await uc.actualizarEstado(USUARIO, 'imp-1', 'CERRADO');
      expect(repo.update).toHaveBeenCalledWith('imp-1', expect.objectContaining({ fechaResolucion: expect.any(Date) }));
    });

    it('no agrega fechaResolucion cuando estado no es CERRADO', async () => {
      const impResuelto = { ...IMPEDIMENTO_ABIERTO, estado: 'RESUELTO' as const };
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(IMPEDIMENTO_ABIERTO),
        update: jest.fn().mockResolvedValue(impResuelto),
      });
      const uc = new ImpedimentoUseCases(repo);
      await uc.actualizarEstado(USUARIO, 'imp-1', 'RESUELTO');
      expect(repo.update).toHaveBeenCalledWith('imp-1', expect.objectContaining({ fechaResolucion: undefined }));
    });
  });

  // ─── detectarYMarcarCriticos ──────────────────────────────────────────────────

  describe('detectarYMarcarCriticos', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      await expect(uc.detectarYMarcarCriticos(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna 0 marcados cuando no hay impedimentos abiertos', async () => {
      const uc = new ImpedimentoUseCases(makeRepo());
      const result = await uc.detectarYMarcarCriticos(USUARIO);
      expect(result.data.marcados).toBe(0);
    });

    it('no marca como crítico impedimento con menos de 3 días hábiles', async () => {
      const impedimentoReciente = { ...IMPEDIMENTO_ABIERTO, fechaApertura: new Date() };
      const repo = makeRepo({ findAbiertos: jest.fn().mockResolvedValue([impedimentoReciente]) });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.detectarYMarcarCriticos(USUARIO);
      expect(result.data.marcados).toBe(0);
      expect(repo.marcarComoCritico).not.toHaveBeenCalled();
    });

    it('marca como crítico impedimento con más de 3 días hábiles', async () => {
      const impedimentoAntiguo = { ...IMPEDIMENTO_ABIERTO, id: 'imp-viejo', esCritico: false, fechaApertura: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) };
      const repo = makeRepo({
        findAbiertos: jest.fn().mockResolvedValue([impedimentoAntiguo]),
        marcarComoCritico: jest.fn().mockResolvedValue(undefined),
      });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.detectarYMarcarCriticos(USUARIO);
      expect(result.data.marcados).toBe(1);
      expect(repo.marcarComoCritico).toHaveBeenCalledWith('imp-viejo');
    });

    it('no marca si ya es crítico', async () => {
      const impYaCritico = { ...IMPEDIMENTO_CRITICO, esCritico: true };
      const repo = makeRepo({
        findAbiertos: jest.fn().mockResolvedValue([impYaCritico]),
        marcarComoCritico: jest.fn(),
      });
      const uc = new ImpedimentoUseCases(repo);
      const result = await uc.detectarYMarcarCriticos(USUARIO);
      expect(result.data.marcados).toBe(0);
      expect(repo.marcarComoCritico).not.toHaveBeenCalled();
    });
  });
});
