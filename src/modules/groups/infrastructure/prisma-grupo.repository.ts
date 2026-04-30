import { GroupRepository, GrupoArchivoRepository, GrupoArchivoRecord, CreateGrupoArchivoData } from '../../../domain/contracts';
import { GrupoArchivoModel } from '../../../models/grupo-archivo.model';
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

  async searchByText(texto: string) {
    return GrupoModel.buscarPorTexto(texto);
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

  async updateAdministrador(grupoId: string, nuevoAdminId: string) {
    await GrupoModel.actualizarAdministrador(grupoId, nuevoAdminId);
  }

  async leave(grupoId: string, usuarioId: string) {
    await GrupoModel.abandonarGrupo(grupoId, usuarioId);
  }
}

export class PrismaGrupoArchivoRepository implements GrupoArchivoRepository {
  async crear(data: CreateGrupoArchivoData): Promise<GrupoArchivoRecord> {
    return GrupoArchivoModel.crear(data);
  }

  async listarPorGrupo(grupoId: string): Promise<GrupoArchivoRecord[]> {
    return GrupoArchivoModel.listarPorGrupo(grupoId);
  }

  async buscarPorId(archivoId: string): Promise<GrupoArchivoRecord | null> {
    return GrupoArchivoModel.buscarPorId(archivoId);
  }
}
