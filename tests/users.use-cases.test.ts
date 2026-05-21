import { UsersUseCases } from '../src/modules/users/application/users.use-cases';
import type {
  UserRepository,
  ContactRepository,
  CareerRepository,
  MateriaRepository,
  PasswordService,
  TokenService,
  IdentityVerificationService,
  TokenBlacklistService,
  UserSummary,
  ContactRequestRecord,
} from '../src/domain/contracts';
import type { EstadisticasPerfilRepository } from '../src/modules/users/domain/IPerfilEstudiante';

jest.mock('../src/lib/socket', () => ({
  emitirSolicitudContactoTiempoReal: jest.fn(),
  emitirSolicitudContactoRechazadaTiempoReal: jest.fn(),
}));

const MONGO_ID_1 = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const MONGO_ID_2 = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const MONGO_ID_3 = 'cccccccccccccccccccccccc';

const USUARIO = { id: MONGO_ID_1, correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

const USER_SUMMARY: UserSummary = {
  id: MONGO_ID_1,
  nombre: 'Test',
  apellido: 'Usuario',
  correo: 'test@ucaldas.edu.co',
  carrera: 'Ingeniería de Sistemas y Computación',
  semestre: 4,
  materiasCursando: ['Cálculo I'],
  correoVerificado: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SOLICITUD_MOCK: ContactRequestRecord = {
  id: MONGO_ID_3,
  estado: 'PENDIENTE',
  solicitanteId: MONGO_ID_1,
  receptorId: MONGO_ID_2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    create: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByEmailWithPassword: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findSafeById: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    searchByMateriaExcluding: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    updateProfile: jest.fn().mockResolvedValue(USER_SUMMARY),
    delete: jest.fn().mockResolvedValue(undefined),
    obtenerEmailPorId: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeContactRepo(overrides: Partial<ContactRepository> = {}): ContactRepository {
  return {
    findRelationBetweenUsers: jest.fn().mockResolvedValue(null),
    createRequest: jest.fn().mockResolvedValue(SOLICITUD_MOCK),
    getRelatedIds: jest.fn().mockResolvedValue([]),
    listAcceptedPeers: jest.fn().mockResolvedValue([]),
    listReceivedPendingRequests: jest.fn().mockResolvedValue([]),
    acceptRequest: jest.fn().mockResolvedValue({ ...SOLICITUD_MOCK, estado: 'ACEPTADA' }),
    rejectRequest: jest.fn().mockResolvedValue({ ...SOLICITUD_MOCK, estado: 'RECHAZADA' }),
    ...overrides,
  };
}

function makeCareerRepo(overrides: Partial<CareerRepository> = {}): CareerRepository {
  return {
    findByName: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createCatalog: jest.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

function makeMateriaRepo(overrides: Partial<MateriaRepository> = {}): MateriaRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    listAll: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createCatalog: jest.fn().mockResolvedValue({ count: 0 }),
    ...overrides,
  };
}

function makePasswordService(overrides: Partial<PasswordService> = {}): PasswordService {
  return {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeTokenService(overrides: Partial<TokenService> = {}): TokenService {
  return {
    sign: jest.fn().mockReturnValue('jwt-token'),
    decodeExpiration: jest.fn().mockReturnValue(9999999999),
    ...overrides,
  };
}

function makeIdentityService(overrides: Partial<IdentityVerificationService> = {}): IdentityVerificationService {
  return {
    verifyRegistrationIdentity: jest.fn().mockResolvedValue({ correoVerificado: true, googleSub: 'sub-123' }),
    ...overrides,
  };
}

function makeTokenBlacklist(overrides: Partial<TokenBlacklistService> = {}): TokenBlacklistService {
  return {
    revoke: jest.fn(),
    ...overrides,
  };
}

function makeEstadisticasRepo(overrides: Partial<EstadisticasPerfilRepository> = {}): EstadisticasPerfilRepository {
  return {
    obtenerEstadisticas: jest.fn().mockResolvedValue({
      mensajesEnviados: 0,
      gruposActivos: 0,
      eventosAsistidos: 0,
      conexiones: 0,
    }),
    ...overrides,
  };
}

function makeUC(overrides: {
  userRepo?: Partial<UserRepository>;
  contactRepo?: Partial<ContactRepository>;
  careerRepo?: Partial<CareerRepository>;
  materiaRepo?: Partial<MateriaRepository>;
  passwordService?: Partial<PasswordService>;
  tokenService?: Partial<TokenService>;
  identityService?: Partial<IdentityVerificationService>;
  tokenBlacklist?: Partial<TokenBlacklistService>;
  estadisticasRepo?: Partial<EstadisticasPerfilRepository>;
} = {}) {
  return new UsersUseCases({
    userRepository: makeUserRepo(overrides.userRepo),
    contactRepository: makeContactRepo(overrides.contactRepo),
    careerRepository: makeCareerRepo(overrides.careerRepo),
    materiaRepository: makeMateriaRepo(overrides.materiaRepo),
    passwordService: makePasswordService(overrides.passwordService),
    tokenService: makeTokenService(overrides.tokenService),
    identityVerificationService: makeIdentityService(overrides.identityService),
    tokenBlacklistService: makeTokenBlacklist(overrides.tokenBlacklist),
    estadisticasRepository: makeEstadisticasRepo(overrides.estadisticasRepo),
  });
}

describe('UsersUseCases', () => {

  // ─── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('lanza 400 si correo está vacío', async () => {
      const uc = makeUC();
      await expect(uc.login('', 'pass')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si contrasena está vacía', async () => {
      const uc = makeUC();
      await expect(uc.login('a@b.com', '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si correo no es string', async () => {
      const uc = makeUC();
      await expect(uc.login(123, 'pass')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 401 si el usuario no existe', async () => {
      const uc = makeUC({ userRepo: { findByEmailWithPassword: jest.fn().mockResolvedValue(null) } });
      await expect(uc.login('no@existe.com', 'pass')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 401 si la contraseña es incorrecta', async () => {
      const userWithPass = { ...USER_SUMMARY, contrasenaHash: 'hash' };
      const uc = makeUC({
        userRepo: { findByEmailWithPassword: jest.fn().mockResolvedValue(userWithPass) },
        passwordService: { compare: jest.fn().mockResolvedValue(false) },
      });
      await expect(uc.login('test@ucaldas.edu.co', 'wrong')).rejects.toMatchObject({ status: 401 });
    });

    it('retorna token y datos del usuario en login exitoso', async () => {
      const userWithPass = { ...USER_SUMMARY, contrasenaHash: 'hash' };
      const uc = makeUC({
        userRepo: { findByEmailWithPassword: jest.fn().mockResolvedValue(userWithPass) },
        passwordService: { compare: jest.fn().mockResolvedValue(true) },
        tokenService: { sign: jest.fn().mockReturnValue('mi-token') },
      });
      const result = await uc.login('test@ucaldas.edu.co', 'password');
      expect(result.data.token).toBe('mi-token');
      expect(result.data.usuario.correo).toBe('test@ucaldas.edu.co');
      expect(result.message).toMatch(/sesión/i);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('lanza 401 si no hay token', async () => {
      const uc = makeUC();
      await expect(uc.logout(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el token no se puede decodificar', async () => {
      const uc = makeUC({ tokenService: { decodeExpiration: jest.fn().mockReturnValue(null) } });
      await expect(uc.logout('invalid-token')).rejects.toMatchObject({ status: 400 });
    });

    it('revoca el token y retorna mensaje de éxito', async () => {
      const revoke = jest.fn();
      const uc = makeUC({ tokenBlacklist: { revoke } });
      const result = await uc.logout('valid-token');
      expect(revoke).toHaveBeenCalledWith('valid-token', expect.any(Number));
      expect(result.message).toMatch(/sesión/i);
    });
  });

  // ─── obtenerPerfil ────────────────────────────────────────────────────────────

  describe('obtenerPerfil', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerPerfil(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si el usuario no existe en BD', async () => {
      const uc = makeUC({ userRepo: { findSafeById: jest.fn().mockResolvedValue(null) } });
      await expect(uc.obtenerPerfil(USUARIO)).rejects.toMatchObject({ status: 404 });
    });

    it('retorna el perfil del usuario', async () => {
      const uc = makeUC({ userRepo: { findSafeById: jest.fn().mockResolvedValue(USER_SUMMARY) } });
      const result = await uc.obtenerPerfil(USUARIO);
      expect(result.data).toEqual(USER_SUMMARY);
    });
  });

  // ─── buscarPorMateria ─────────────────────────────────────────────────────────

  describe('buscarPorMateria', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.buscarPorMateria(undefined, 'Cálculo')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si materiaQuery está vacía', async () => {
      const uc = makeUC();
      await expect(uc.buscarPorMateria(USUARIO, '  ')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiaQuery no es string', async () => {
      const uc = makeUC();
      await expect(uc.buscarPorMateria(USUARIO, 123)).rejects.toMatchObject({ status: 400 });
    });

    it('retorna usuarios que cursan la materia', async () => {
      const resultados = [{ id: MONGO_ID_2, nombre: 'Ana', apellido: 'Ruiz', correo: 'ana@ucaldas.edu.co', carrera: 'Ing', semestre: 2, materiasCursando: ['Cálculo I'] }];
      const uc = makeUC({ userRepo: { searchByMateriaExcluding: jest.fn().mockResolvedValue(resultados) } });
      const result = await uc.buscarPorMateria(USUARIO, 'Cálculo I');
      expect(result.data).toHaveLength(1);
    });

    it('llama a searchByMateriaExcluding con el id del usuario autenticado', async () => {
      const searchFn = jest.fn().mockResolvedValue([]);
      const uc = makeUC({ userRepo: { searchByMateriaExcluding: searchFn } });
      await uc.buscarPorMateria(USUARIO, 'Cálculo');
      expect(searchFn).toHaveBeenCalledWith('Cálculo', MONGO_ID_1, []);
    });
  });

  // ─── buscarGlobal ─────────────────────────────────────────────────────────────

  describe('buscarGlobal', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.buscarGlobal(undefined, 'query')).rejects.toMatchObject({ status: 401 });
    });

    it('retorna vacíos si q está vacío', async () => {
      const uc = makeUC();
      const result = await uc.buscarGlobal(USUARIO, '');
      expect(result.data.estudiantes).toHaveLength(0);
      expect(result.data.materias).toHaveLength(0);
    });

    it('retorna vacíos si q no es string', async () => {
      const uc = makeUC();
      const result = await uc.buscarGlobal(USUARIO, null);
      expect(result.data.estudiantes).toHaveLength(0);
    });

    it('busca estudiantes y filtra materias por texto', async () => {
      const estudiantes = [{ id: MONGO_ID_2, nombre: 'Ana', apellido: 'Ruiz', correo: 'a@u.edu.co', carrera: 'Ing', semestre: 2, materiasCursando: [] }];
      const todasMaterias = [
        { id: 'm-1', nombre: 'Cálculo Diferencial' },
        { id: 'm-2', nombre: 'Álgebra Lineal' },
      ];
      const uc = makeUC({
        userRepo: { searchByText: jest.fn().mockResolvedValue(estudiantes) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue(todasMaterias) },
      });
      const result = await uc.buscarGlobal(USUARIO, 'cálculo');
      expect(result.data.estudiantes).toHaveLength(1);
      expect(result.data.materias).toHaveLength(1);
      expect(result.data.materias[0].nombre).toBe('Cálculo Diferencial');
    });
  });

  // ─── listarCompaneros ─────────────────────────────────────────────────────────

  describe('listarCompaneros', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.listarCompaneros(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna lista de compañeros aceptados', async () => {
      const companeros = [{ contactoId: MONGO_ID_2, estado: 'ACEPTADA' as const, usuario: USER_SUMMARY }];
      const uc = makeUC({ contactRepo: { listAcceptedPeers: jest.fn().mockResolvedValue(companeros) } });
      const result = await uc.listarCompaneros(USUARIO);
      expect(result.data).toHaveLength(1);
    });

    it('retorna lista vacía cuando no hay compañeros', async () => {
      const uc = makeUC();
      const result = await uc.listarCompaneros(USUARIO);
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── listarSolicitudesRecibidas ───────────────────────────────────────────────

  describe('listarSolicitudesRecibidas', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.listarSolicitudesRecibidas(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna solicitudes pendientes recibidas', async () => {
      const solicitudes = [{ solicitudId: MONGO_ID_3, estado: 'PENDIENTE' as const, createdAt: new Date(), solicitante: USER_SUMMARY }];
      const uc = makeUC({ contactRepo: { listReceivedPendingRequests: jest.fn().mockResolvedValue(solicitudes) } });
      const result = await uc.listarSolicitudesRecibidas(USUARIO);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── enviarSolicitudConexion ──────────────────────────────────────────────────

  describe('enviarSolicitudConexion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.enviarSolicitudConexion(undefined, MONGO_ID_2)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si usuarioDestinoId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.enviarSolicitudConexion(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si usuarioDestinoId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.enviarSolicitudConexion(USUARIO, 'user-2')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si se envía solicitud a sí mismo', async () => {
      const uc = makeUC();
      await expect(uc.enviarSolicitudConexion(USUARIO, MONGO_ID_1)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el usuario destino no existe', async () => {
      const uc = makeUC({ userRepo: { findById: jest.fn().mockResolvedValue(null) } });
      await expect(uc.enviarSolicitudConexion(USUARIO, MONGO_ID_2)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 409 si ya son compañeros (ACEPTADA)', async () => {
      const uc = makeUC({
        userRepo: { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        contactRepo: { findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'ACEPTADA' }) },
      });
      await expect(uc.enviarSolicitudConexion(USUARIO, MONGO_ID_2)).rejects.toMatchObject({ status: 409 });
    });

    it('lanza 409 si ya existe una solicitud pendiente', async () => {
      const uc = makeUC({
        userRepo: { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        contactRepo: { findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'PENDIENTE' }) },
      });
      await expect(uc.enviarSolicitudConexion(USUARIO, MONGO_ID_2)).rejects.toMatchObject({ status: 409 });
    });

    it('envía la solicitud y retorna datos', async () => {
      const uc = makeUC({
        userRepo: {
          findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }),
          findSafeById: jest.fn().mockResolvedValue(USER_SUMMARY),
        },
        contactRepo: {
          findRelationBetweenUsers: jest.fn().mockResolvedValue(null),
          createRequest: jest.fn().mockResolvedValue(SOLICITUD_MOCK),
        },
      });
      const result = await uc.enviarSolicitudConexion(USUARIO, MONGO_ID_2);
      expect(result.message).toMatch(/solicitud/i);
      expect(result.data.estado).toBe('PENDIENTE');
    });
  });

  // ─── aceptarSolicitud ─────────────────────────────────────────────────────────

  describe('aceptarSolicitud', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.aceptarSolicitud(undefined, MONGO_ID_3)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si solicitudId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.aceptarSolicitud(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si solicitudId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.aceptarSolicitud(USUARIO, 'solicitud-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la solicitud no existe', async () => {
      const uc = makeUC({
        contactRepo: {
          acceptRequest: jest.fn().mockRejectedValue(new Error('Solicitud no encontrada')),
        },
      });
      await expect(uc.aceptarSolicitud(USUARIO, MONGO_ID_3)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no tiene permiso para aceptar', async () => {
      const uc = makeUC({
        contactRepo: {
          acceptRequest: jest.fn().mockRejectedValue(new Error('No tienes permiso para aceptar esta solicitud')),
        },
      });
      await expect(uc.aceptarSolicitud(USUARIO, MONGO_ID_3)).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 403 si la solicitud ya fue procesada', async () => {
      const uc = makeUC({
        contactRepo: {
          acceptRequest: jest.fn().mockRejectedValue(new Error('La solicitud ya fue procesada')),
        },
      });
      await expect(uc.aceptarSolicitud(USUARIO, MONGO_ID_3)).rejects.toMatchObject({ status: 403 });
    });

    it('acepta la solicitud correctamente', async () => {
      const solicitudAceptada = { ...SOLICITUD_MOCK, estado: 'ACEPTADA' as const, updatedAt: new Date() };
      const uc = makeUC({
        contactRepo: { acceptRequest: jest.fn().mockResolvedValue(solicitudAceptada) },
      });
      const result = await uc.aceptarSolicitud(USUARIO, MONGO_ID_3);
      expect(result.message).toMatch(/aceptada/i);
      expect(result.data.estado).toBe('ACEPTADA');
    });
  });

  // ─── rechazarSolicitud ────────────────────────────────────────────────────────

  describe('rechazarSolicitud', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.rechazarSolicitud(undefined, MONGO_ID_3)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si solicitudId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.rechazarSolicitud(USUARIO, 'bad-id')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la solicitud no existe', async () => {
      const uc = makeUC({
        contactRepo: {
          rejectRequest: jest.fn().mockRejectedValue(new Error('Solicitud no encontrada')),
        },
      });
      await expect(uc.rechazarSolicitud(USUARIO, MONGO_ID_3)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no tiene permiso para rechazar', async () => {
      const uc = makeUC({
        contactRepo: {
          rejectRequest: jest.fn().mockRejectedValue(new Error('No tienes permiso para rechazar esta solicitud')),
        },
      });
      await expect(uc.rechazarSolicitud(USUARIO, MONGO_ID_3)).rejects.toMatchObject({ status: 403 });
    });

    it('rechaza la solicitud correctamente', async () => {
      const solicitudRechazada = { ...SOLICITUD_MOCK, estado: 'RECHAZADA' as const, updatedAt: new Date() };
      const uc = makeUC({
        userRepo: { findSafeById: jest.fn().mockResolvedValue(USER_SUMMARY) },
        contactRepo: { rejectRequest: jest.fn().mockResolvedValue(solicitudRechazada) },
      });
      const result = await uc.rechazarSolicitud(USUARIO, MONGO_ID_3);
      expect(result.message).toMatch(/rechazada/i);
      expect(result.data.estado).toBe('RECHAZADA');
    });
  });

  // ─── obtenerPerfilPublico ─────────────────────────────────────────────────────

  describe('obtenerPerfilPublico', () => {
    it('lanza 400 si id está vacío', async () => {
      const uc = makeUC();
      await expect(uc.obtenerPerfilPublico('')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si id no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.obtenerPerfilPublico('user-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el usuario no existe', async () => {
      const uc = makeUC({ userRepo: { findSafeById: jest.fn().mockResolvedValue(null) } });
      await expect(uc.obtenerPerfilPublico(MONGO_ID_2)).rejects.toMatchObject({ status: 404 });
    });

    it('retorna el perfil público del usuario', async () => {
      const uc = makeUC({ userRepo: { findSafeById: jest.fn().mockResolvedValue(USER_SUMMARY) } });
      const result = await uc.obtenerPerfilPublico(MONGO_ID_1);
      expect(result.data).toBeDefined();
      expect(result.data.nombre).toBe('Test');
    });
  });

  // ─── obtenerPerfilEnriquecido ─────────────────────────────────────────────────

  describe('obtenerPerfilEnriquecido', () => {
    it('lanza 400 si id no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.obtenerPerfilEnriquecido('bad')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el usuario no existe', async () => {
      const uc = makeUC({ userRepo: { findSafeById: jest.fn().mockResolvedValue(null) } });
      await expect(uc.obtenerPerfilEnriquecido(MONGO_ID_2)).rejects.toMatchObject({ status: 404 });
    });

    it('retorna perfil enriquecido con estadísticas e insignias', async () => {
      const estadisticas = { mensajesEnviados: 10, gruposActivos: 2, eventosAsistidos: 1, conexiones: 5 };
      const uc = makeUC({
        userRepo: { findSafeById: jest.fn().mockResolvedValue(USER_SUMMARY) },
        estadisticasRepo: { obtenerEstadisticas: jest.fn().mockResolvedValue(estadisticas) },
      });
      const result = await uc.obtenerPerfilEnriquecido(MONGO_ID_1);
      expect(result.data).toBeDefined();
    });
  });

  // ─── eliminarUsuario ──────────────────────────────────────────────────────────

  describe('eliminarUsuario', () => {
    it('lanza 400 si id no es string', async () => {
      const uc = makeUC();
      await expect(uc.eliminarUsuario(123)).rejects.toMatchObject({ status: 400 });
    });

    it('elimina el usuario y retorna mensaje', async () => {
      const deleteUser = jest.fn().mockResolvedValue(undefined);
      const uc = makeUC({ userRepo: { delete: deleteUser } });
      const result = await uc.eliminarUsuario(MONGO_ID_1);
      expect(deleteUser).toHaveBeenCalledWith(MONGO_ID_1);
      expect(result.message).toMatch(/eliminado/i);
    });
  });

  // ─── actualizarPerfil ─────────────────────────────────────────────────────────

  describe('actualizarPerfil', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.actualizarPerfil(undefined, {})).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si carrera no es string (pero está presente)', async () => {
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue([]) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
      });
      await expect(uc.actualizarPerfil(USUARIO, { carrera: 123 })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si semestre es 0', async () => {
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue([]) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
      });
      await expect(uc.actualizarPerfil(USUARIO, { semestre: 0 })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiasCursando es array vacío', async () => {
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue([]) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
      });
      await expect(uc.actualizarPerfil(USUARIO, { materiasCursando: [] })).rejects.toMatchObject({ status: 400 });
    });

    it('actualiza el perfil correctamente cuando el catálogo está vacío', async () => {
      const updateProfile = jest.fn().mockResolvedValue(USER_SUMMARY);
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue([]) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
        userRepo: { updateProfile },
      });
      const result = await uc.actualizarPerfil(USUARIO, { semestre: 5, materiasCursando: ['Cálculo I'] });
      expect(updateProfile).toHaveBeenCalledWith(MONGO_ID_1, expect.objectContaining({ semestre: 5 }));
      expect(result.message).toMatch(/actualizado/i);
    });

    it('lanza 400 si la carrera no está en el catálogo', async () => {
      const carreras = [{ id: 'c-1', nombre: 'Ingeniería de Sistemas y Computación' }];
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue(carreras) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
      });
      await expect(uc.actualizarPerfil(USUARIO, { carrera: 'Carrera Inexistente' })).rejects.toMatchObject({ status: 400 });
    });

    it('resuelve carrera desde el catálogo cuando existe', async () => {
      const carreras = [{ id: 'c-1', nombre: 'Ingeniería de Sistemas y Computación' }];
      const updateProfile = jest.fn().mockResolvedValue(USER_SUMMARY);
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue(carreras) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
        userRepo: { updateProfile },
      });
      await uc.actualizarPerfil(USUARIO, { carrera: 'Ingeniería de Sistemas y Computación' });
      expect(updateProfile).toHaveBeenCalledWith(MONGO_ID_1, expect.objectContaining({ carreraId: 'c-1' }));
    });

    it('lanza 400 si materias tiene un elemento no string', async () => {
      const uc = makeUC({
        careerRepo: { listAll: jest.fn().mockResolvedValue([]) },
        materiaRepo: { listAll: jest.fn().mockResolvedValue([]) },
      });
      await expect(uc.actualizarPerfil(USUARIO, { materiasCursando: ['Cálculo', 123] })).rejects.toMatchObject({ status: 400 });
    });
  });

  // ─── obtenerTodos ─────────────────────────────────────────────────────────────

  describe('obtenerTodos', () => {
    it('retorna todos los usuarios', async () => {
      const uc = makeUC({ userRepo: { listAll: jest.fn().mockResolvedValue([USER_SUMMARY]) } });
      const result = await uc.obtenerTodos();
      expect(result.data).toHaveLength(1);
    });

    it('retorna lista vacía cuando no hay usuarios', async () => {
      const uc = makeUC();
      const result = await uc.obtenerTodos();
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── registrar ────────────────────────────────────────────────────────────────

  describe('registrar', () => {
    const INPUT_VALIDO = {
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@ucaldas.edu.co',
      contrasena: 'password123',
      carrera: 'Ingeniería de Sistemas',
      semestre: 4,
      materiasCursando: ['Cálculo I'],
      googleIdToken: 'token-google-123',
    };

    it('lanza 400 si faltan campos obligatorios', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, nombre: '' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si googleIdToken está ausente', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, googleIdToken: undefined })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si nombre no es string', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, nombre: 123 })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si semestre no es entero positivo', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, semestre: 0 })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si semestre es negativo', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, semestre: -1 })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiasCursando está vacío', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, materiasCursando: [] })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiasCursando tiene elemento no string', async () => {
      const uc = makeUC();
      await expect(uc.registrar({ ...INPUT_VALIDO, materiasCursando: [123] })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la carrera no está en el catálogo oficial', async () => {
      const uc = makeUC({
        careerRepo: {
          count: jest.fn().mockResolvedValue(1),
          listAll: jest.fn().mockResolvedValue([{ id: 'c-1', nombre: 'Ingeniería de Sistemas y Computación' }]),
        },
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
      });
      await expect(uc.registrar({ ...INPUT_VALIDO, carrera: 'Carrera Inexistente' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la contraseña tiene menos de 8 caracteres', async () => {
      const uc = makeUC({
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
      });
      await expect(uc.registrar({ ...INPUT_VALIDO, contrasena: 'corta' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el correo no es institucional', async () => {
      const uc = makeUC({
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
      });
      await expect(uc.registrar({ ...INPUT_VALIDO, correo: 'juan@gmail.com' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 401 si la verificación de identidad falla', async () => {
      const uc = makeUC({
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
        identityService: { verifyRegistrationIdentity: jest.fn().mockRejectedValue(new Error('Token inválido')) },
      });
      await expect(uc.registrar(INPUT_VALIDO)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 409 si el correo ya está registrado', async () => {
      const uc = makeUC({
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
        userRepo: { findByEmail: jest.fn().mockResolvedValue({ id: MONGO_ID_1 }) },
      });
      await expect(uc.registrar(INPUT_VALIDO)).rejects.toMatchObject({ status: 409 });
    });

    it('registra el usuario correctamente', async () => {
      const uc = makeUC({
        materiaRepo: { createCatalog: jest.fn().mockResolvedValue({ count: 0 }) },
        userRepo: {
          findByEmail: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: MONGO_ID_1, createdAt: new Date() }),
        },
      });
      const result = await uc.registrar(INPUT_VALIDO);
      expect(result.message).toMatch(/registro/i);
      expect(result.data.correo).toBe('juan@ucaldas.edu.co');
    });
  });
});