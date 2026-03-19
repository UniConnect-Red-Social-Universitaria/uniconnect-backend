import { CareerRepository, MateriaRepository } from '../../../domain/contracts';

export class CatalogUseCases {
  constructor(
    private readonly careerRepository: CareerRepository,
    private readonly materiaRepository: MateriaRepository,
  ) {}

  async poblar() {
    const [carreras, materias] = await Promise.all([
      this.careerRepository.listAll(),
      this.materiaRepository.listAll(),
    ]);

    return {
      message: 'Catálogo consumido desde MongoDB',
      data: {
        carreras,
        materias,
        carrerasTotal: carreras.length,
        materiasTotal: materias.length,
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