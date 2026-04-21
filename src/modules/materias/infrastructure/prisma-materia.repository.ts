import { MateriaRepository } from '../../../domain/contracts';
import { MateriaModel } from '../../../models/materia.model';

export class PrismaMateriaRepository implements MateriaRepository {
  async create(nombre: string) {
    return MateriaModel.crear(nombre);
  }

  async findById(id: string) {
    return MateriaModel.buscarPorId(id);
  }

  async findByName(nombre: string) {
    return MateriaModel.buscarPorNombre(nombre);
  }

  async listAll() {
    return MateriaModel.listarTodas();
  }

  async searchByText(texto: string) {
    return MateriaModel.buscarPorTexto(texto);
  }

  async count() {
    return MateriaModel.contar();
  }

  async createCatalog(nombres: string[]) {
    return MateriaModel.crearCatalogo(nombres);
  }
}