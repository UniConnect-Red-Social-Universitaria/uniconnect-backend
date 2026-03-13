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

const MATERIAS_BASE = [
  'Cálculo I',
  'Programación I',
  'Estructuras de Datos',
  'Base de Datos',
  'Física I',
  'Probabilidad y Estadística',
  'Economía General',
  'Inglés I',
  'Álgebra Lineal',
  'Química General',
];

export class CatalogUseCases {
  constructor(
    private readonly careerRepository: CareerRepository,
    private readonly materiaRepository: MateriaRepository,
  ) {}

  async poblar() {
    const [carrerasInsertadas, materiasInsertadas] = await Promise.all([
      this.careerRepository.createCatalog(CARRERAS_OFICIALES),
      this.materiaRepository.createCatalog(MATERIAS_BASE),
    ]);

    return {
      message: 'Catálogo oficial cargado',
      data: {
        carrerasInsertadas: carrerasInsertadas.count,
        materiasInsertadas: materiasInsertadas.count,
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