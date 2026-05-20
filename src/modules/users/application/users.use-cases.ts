import {
  AuthenticatedUser,
  CareerRepository,
  ContactRepository,
  IdentityVerificationService,
  MateriaRepository,
  PasswordService,
  TokenBlacklistService,
  TokenService,
  UserRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import { esCorreoInstitucional } from '../../../utils/registro.util';
import { isValidMongoId } from '../../../shared/mongo-id';
import {
  emitirSolicitudContactoRechazadaTiempoReal,
  emitirSolicitudContactoTiempoReal,
} from '../../../lib/socket';
import { NotificacionService } from '../../notifications/application/NotificacionService';
import { NotificacionBase, NotificacionConAccion, NotificacionConPrioridad } from '../../../shared/notificacion';
import {
  EstadisticasPerfilRepository,
  calcularInsignias,
} from '../domain/IPerfilEstudiante';
import { PerfilBase } from './perfil/PerfilBase';
import { PerfilConEstadisticas } from './perfil/PerfilConEstadisticas';
import { PerfilConInsignias } from './perfil/PerfilConInsignias';

type RegisterInput = {
  nombre: unknown;
  apellido: unknown;
  correo: unknown;
  contrasena: unknown;
  carrera: unknown;
  semestre: unknown;
  materiasCursando: unknown;
  googleIdToken: unknown;
};

type UpdateProfileInput = {
  carrera?: unknown;
  semestre?: unknown;
  materiasCursando?: unknown;
};

type UsersUseCasesDependencies = {
  userRepository: UserRepository;
  contactRepository: ContactRepository;
  careerRepository: CareerRepository;
  materiaRepository: MateriaRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
  identityVerificationService: IdentityVerificationService;
  tokenBlacklistService: TokenBlacklistService;
  estadisticasRepository: EstadisticasPerfilRepository;
  notificacionService?: NotificacionService;
};

export class UsersUseCases {
  constructor(private readonly deps: UsersUseCasesDependencies) { }

  private normalizarTexto(valor: string) {
    return valor.trim().toLowerCase();
  }

  private resolverCarreraDesdeCatalogo(carrerasCatalogo: Array<{ id: string; nombre: string }>, valor: string) {
    const valorLimpio = valor.trim();

    return carrerasCatalogo.find(
      (carreraCatalogoItem) =>
        carreraCatalogoItem.id === valorLimpio ||
        this.normalizarTexto(carreraCatalogoItem.nombre) === this.normalizarTexto(valorLimpio),
    );
  }

  private resolverMateriasDesdeCatalogo(
    materiasCatalogo: Array<{ id: string; nombre: string }>,
    materiasEntrada: string[],
  ) {
    const materiasResueltas = materiasEntrada.map((materiaEntrada) => {
      const materiaLimpia = materiaEntrada.trim();

      return materiasCatalogo.find(
        (materiaCatalogoItem) =>
          materiaCatalogoItem.id === materiaLimpia ||
          this.normalizarTexto(materiaCatalogoItem.nombre) === this.normalizarTexto(materiaLimpia),
      );
    });

    const materiaInvalidaIndex = materiasResueltas.findIndex((materiaCatalogoItem) => !materiaCatalogoItem);

    if (materiaInvalidaIndex >= 0) {
      throw new ApplicationError(
        400,
        `La materia "${materiasEntrada[materiaInvalidaIndex]}" no existe en el catálogo oficial`,
      );
    }

    return materiasResueltas.map((materiaCatalogoItem) => materiaCatalogoItem!.nombre);
  }

  async buscarPorMateria(usuario: AuthenticatedUser | undefined, materiaQuery: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof materiaQuery !== 'string' || !materiaQuery.trim()) {
      throw new ApplicationError(400, 'Debes enviar la materia a buscar');
    }

    const resultados = await this.deps.userRepository.searchByMateriaExcluding(
      materiaQuery.trim(),
      authUser.id,
      [],
    );

    return { data: resultados };
  }

  async buscarGlobal(usuario: AuthenticatedUser | undefined, qQuery: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof qQuery !== 'string' || !qQuery.trim()) {
      return {
        data: {
          estudiantes: [],
          materias: [],
        },
      };
    }

    const termino = qQuery.trim();
    const terminoNormalizado = this.normalizarTexto(termino);

    const [estudiantes, materiasCatalogo] = await Promise.all([
      this.deps.userRepository.searchByText(termino, authUser.id),
      this.deps.materiaRepository.listAll(),
    ]);

    const materias = materiasCatalogo.filter((materia) =>
      this.normalizarTexto(materia.nombre).includes(terminoNormalizado),
    );

    return {
      data: {
        estudiantes,
        materias,
      },
    };
  }

  async enviarSolicitudConexion(
    usuario: AuthenticatedUser | undefined,
    usuarioDestinoId: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof usuarioDestinoId !== 'string' || !usuarioDestinoId.trim()) {
      throw new ApplicationError(400, 'usuarioDestinoId es obligatorio');
    }

    if (!isValidMongoId(usuarioDestinoId.trim())) {
      throw new ApplicationError(400, 'usuarioDestinoId tiene formato inválido');
    }

    if (usuarioDestinoId === authUser.id) {
      throw new ApplicationError(400, 'No puedes enviarte solicitud a ti mismo');
    }

    const usuarioDestino = await this.deps.userRepository.findById(usuarioDestinoId.trim());

    if (!usuarioDestino) {
      throw new ApplicationError(404, 'Usuario destino inexistente');
    }

    const relacionExistente = await this.deps.contactRepository.findRelationBetweenUsers(
      authUser.id,
      usuarioDestinoId.trim(),
    );

    if (relacionExistente) {
      if (relacionExistente.estado === 'ACEPTADA') {
        throw new ApplicationError(409, 'Este compañero ya está agregado');
      }

      throw new ApplicationError(
        409,
        'Ya existe una solicitud de conexión entre estos usuarios',
      );
    }

    const solicitud = await this.deps.contactRepository.createRequest(
      authUser.id,
      usuarioDestinoId.trim(),
    );

    const solicitante = await this.deps.userRepository.findSafeById(authUser.id);
    emitirSolicitudContactoTiempoReal({
      solicitudId: solicitud.id,
      receptorId: solicitud.receptorId,
      solicitanteId: solicitud.solicitanteId,
      solicitanteNombre: solicitante?.nombre ?? authUser.nombre,
      solicitanteApellido: solicitante?.apellido,
      createdAt: solicitud.createdAt,
    });

    if (this.deps.notificacionService) {
      const notificacion = new NotificacionConAccion(
        new NotificacionConPrioridad(
          new NotificacionBase(
            `${solicitante?.nombre ?? authUser.nombre} te envió una solicitud de amistad`,
            solicitud.receptorId,
            solicitud.createdAt,
          ),
          'normal',
        ),
        {
          label: 'Ver solicitudes',
          endpoint: '/solicitudes',
        },
      );

      this.deps.notificacionService
        .notificar(notificacion.render(), solicitud.receptorId, 'solicitud-contacto')
        .catch((error) =>
          console.error('[notificacion] Error al notificar solicitud de amistad:', error),
        );
    }

    return {
      message: 'Solicitud de conexión enviada',
      data: {
        id: solicitud.id,
        estado: solicitud.estado,
        solicitanteId: solicitud.solicitanteId,
        receptorId: solicitud.receptorId,
        createdAt: solicitud.createdAt,
      },
    };
  }

  async listarCompaneros(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);
    const companeros = await this.deps.contactRepository.listAcceptedPeers(authUser.id);
    return { data: companeros };
  }

  async listarSolicitudesRecibidas(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);
    const solicitudes = await this.deps.contactRepository.listReceivedPendingRequests(authUser.id);
    return { data: solicitudes };
  }

  async aceptarSolicitud(usuario: AuthenticatedUser | undefined, solicitudId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof solicitudId !== 'string' || !solicitudId.trim()) {
      throw new ApplicationError(400, 'solicitudId es obligatorio');
    }

    if (!isValidMongoId(solicitudId.trim())) {
      throw new ApplicationError(400, 'solicitudId tiene formato inválido');
    }

    try {
      const solicitudActualizada = await this.deps.contactRepository.acceptRequest(
        solicitudId.trim(),
        authUser.id,
      );

      if (this.deps.notificacionService) {
        const notificacion = new NotificacionConAccion(
          new NotificacionConPrioridad(
            new NotificacionBase(
              `${authUser.nombre} aceptó tu solicitud de amistad`,
              solicitudActualizada.solicitanteId,
              solicitudActualizada.updatedAt,
            ),
            'normal',
          ),
          {
            label: 'Ver compañeros',
            endpoint: '/solicitudes',
          },
        );

        this.deps.notificacionService
          .notificar(notificacion.render(), solicitudActualizada.solicitanteId, 'solicitud-contacto')
          .catch((error) =>
            console.error('[notificacion] Error al notificar solicitud de amistad aceptada:', error),
          );
      }

      return {
        message: 'Solicitud aceptada correctamente',
        data: {
          id: solicitudActualizada.id,
          estado: solicitudActualizada.estado,
          updatedAt: solicitudActualizada.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Solicitud no encontrada') {
          throw new ApplicationError(404, error.message);
        }

        if (
          error.message === 'No tienes permiso para aceptar esta solicitud' ||
          error.message === 'La solicitud ya fue procesada'
        ) {
          throw new ApplicationError(403, error.message);
        }
      }

      throw error;
    }
  }

  async rechazarSolicitud(usuario: AuthenticatedUser | undefined, solicitudId: unknown) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof solicitudId !== 'string' || !solicitudId.trim()) {
      throw new ApplicationError(400, 'solicitudId es obligatorio');
    }

    if (!isValidMongoId(solicitudId.trim())) {
      throw new ApplicationError(400, 'solicitudId tiene formato inválido');
    }

    try {
      const solicitudActualizada = await this.deps.contactRepository.rejectRequest(
        solicitudId.trim(),
        authUser.id,
      );

      const solicitante = await this.deps.userRepository.findSafeById(
        solicitudActualizada.solicitanteId,
      );

      if (this.deps.notificacionService) {
        const notificacion = new NotificacionConAccion(
          new NotificacionConPrioridad(
            new NotificacionBase(
              `${authUser.nombre} rechazó tu solicitud de amistad`,
              solicitudActualizada.solicitanteId,
              solicitudActualizada.updatedAt,
            ),
            'normal',
          ),
          {
            label: 'Reintentar contacto',
            endpoint: '/solicitudes',
          },
        );

        this.deps.notificacionService
          .notificar(notificacion.render(), solicitudActualizada.solicitanteId, 'solicitud-contacto')
          .catch((error) =>
            console.error('[notificacion] Error al notificar solicitud de amistad rechazada:', error),
          );
      }

      emitirSolicitudContactoRechazadaTiempoReal({
        solicitudId: solicitudActualizada.id,
        solicitanteId: solicitudActualizada.solicitanteId,
        receptorId: solicitudActualizada.receptorId,
        receptorNombre: authUser.nombre,
        updatedAt: solicitudActualizada.updatedAt,
      });

      return {
        message: 'Solicitud rechazada correctamente',
        data: {
          id: solicitudActualizada.id,
          estado: solicitudActualizada.estado,
          updatedAt: solicitudActualizada.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Solicitud no encontrada') {
          throw new ApplicationError(404, error.message);
        }

        if (
          error.message === 'No tienes permiso para rechazar esta solicitud' ||
          error.message === 'La solicitud ya fue procesada'
        ) {
          throw new ApplicationError(403, error.message);
        }
      }

      throw error;
    }
  }

  async registrar(input: RegisterInput) {
    const {
      nombre,
      apellido,
      correo,
      contrasena,
      carrera,
      semestre,
      materiasCursando,
      googleIdToken,
    } = input;

    if (
      !nombre ||
      !apellido ||
      !correo ||
      !contrasena ||
      !carrera ||
      semestre === undefined ||
      !materiasCursando ||
      !googleIdToken
    ) {
      throw new ApplicationError(400, 'Faltan campos obligatorios para el registro');
    }

    if (
      typeof nombre !== 'string' ||
      typeof apellido !== 'string' ||
      typeof correo !== 'string' ||
      typeof contrasena !== 'string' ||
      typeof carrera !== 'string'
    ) {
      throw new ApplicationError(400, 'Formato inválido en los campos de texto');
    }

    if (!Number.isInteger(semestre) || Number(semestre) <= 0) {
      throw new ApplicationError(400, 'El semestre debe ser un número entero mayor a 0');
    }

    if (
      !Array.isArray(materiasCursando) ||
      materiasCursando.length === 0 ||
      materiasCursando.some(
        (materia) => typeof materia !== 'string' || !materia.trim(),
      )
    ) {
      throw new ApplicationError(400, 'Debes enviar al menos una materia válida');
    }

    const cantidadCarreras = await this.deps.careerRepository.count();
    const carrerasCatalogo = cantidadCarreras > 0 ? await this.deps.careerRepository.listAll() : [];

    const carreraNormalizada = carrera.trim();
    const materiasNormalizadasEntrada = materiasCursando.map((materia) => materia.trim());
    let materiasNormalizadas = materiasNormalizadasEntrada;

    let carreraCatalogo: { id: string; nombre: string } | null = null;
    let carreraFinal = carreraNormalizada;

    if (carrerasCatalogo.length > 0) {
      carreraCatalogo = this.resolverCarreraDesdeCatalogo(carrerasCatalogo, carreraNormalizada) ?? null;

      if (!carreraCatalogo) {
        throw new ApplicationError(400, 'La carrera no existe en el catálogo oficial');
      }

      carreraFinal = carreraCatalogo.nombre;
    }

    // Auto-registra materias nuevas en el catálogo si aún no existen
    await this.deps.materiaRepository.createCatalog(materiasNormalizadas);

    if (contrasena.length < 8) {
      throw new ApplicationError(400, 'La contraseña debe tener mínimo 8 caracteres');
    }

    if (!esCorreoInstitucional(correo)) {
      throw new ApplicationError(400, 'Solo se permiten correos institucionales');
    }

    const correoNormalizado = correo.trim().toLowerCase();

    let verificacionIdentidad: { correoVerificado: boolean; googleSub?: string };

    try {
      verificacionIdentidad = await this.deps.identityVerificationService.verifyRegistrationIdentity(
        String(googleIdToken),
        correoNormalizado,
      );
    } catch (error) {
      throw new ApplicationError(
        401,
        error instanceof Error
          ? error.message
          : 'No fue posible verificar la identidad con Google/Auth0',
      );
    }

    const existe = await this.deps.userRepository.findByEmail(correoNormalizado);

    if (existe) {
      throw new ApplicationError(409, 'El correo ya está registrado');
    }

    const contrasenaHash = await this.deps.passwordService.hash(contrasena);
    const usuario = await this.deps.userRepository.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correoNormalizado,
      contrasenaHash,
      carrera: carreraFinal,
      carreraId: carreraCatalogo?.id,
      semestre: Number(semestre),
      materiasCursando: materiasNormalizadas,
      correoVerificado: verificacionIdentidad.correoVerificado,
      googleSub: verificacionIdentidad.googleSub,
    });

    return {
      message: 'Registro completado correctamente',
      data: {
        id: usuario.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correo: correoNormalizado,
        carrera: carreraFinal,
        semestre: Number(semestre),
        materiasCursando: materiasNormalizadas,
        correoVerificado: verificacionIdentidad.correoVerificado,
        createdAt: usuario.createdAt,
      },
    };
  }

  async obtenerTodos() {
    const usuarios = await this.deps.userRepository.listAll();
    return { data: usuarios };
  }

  async logout(token: string | undefined) {
    if (!token) {
      throw new ApplicationError(401, 'Token no proporcionado');
    }

    const exp = this.deps.tokenService.decodeExpiration(token);

    if (!exp) {
      throw new ApplicationError(400, 'No fue posible invalidar el token');
    }

    this.deps.tokenBlacklistService.revoke(token, exp);

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async login(correo: unknown, contrasena: unknown) {
    if (!correo || !contrasena) {
      throw new ApplicationError(400, 'Correo y contraseña son requeridos');
    }

    if (typeof correo !== 'string' || typeof contrasena !== 'string') {
      throw new ApplicationError(400, 'Formato inválido');
    }

    const usuario = await this.deps.userRepository.findByEmailWithPassword(
      correo.trim().toLowerCase(),
    );

    if (!usuario) {
      throw new ApplicationError(401, 'Correo o contraseña incorrectos');
    }

    const contrasenaValida = await this.deps.passwordService.compare(
      contrasena,
      usuario.contrasenaHash,
    );

    if (!contrasenaValida) {
      throw new ApplicationError(401, 'Correo o contraseña incorrectos');
    }

    const token = this.deps.tokenService.sign({
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      materiasCursando: usuario.materiasCursando,
    });

    return {
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo,
          carrera: usuario.carrera,
        },
      },
    };
  }

  async obtenerPerfil(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);
    const perfil = await this.deps.userRepository.findSafeById(authUser.id);

    if (!perfil) {
      throw new ApplicationError(404, 'Usuario no encontrado');
    }

    return { data: perfil };
  }

  async actualizarPerfil(
    usuario: AuthenticatedUser | undefined,
    input: UpdateProfileInput,
  ) {
    const authUser = this.ensureAuthenticated(usuario);
    const { carrera, semestre, materiasCursando } = input;

    const [carrerasCatalogo, materiasCatalogo] = await Promise.all([
      this.deps.careerRepository.listAll(),
      this.deps.materiaRepository.listAll(),
    ]);

    let carreraId: string | undefined;
    let carreraNormalizada: string | undefined;
    let materiasNormalizadas: string[] | undefined;

    if (carrera !== undefined && typeof carrera !== 'string') {
      throw new ApplicationError(400, 'Carrera debe ser texto');
    }

    if (typeof carrera === 'string') {
      carreraNormalizada = carrera.trim();

      if (carrerasCatalogo.length > 0) {
        const carreraCatalogo = this.resolverCarreraDesdeCatalogo(carrerasCatalogo, carreraNormalizada);

        if (!carreraCatalogo) {
          throw new ApplicationError(400, 'La carrera no existe en el catálogo oficial');
        }

        carreraId = carreraCatalogo.id;
        carreraNormalizada = carreraCatalogo.nombre;
      }
    }

    if (
      semestre !== undefined &&
      (!Number.isInteger(semestre) || Number(semestre) <= 0)
    ) {
      throw new ApplicationError(400, 'Semestre debe ser un número entero mayor a 0');
    }

    if (materiasCursando !== undefined) {
      if (!Array.isArray(materiasCursando) || materiasCursando.length === 0) {
        throw new ApplicationError(400, 'Materias debe ser un array no vacío');
      }

      if (
        materiasCursando.some(
          (materia) => typeof materia !== 'string' || !materia.trim(),
        )
      ) {
        throw new ApplicationError(400, 'Todas las materias deben ser textos válidos');
      }

      const materiasEntrada = materiasCursando.map((materia) => String(materia).trim());

      if (materiasCatalogo.length > 0) {
        materiasNormalizadas = this.resolverMateriasDesdeCatalogo(materiasCatalogo, materiasEntrada);
      } else {
        materiasNormalizadas = materiasEntrada;
      }
    }

    const usuarioActualizado = await this.deps.userRepository.updateProfile(authUser.id, {
      carrera: carreraNormalizada,
      carreraId,
      semestre: Number.isInteger(semestre) ? Number(semestre) : undefined,
      materiasCursando: materiasNormalizadas,
    });

    return {
      message: 'Perfil actualizado correctamente',
      data: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        correo: usuarioActualizado.correo,
        carrera: usuarioActualizado.carrera,
        semestre: usuarioActualizado.semestre,
        materiasCursando: usuarioActualizado.materiasCursando,
        correoVerificado: usuarioActualizado.correoVerificado ?? false,
        updatedAt: usuarioActualizado.updatedAt,
      },
    };
  }

  async eliminarUsuario(id: unknown) {
    if (typeof id !== 'string') {
      throw new ApplicationError(400, 'ID inválido');
    }

    await this.deps.userRepository.delete(id);

    return {
      message: 'Usuario eliminado correctamente',
    };
  }

  async obtenerPerfilPublico(id: unknown) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new ApplicationError(400, 'ID de usuario inválido');
    }

    if (!isValidMongoId(id.trim())) {
      throw new ApplicationError(400, 'ID de usuario con formato inválido');
    }

    const usuario = await this.deps.userRepository.findSafeById(id.trim());

    if (!usuario) {
      throw new ApplicationError(404, 'Usuario no encontrado');
    }

    const perfil = new PerfilBase({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      carrera: usuario.carrera,
      semestre: usuario.semestre ?? null,
      asignaturasActivas: usuario.materiasCursando,
    });

    return { data: perfil.render() };
  }

  async obtenerPerfilEnriquecido(id: unknown) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new ApplicationError(400, 'ID de usuario inválido');
    }

    if (!isValidMongoId(id.trim())) {
      throw new ApplicationError(400, 'ID de usuario con formato inválido');
    }

    const usuario = await this.deps.userRepository.findSafeById(id.trim());

    if (!usuario) {
      throw new ApplicationError(404, 'Usuario no encontrado');
    }

    const estadisticas = await this.deps.estadisticasRepository.obtenerEstadisticas(id.trim());

    const insignias = calcularInsignias(estadisticas);

    const perfil = new PerfilConInsignias(
      new PerfilConEstadisticas(
        new PerfilBase({
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          carrera: usuario.carrera,
          semestre: usuario.semestre ?? null,
          asignaturasActivas: usuario.materiasCursando,
        }),
        estadisticas,
      ),
      insignias,
    );

    return { data: perfil.render() };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }

    return usuario;
  }
}