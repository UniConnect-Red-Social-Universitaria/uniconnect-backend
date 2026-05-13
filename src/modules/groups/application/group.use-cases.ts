import {
  AuthenticatedUser,
  GroupRecord,
  GroupRepository,
  GrupoArchivoRepository,
  MateriaRepository,
  SolicitudGrupoRepository,
  GroupEventObserver,
  UserRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import { cloudinary } from '../../../lib/cloudinary';
import {
  GroupContext,
  ClosingState,
  PendingTransferState,
} from '../domain/group-state';

type CreateGroupInput = {
  nombre: unknown;
  materiaId: unknown;
};

type UploadedFile = {
  filename: string;
  originalname: string;
  path?: string;
  buffer?: Buffer;
  mimetype: string;
  size: number;
};

export class GroupUseCases {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly materiaRepository: MateriaRepository,
    private readonly userRepository: UserRepository,
    private readonly grupoArchivoRepository: GrupoArchivoRepository,
    private readonly solicitudGrupoRepository: SolicitudGrupoRepository,
    private readonly observers: GroupEventObserver[] = [],
  ) { }

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

  async buscarPorTexto(usuario: AuthenticatedUser | undefined, texto: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof texto !== 'string' || !texto.trim()) {
      return { data: [] };
    }

    const grupos = await this.groupRepository.searchByText(texto.trim());
    return { data: grupos.map(formatearGrupo) };
  }

  async obtenerGrupo(usuario: AuthenticatedUser | undefined, grupoId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === authUser.id);
    if (!esMiembro) throw new ApplicationError(403, 'No eres miembro de este grupo');

    return { data: formatearGrupo(grupo) };
  }

  async solicitarIngreso(usuario: AuthenticatedUser | undefined, grupoId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    if (!authUser.materiasCursando.includes(grupo.materia.nombre)) {
      throw new ApplicationError(
        403,
        'No puedes solicitar ingreso a grupos de materias que no estás cursando',
      );
    }

    // Delegar validación de pertenencia al estado actual
    const ctx = new GroupContext(grupo);
    ctx.solicitarIngreso(authUser.id);

    // Limpiar solicitudes rechazadas previas para permitir reenvío
    await this.solicitudGrupoRepository.eliminarRechazada(authUser.id, grupo.id);

    // Verificar que no haya solicitud pendiente
    const solicitudExistente = await this.solicitudGrupoRepository.buscarPendiente(
      authUser.id,
      grupo.id,
    );
    if (solicitudExistente) {
      throw new ApplicationError(409, 'Ya tienes una solicitud pendiente para este grupo');
    }

    const solicitud = await this.solicitudGrupoRepository.crear(authUser.id, grupo.id);

    // Notificar al administrador del grupo
    const solicitante = await this.userRepository.findSafeById(authUser.id);
    this.observers.forEach(obs => obs.onSolicitudNueva({
      solicitudId: solicitud.id,
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      administradorId: grupo.administradorId,
      solicitanteId: authUser.id,
      solicitanteNombre: solicitante?.nombre || '',
      solicitanteApellido: solicitante?.apellido || '',
    }));

    return {
      message: 'Solicitud de ingreso enviada correctamente',
      data: {
        id: solicitud.id,
        grupoId: solicitud.grupoId,
        estado: solicitud.estado,
        createdAt: solicitud.createdAt,
      },
    };
  }

  async listarSolicitudesGrupo(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    if (grupo.administradorId !== authUser.id) {
      throw new ApplicationError(403, 'Solo el administrador puede ver las solicitudes');
    }

    const solicitudes = await this.solicitudGrupoRepository.listarPorGrupo(grupo.id);

    return {
      data: solicitudes.map((s) => ({
        id: s.id,
        estado: s.estado,
        createdAt: s.createdAt,
        solicitante: s.solicitante,
      })),
    };
  }

  async listarMisSolicitudes(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);

    const solicitudes = await this.solicitudGrupoRepository.listarPorUsuario(authUser.id);

    return {
      data: solicitudes.map((s) => ({
        id: s.id,
        estado: s.estado,
        createdAt: s.createdAt,
        grupo: s.grupo,
      })),
    };
  }

  async aprobarSolicitud(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    solicitudId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }
    if (!solicitudId || typeof solicitudId !== 'string') {
      throw new ApplicationError(400, 'ID de solicitud inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const solicitud = await this.solicitudGrupoRepository.buscarPorId(solicitudId);
    if (!solicitud || solicitud.grupoId !== grupo.id) {
      throw new ApplicationError(404, 'Solicitud no encontrada');
    }
    if (solicitud.estado !== 'PENDIENTE') {
      throw new ApplicationError(400, 'Esta solicitud ya fue procesada');
    }

    // El estado valida que quien aprueba sea el admin
    const ctx = new GroupContext(grupo);
    ctx.aprobarSolicitud(solicitudId, authUser.id);

    try {
      await this.solicitudGrupoRepository.aprobar(solicitud.id);
      await this.groupRepository.join(grupo.id, solicitud.solicitanteId);

      if (ctx.pendingEstado) {
        await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
      }
    } catch (error) {
      // Rollback lógico en caso de fallo parcial
      console.error('Error en aprobarSolicitud, ejecutando rollback:', error);
      await this.groupRepository.leave(grupo.id, solicitud.solicitanteId).catch(() => {});
      throw new ApplicationError(500, 'Error de integridad al aprobar la solicitud. Se han revertido los cambios.');
    }

    this.observers.forEach(obs => obs.onSolicitudResuelta({
      solicitudId: solicitud.id,
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      solicitanteId: solicitud.solicitanteId,
      estado: 'APROBADA',
    }));

    return { message: 'Solicitud aprobada. El estudiante ha sido agregado al grupo.' };
  }

  async rechazarSolicitud(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    solicitudId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }
    if (!solicitudId || typeof solicitudId !== 'string') {
      throw new ApplicationError(400, 'ID de solicitud inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const solicitud = await this.solicitudGrupoRepository.buscarPorId(solicitudId);
    if (!solicitud || solicitud.grupoId !== grupo.id) {
      throw new ApplicationError(404, 'Solicitud no encontrada');
    }
    if (solicitud.estado !== 'PENDIENTE') {
      throw new ApplicationError(400, 'Esta solicitud ya fue procesada');
    }

    // El estado valida que quien rechaza sea el admin
    const ctx = new GroupContext(grupo);
    ctx.rechazarSolicitud(solicitudId, authUser.id);

    await this.solicitudGrupoRepository.rechazar(solicitud.id);

    if (ctx.pendingEstado) {
      await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
    }

    this.observers.forEach(obs => obs.onSolicitudResuelta({
      solicitudId: solicitud.id,
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      solicitanteId: solicitud.solicitanteId,
      estado: 'RECHAZADA',
    }));

    return { message: 'Solicitud rechazada.' };
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

    if (!file.buffer) {
      throw new ApplicationError(500, 'No se recibió el contenido del archivo');
    }

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'uniconnect/grupos', resource_type: 'raw', format: 'pdf', type: 'upload', access_mode: 'public' },
          (error: unknown, result: { secure_url: string; public_id: string } | undefined) => {
            if (error || !result) return reject(error ?? new Error('Error al subir a Cloudinary'));
            resolve(result as { secure_url: string; public_id: string });
          },
        );
        stream.end(file.buffer);
      },
    );

    const archivo = await this.grupoArchivoRepository.crear({
      nombre,
      nombreFisico: uploadResult.public_id,
      ruta: uploadResult.secure_url,
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

    return { data: { url: archivo.ruta, nombre: archivo.nombre, publicId: archivo.nombreFisico } };
  }

  async iniciarTransferenciaAdministracion(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    // Iniciar transferencia: el estado valida permisos y transiciona a PendingTransferState
    const ctx = new GroupContext(grupo);
    ctx.iniciarTransferenciaAdmin(authUser.id);

    if (ctx.pendingEstado) {
      await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
    }

    return { message: 'Transferencia de administración iniciada. Por favor, selecciona al nuevo administrador.' };
  }

  async confirmarTransferenciaAdministracion(
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

    const ctx = new GroupContext(grupo);

    // Completar la transferencia: PendingTransferState valida al nuevo admin
    ctx.transferirAdministracion(authUser.id, nuevoAdminId);

    try {
      await this.groupRepository.updateAdministrador(grupo.id, nuevoAdminId);

      if (ctx.pendingEstado) {
        await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
      }
    } catch (error) {
      // Rollback lógico: restaurar administrador original
      console.error('Error en confirmarTransferenciaAdministracion, ejecutando rollback:', error);
      await this.groupRepository.updateAdministrador(grupo.id, authUser.id).catch(() => {});
      throw new ApplicationError(500, 'Error de integridad al confirmar la transferencia. Se ha revertido la operación.');
    }

    const adminAnterior = await this.userRepository.findSafeById(authUser.id);
    const nuevoAdmin = await this.userRepository.findSafeById(nuevoAdminId);
    this.observers.forEach(obs => obs.onAdminTransferido({
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      anteriorAdminId: authUser.id,
      anteriorAdminNombre: [adminAnterior?.nombre, adminAnterior?.apellido].filter(Boolean).join(' '),
      nuevoAdminId: nuevoAdminId,
      nuevoAdminNombre: [nuevoAdmin?.nombre, nuevoAdmin?.apellido].filter(Boolean).join(' '),
    }));

    return { message: 'Administración cedida correctamente' };
  }

  async agregarMiembro(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    nuevoMiembroId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }
    if (!nuevoMiembroId || typeof nuevoMiembroId !== 'string') {
      throw new ApplicationError(400, 'ID del miembro inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const usuarioDestino = await this.userRepository.findSafeById(nuevoMiembroId);
    if (!usuarioDestino) throw new ApplicationError(404, 'Usuario no encontrado');

    const materiasUsuarioDestino = (usuarioDestino.materiasCursando || []).map((m) =>
      this.normalizarMateria(m),
    );
    if (!materiasUsuarioDestino.includes(this.normalizarMateria(grupo.materia.nombre))) {
      throw new ApplicationError(403, 'Solo puedes agregar usuarios que estén cursando esta materia');
    }

    // El estado valida permisos de admin y duplicados
    const ctx = new GroupContext(grupo);
    ctx.agregarMiembro(nuevoMiembroId, authUser.id);

    try {
      await this.groupRepository.join(grupo.id, nuevoMiembroId);

      if (ctx.pendingEstado) {
        await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
      }
    } catch (error) {
      // Rollback lógico
      console.error('Error en agregarMiembro, ejecutando rollback:', error);
      await this.groupRepository.leave(grupo.id, nuevoMiembroId).catch(() => {});
      throw new ApplicationError(500, 'Error de integridad al agregar el miembro. Se revirtieron los cambios.');
    }

    return { message: 'Miembro agregado correctamente' };
  }

  async abandonarGrupo(usuario: AuthenticatedUser | undefined, grupoId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    // El estado encapsula toda la lógica de permisos y transiciones
    const ctx = new GroupContext(grupo);
    ctx.abandonarGrupo(authUser.id);

    if (ctx.stateName === 'CLOSING' || ctx.stateName === 'DISSOLVED') {
      // Único miembro (admin) sale → disolver el grupo
      await this.groupRepository.deleteGroup(grupo.id);
      return {
        message: 'Has abandonado el grupo correctamente. Al ser el único miembro, el grupo fue eliminado.',
        grupoEliminado: true,
      };
    }

    try {
      await this.groupRepository.leave(grupo.id, authUser.id);
      
      if (ctx.pendingEstado) {
        await this.groupRepository.updateEstado(grupo.id, ctx.pendingEstado);
      }
    } catch (error) {
      console.error('Error en abandonarGrupo, ejecutando rollback:', error);
      await this.groupRepository.join(grupo.id, authUser.id).catch(() => {});
      throw new ApplicationError(500, 'Error de integridad al abandonar el grupo. Se revirtieron los cambios.');
    }
    
    return {
      message: 'Has abandonado el grupo correctamente',
      grupoEliminado: false,
    };
  }

  async obtenerMiembrosGrupo(usuario: AuthenticatedUser | undefined, grupoId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (!grupoId || typeof grupoId !== 'string') {
      throw new ApplicationError(400, 'ID de grupo inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId);
    if (!grupo) throw new ApplicationError(404, 'Grupo no encontrado');

    const esMiembro = grupo.miembros.some((m) => m.usuarioId === authUser.id);
    if (!esMiembro) throw new ApplicationError(403, 'No eres miembro de este grupo');

    const miembros = grupo.miembros
      .filter((miembro) => miembro.usuario)
      .map((miembro) => ({
        id: miembro.usuario!.id,
        nombre: miembro.usuario!.nombre,
        apellido: miembro.usuario!.apellido,
        esAdministrador: miembro.usuario!.id === grupo.administradorId,
      }));

    return {
      data: {
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        cantidadMiembros: miembros.length,
        miembros,
      },
    };
  }

  private normalizarMateria(materia: unknown) {
    if (typeof materia !== 'string') return '';
    return materia.trim().toLowerCase();
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
    administradorId: grupo.administradorId,
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
