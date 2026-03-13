import { MateriaRepository } from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';

export class MateriaUseCases {
  constructor(private readonly materiaRepository: MateriaRepository) {}

  async crear(nombre: unknown) {
    if (typeof nombre !== 'string' || !nombre.trim()) {
      throw new ApplicationError(400, 'Debes enviar un nombre de materia válido');
    }

    const nombreNormalizado = nombre.trim();
    const materiaExistente = await this.materiaRepository.findByName(nombreNormalizado);

    if (materiaExistente) {
      throw new ApplicationError(409, 'La materia ya existe');
    }

    const materia = await this.materiaRepository.create(nombreNormalizado);

    return {
      message: 'Materia creada correctamente',
      data: {
        id: materia.id,
        nombre: materia.nombre,
        createdAt: materia.createdAt,
      },
    };
  }

  async listar() {
    const materias = await this.materiaRepository.listAll();
    return { data: materias };
  }
}