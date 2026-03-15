import {
  AuthenticatedUser,
  GroupRecord,
  GroupRepository,
  GrupoArchivoRepository,
  MateriaRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';

type CreateGroupInput = {
  nombre: unknown;
  materiaId: unknown;
};

type UploadedFile = {
  filename: string;
  originalname: string;
  path: string;
  mimetype: string;
  size: number;
};

export class GroupUseCases {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly materiaRepository: MateriaRepository,
    private readonly grupoArchivoRepository: GrupoArchivoRepository,
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

  async subirArchivo(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    file: UploadedFile | undefined,
    nombreMostrar: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    if (!file) {
      throw new ApplicationError(400, 'Debes adjuntar un archivo PDF');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === authUser.id);
    if (!esMiembro) throw new ApplicationError(403, 'No eres miembro de este grupo');

    const nombre =
      typeof nombreMostrar === 'string' && nombreMostrar.trim()
        ? nombreMostrar.trim()
        : file.originalname;

    const archivo = await this.grupoArchivoRepository.crear({
      nombre,
      nombreFisico: file.filename,
      ruta: file.path,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
      grupoId: grupo.id,
      subidoPorId: authUser.id,
    });

    return {
      message: 'Archivo subido correctamente',
      data: {
        id: archivo.id,
        nombre: archivo.nombre,
        mimeType: archivo.mimeType,
        tamanoBytes: archivo.tamanoBytes,
        subidoPor: archivo.subidoPor,
        createdAt: archivo.createdAt,
      },
    };
  }

  async listarArchivos(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === authUser.id);
    if (!esMiembro) throw new ApplicationError(403, 'No eres miembro de este grupo');

    const archivos = await this.grupoArchivoRepository.listarPorGrupo(grupo.id);
    return {
      data: archivos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        mimeType: a.mimeType,
        tamanoBytes: a.tamanoBytes,
        subidoPor: a.subidoPor,
        createdAt: a.createdAt,
      })),
    };
  }

  async obtenerRutaArchivo(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    archivoId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    if (!archivoId || typeof archivoId !== 'string') {
      throw new ApplicationError(400, 'ID de archivo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === authUser.id);
    if (!esMiembro) throw new ApplicationError(403, 'No eres miembro de este grupo');

    const archivo = await this.grupoArchivoRepository.buscarPorId(archivoId);
    if (!archivo || archivo.grupoId !== grupo.id) {
      throw new ApplicationError(404, 'Archivo no encontrado');
    }

    return { data: { ruta: archivo.ruta, nombre: archivo.nombre } };
  }

  async cederAdministracion(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    nuevoAdminId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    if (!nuevoAdminId || typeof nuevoAdminId !== 'string') {
      throw new ApplicationError(400, 'ID del nuevo administrador inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    if (grupo.administradorId !== authUser.id) {
      throw new ApplicationError(403, 'Solo el administrador puede ceder la administración');
    }

    if (nuevoAdminId === authUser.id) {
      throw new ApplicationError(400, 'Ya eres el administrador del grupo');
    }

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === nuevoAdminId);
    if (!esMiembro) throw new ApplicationError(404, 'El usuario no es miembro del grupo');

    await this.groupRepository.updateAdministrador(grupo.id, nuevoAdminId);

    return { message: 'Administración cedida correctamente' };
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