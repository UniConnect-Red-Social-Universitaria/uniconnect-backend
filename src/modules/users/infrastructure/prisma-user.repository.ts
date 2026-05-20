import {
  CreateUserData,
  UpdateUserProfileData,
  UserRepository,
  UserSummary,
  UserWithPassword,
} from '../../../domain/contracts';
import { UsuarioModel } from '../../../models/usuario.model';

export class PrismaUserRepository implements UserRepository {
  async create(data: CreateUserData) {
    const usuario = await UsuarioModel.crear(data);
    return {
      id: usuario.id,
      createdAt: usuario.createdAt,
    };
  }

  async findByEmail(correo: string) {
    const usuario = await UsuarioModel.buscarPorCorreo(correo);
    return usuario ? { id: usuario.id } : null;
  }

  async findByEmailWithPassword(correo: string): Promise<UserWithPassword | null> {
    const usuario = await UsuarioModel.buscarPorCorreoConContrasena(correo);

    if (!usuario) {
      return null;
    }

    const usuarioDinamico = usuario as Record<string, unknown>;

    return {
      id: String(usuario.id),
      nombre: String(usuario.nombre),
      apellido: String(usuario.apellido),
      correo: String(usuario.correo),
      carrera: String(usuario.carrera),
      semestre:
        typeof usuarioDinamico.semestre === 'number'
          ? usuarioDinamico.semestre
          : null,
      materiasCursando: Array.isArray(usuarioDinamico.materiasCursando)
        ? (usuarioDinamico.materiasCursando as string[])
        : [],
      correoVerificado:
        typeof usuarioDinamico.correoVerificado === 'boolean'
          ? usuarioDinamico.correoVerificado
          : false,
      createdAt:
        usuarioDinamico.createdAt instanceof Date
          ? usuarioDinamico.createdAt
          : undefined,
      updatedAt:
        usuarioDinamico.updatedAt instanceof Date
          ? usuarioDinamico.updatedAt
          : undefined,
      contrasenaHash: String(usuario.contrasenaHash),
    };
  }

  async findById(id: string) {
    const usuario = await UsuarioModel.buscarPorId(id);
    return usuario ? { id: usuario.id } : null;
  }

  async findSafeById(id: string) {
    return UsuarioModel.obtenerPorIdSeguro(id);
  }

  async listAll() {
    return UsuarioModel.obtenerTodos();
  }

  async searchByMateriaExcluding(
    materia: string,
    usuarioActualId: string,
    idsExcluidos: string[],
  ) {
    return UsuarioModel.buscarPorMateriaExcluyendo(
      materia,
      usuarioActualId,
      idsExcluidos,
    );
  }

  async searchByText(texto: string, usuarioActualId: string) {
    return UsuarioModel.buscarPorTexto(texto, usuarioActualId);
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<UserSummary> {
    const usuario = await UsuarioModel.actualizar(id, data);
    const usuarioDinamico = usuario as Record<string, unknown>;

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      carrera: usuario.carrera,
      semestre:
        typeof usuarioDinamico.semestre === 'number'
          ? usuarioDinamico.semestre
          : null,
      materiasCursando: Array.isArray(usuarioDinamico.materiasCursando)
        ? (usuarioDinamico.materiasCursando as string[])
        : [],
      correoVerificado:
        typeof usuarioDinamico.correoVerificado === 'boolean'
          ? usuarioDinamico.correoVerificado
          : false,
      updatedAt:
        usuarioDinamico.updatedAt instanceof Date
          ? usuarioDinamico.updatedAt
          : undefined,
    };
  }

  async delete(id: string) {
    await UsuarioModel.eliminar(id);
  }

  async obtenerEmailPorId(id: string): Promise<string | null> {
    const usuario = await this.findSafeById(id);

    return usuario ? String((usuario as Record<string, unknown>).correo) : null;
  }
}