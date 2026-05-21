import { MateriaUseCases } from '../src/modules/materias/application/materia.use-cases';
import type { MateriaRepository } from '../src/domain/contracts';

const MATERIA_MOCK = { id: 'm-1', nombre: 'Cálculo I', createdAt: new Date() };

function makeRepo(overrides: Partial<MateriaRepository> = {}): MateriaRepository {
  return {
    create: jest.fn().mockResolvedValue(MATERIA_MOCK),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createCatalog: jest.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

describe('MateriaUseCases', () => {

  // ─── crear ────────────────────────────────────────────────────────────────────

  describe('crear', () => {
    it('lanza 400 si nombre está vacío', async () => {
      const uc = new MateriaUseCases(makeRepo());
      await expect(uc.crear('   ')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si nombre no es string', async () => {
      const uc = new MateriaUseCases(makeRepo());
      await expect(uc.crear(123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si nombre es undefined', async () => {
      const uc = new MateriaUseCases(makeRepo());
      await expect(uc.crear(undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 409 si la materia ya existe', async () => {
      const repo = makeRepo({ findByName: jest.fn().mockResolvedValue(MATERIA_MOCK) });
      const uc = new MateriaUseCases(repo);
      await expect(uc.crear('Cálculo I')).rejects.toMatchObject({ status: 409 });
    });

    it('crea la materia y retorna datos', async () => {
      const uc = new MateriaUseCases(makeRepo());
      const result = await uc.crear('Cálculo I');
      expect(result.data.id).toBe('m-1');
      expect(result.data.nombre).toBe('Cálculo I');
      expect(result.message).toMatch(/creada/i);
    });

    it('normaliza el nombre (trim) antes de buscar y crear', async () => {
      const repo = makeRepo();
      const uc = new MateriaUseCases(repo);
      await uc.crear('  Álgebra  ');
      expect(repo.findByName).toHaveBeenCalledWith('Álgebra');
      expect(repo.create).toHaveBeenCalledWith('Álgebra');
    });
  });

  // ─── listar ───────────────────────────────────────────────────────────────────

  describe('listar', () => {
    it('retorna lista vacía cuando no hay materias', async () => {
      const uc = new MateriaUseCases(makeRepo());
      const result = await uc.listar();
      expect(result.data).toHaveLength(0);
    });

    it('retorna todas las materias', async () => {
      const materias = [MATERIA_MOCK, { id: 'm-2', nombre: 'Álgebra' }];
      const repo = makeRepo({ listAll: jest.fn().mockResolvedValue(materias) });
      const uc = new MateriaUseCases(repo);
      const result = await uc.listar();
      expect(result.data).toHaveLength(2);
    });

    it('llama a listAll del repositorio', async () => {
      const repo = makeRepo();
      const uc = new MateriaUseCases(repo);
      await uc.listar();
      expect(repo.listAll).toHaveBeenCalled();
    });
  });

  // ─── buscar ───────────────────────────────────────────────────────────────────

  describe('buscar', () => {
    it('retorna lista vacía si q está vacío', async () => {
      const uc = new MateriaUseCases(makeRepo());
      const result = await uc.buscar('');
      expect(result.data).toHaveLength(0);
    });

    it('retorna lista vacía si q es solo espacios', async () => {
      const repo = makeRepo();
      const uc = new MateriaUseCases(repo);
      const result = await uc.buscar('   ');
      expect(result.data).toHaveLength(0);
      expect(repo.searchByText).not.toHaveBeenCalled();
    });

    it('retorna lista vacía si q no es string', async () => {
      const uc = new MateriaUseCases(makeRepo());
      const result = await uc.buscar(null);
      expect(result.data).toHaveLength(0);
    });

    it('llama a searchByText con el término normalizado', async () => {
      const materias = [MATERIA_MOCK];
      const repo = makeRepo({ searchByText: jest.fn().mockResolvedValue(materias) });
      const uc = new MateriaUseCases(repo);
      const result = await uc.buscar('  Cálculo  ');
      expect(repo.searchByText).toHaveBeenCalledWith('Cálculo');
      expect(result.data).toHaveLength(1);
    });

    it('retorna lista vacía cuando no hay coincidencias', async () => {
      const repo = makeRepo({ searchByText: jest.fn().mockResolvedValue([]) });
      const uc = new MateriaUseCases(repo);
      const result = await uc.buscar('xyz');
      expect(result.data).toHaveLength(0);
    });
  });
});
