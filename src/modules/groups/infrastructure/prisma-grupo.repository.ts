import { GroupRepository } from '../../../domain/contracts';
import { GrupoModel } from '../../../models/grupo.model';

export class PrismaGrupoRepository implements GroupRepository {
  async create(data: { nombre: string; materiaId: string; creadorId: string }) {
    return GrupoModel.crear(data);
  }

  async listByUser(usuarioId: string) {
    return GrupoModel.listarPorUsuario(usuarioId);
  }

  async listAvailable(materiasCursando: string[], usuarioId: string) {
    return GrupoModel.listarDisponibles(materiasCursando, usuarioId);
  }

  async findById(id: string) {
    return GrupoModel.buscarPorId(id);
  }

  async findByName(nombre: string) {
    return GrupoModel.buscarPorNombre(nombre);
  }

  async countByMateria(materiaId: string) {
    return GrupoModel.contarGruposPorMateria(materiaId);
  }

  async join(grupoId: string, usuarioId: string) {
    await GrupoModel.unirse(grupoId, usuarioId);
  }
}