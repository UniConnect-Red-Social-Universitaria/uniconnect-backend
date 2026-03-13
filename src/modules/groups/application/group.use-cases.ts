import {
  AuthenticatedUser,
  GroupRecord,
  GroupRepository,
  MateriaRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';

type CreateGroupInput = {
  nombre: unknown;
  materiaId: unknown;
};

export class GroupUseCases {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly materiaRepository: MateriaRepository,
  ) {}

  async crearGrupo(usuario: AuthenticatedUser | undefined, input: CreateGroupInput) {
    const authUser = this.ensureAuthenticated(usuario);
    const { nombre, materiaId } = input;

    if (typeof nombre !== 'string' || !nombre.trim()) {
      throw new ApplicationError(400, 'Debes enviar un nombre de grupo válido');
    }

    if (typeof materiaId !== 'string' || !materiaId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un materiaId válido');
    }

    const nombreNormalizado = nombre.trim();
    const grupoExistente = await this.groupRepository.findByName(nombreNormalizado);

    if (grupoExistente) {
      throw new ApplicationError(409, 'Ya existe un grupo con ese nombre');
    }

    const materia = await this.materiaRepository.findById(materiaId.trim());

    if (!materia) {
      throw new ApplicationError(404, 'La materia asociada no existe');
    }

    if (!authUser.materiasCursando.includes(materia.nombre)) {
      throw new ApplicationError(
        403,
        'No puedes crear grupos de materias que no estás cursando',
      );
    }

    const count = await this.groupRepository.countByMateria(materia.id);

    if (count >= 3) {
      throw new ApplicationError(409, 'Ya hay 3 grupos para esta materia');
    }

    const grupo = await this.groupRepository.create({
      nombre: nombreNormalizado,
      materiaId: materia.id,
      creadorId: authUser.id,
    });

    return {
      message: 'Grupo creado correctamente',
      data: {
        id: grupo.id,
        nombre: grupo.nombre,
        materia: grupo.materia,
        creadorId: grupo.creadorId,
        cantidadMiembros: grupo.miembros.length,
        createdAt: grupo.createdAt,
      },
    };
  }

  async listarMisGrupos(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);
    const grupos = await this.groupRepository.listByUser(authUser.id);
    return { data: grupos.map(formatearGrupo) };
  }

  async listarGruposDisponibles(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);
    const grupos = await this.groupRepository.listAvailable(
      authUser.materiasCursando,
      authUser.id,
    );
    return { data: grupos.map(formatearGrupo) };
  }

  async unirseAGrupo(usuario: AuthenticatedUser | undefined, grupoId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);

    if (!grupo) {
      throw new ApplicationError(404, 'Grupo no encontrado');
    }

    if (!authUser.materiasCursando.includes(grupo.materia.nombre)) {
      throw new ApplicationError(
        403,
        'No puedes unirte a grupos de materias que no estás cursando',
      );
    }

    const yaMiembro = grupo.miembros.some((miembro) => miembro.usuarioId === authUser.id);

    if (yaMiembro) {
      throw new ApplicationError(409, 'Ya eres miembro de este grupo');
    }

    const count = await this.groupRepository.countByMateria(grupo.materiaId);

    if (count >= 3) {
      throw new ApplicationError(409, 'Ya hay 3 grupos para esta materia');
    }

    await this.groupRepository.join(grupo.id, authUser.id);

    return {
      message: 'Te has unido al grupo correctamente',
    };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }

    return usuario;
  }
}

function formatearGrupo(grupo: GroupRecord) {
  return {
    id: grupo.id,
    nombre: grupo.nombre,
    materia: {
      id: grupo.materia.id,
      nombre: grupo.materia.nombre,
    },
    creadorId: grupo.creadorId,
    cantidadMiembros: grupo.miembros.length,
    miembros: grupo.miembros
      .filter((miembro) => miembro.usuario)
      .map((miembro) => ({
        id: miembro.usuario!.id,
        nombre: miembro.usuario!.nombre,
        apellido: miembro.usuario!.apellido,
      })),
    createdAt: grupo.createdAt,
  };
}