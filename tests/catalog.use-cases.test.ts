import { CatalogUseCases } from '../src/modules/catalog/application/catalog.use-cases';
import type { CareerRepository, MateriaRepository } from '../src/domain/contracts';

function makeCareerRepo(overrides: Partial<CareerRepository> = {}): CareerRepository {
  return {
    findByName: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createCatalog: jest.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

function makeMateriaRepo(overrides: Partial<MateriaRepository> = {}): MateriaRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createCatalog: jest.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

describe('CatalogUseCases', () => {

  // ─── poblar ───────────────────────────────────────────────────────────────────

  describe('poblar', () => {
    it('llama a createCatalog con las carreras oficiales', async () => {
      const careerRepo = makeCareerRepo({ createCatalog: jest.fn().mockResolvedValue({ count: 10 }) });
      const uc = new CatalogUseCases(careerRepo, makeMateriaRepo());
      const result = await uc.poblar();
      expect(careerRepo.createCatalog).toHaveBeenCalledWith(expect.arrayContaining([
        'Ingeniería de Sistemas y Computación',
        'Medicina',
        'Derecho',
      ]));
      expect(result.data.carrerasInsertadas).toBe(10);
    });

    it('retorna el mensaje de catálogo consumido', async () => {
      const uc = new CatalogUseCases(makeCareerRepo({ createCatalog: jest.fn().mockResolvedValue({ count: 5 }) }), makeMateriaRepo());
      const result = await uc.poblar();
      expect(result.message).toMatch(/catálogo/i);
    });

    it('retorna 0 si no se insertaron carreras', async () => {
      const uc = new CatalogUseCases(makeCareerRepo(), makeMateriaRepo());
      const result = await uc.poblar();
      expect(result.data.carrerasInsertadas).toBe(0);
    });
  });

  // ─── listar ───────────────────────────────────────────────────────────────────

  describe('listar', () => {
    it('retorna carreras y materias en paralelo', async () => {
      const carreras = [{ id: 'c-1', nombre: 'Ingeniería de Sistemas y Computación' }];
      const materias = [{ id: 'm-1', nombre: 'Cálculo I' }];
      const careerRepo = makeCareerRepo({ listAll: jest.fn().mockResolvedValue(carreras) });
      const materiaRepo = makeMateriaRepo({ listAll: jest.fn().mockResolvedValue(materias) });
      const uc = new CatalogUseCases(careerRepo, materiaRepo);
      const result = await uc.listar();
      expect(result.data.carreras).toEqual(carreras);
      expect(result.data.materias).toEqual(materias);
    });

    it('retorna listas vacías cuando el catálogo está vacío', async () => {
      const uc = new CatalogUseCases(makeCareerRepo(), makeMateriaRepo());
      const result = await uc.listar();
      expect(result.data.carreras).toHaveLength(0);
      expect(result.data.materias).toHaveLength(0);
    });

    it('llama a listAll en ambos repositorios', async () => {
      const careerRepo = makeCareerRepo();
      const materiaRepo = makeMateriaRepo();
      const uc = new CatalogUseCases(careerRepo, materiaRepo);
      await uc.listar();
      expect(careerRepo.listAll).toHaveBeenCalled();
      expect(materiaRepo.listAll).toHaveBeenCalled();
    });
  });
});
