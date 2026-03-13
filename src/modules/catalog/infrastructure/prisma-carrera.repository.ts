import { CareerRepository } from '../../../domain/contracts';
import { CarreraModel } from '../../../models/carrera.model';

export class PrismaCarreraRepository implements CareerRepository {
  async findByName(nombre: string) {
    return CarreraModel.buscarPorNombre(nombre);
  }

  async listAll() {
    return CarreraModel.listarTodas();
  }

  async count() {
    return CarreraModel.contar();
  }

  async createCatalog(nombres: string[]) {
    return CarreraModel.crearCatalogo(nombres);
  }
}