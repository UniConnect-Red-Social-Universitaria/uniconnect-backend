import { CareerRepository, MateriaRepository } from '../../../domain/contracts';

const CARRERAS_OFICIALES = [
  'Ingeniería de Sistemas y Computación',
  'Ingeniería Industrial',
  'Ingeniería Civil',
  'Arquitectura',
  'Derecho',
  'Administración de Empresas',
  'Medicina',
  'Enfermería',
  'Licenciatura en Matemáticas',
  'Licenciatura en Lenguas Modernas',
];

export class CatalogUseCases {
  constructor(
    private readonly careerRepository: CareerRepository,
    private readonly materiaRepository: MateriaRepository,
  ) {}

  async poblar() {
    const carrerasInsertadas = await this.careerRepository.createCatalog(CARRERAS_OFICIALES);

    return {
      message: 'Catálogo consumido desde MongoDB',
      data: {
        carrerasInsertadas: carrerasInsertadas.count,
      },
    };
  }

  async listar() {
    const [carreras, materias] = await Promise.all([
      this.careerRepository.listAll(),
      this.materiaRepository.listAll(),
    ]);

    return {
      data: {
        carreras,
        materias,
      },
    };
  }
}