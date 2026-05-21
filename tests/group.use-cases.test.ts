import { GroupUseCases } from '../src/modules/groups/application/group.use-cases';
import type {
  GroupRepository,
  MateriaRepository,
  UserRepository,
  GrupoArchivoRepository,
  SolicitudGrupoRepository,
  GroupRecord,
  SolicitudGrupoRecord,
} from '../src/domain/contracts';

// Neutralizar cloudinary (se usa en subirArchivo)
jest.mock('../src/lib/cloudinary', () => ({
  cloudinary: { uploader: { upload_stream: jest.fn() } },
}));

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: ['Álgebra'] };
const OTRO_USUARIO = { id: 'user-2', correo: 'otro@ucaldas.edu.co', nombre: 'Otro', materiasCursando: ['Álgebra'] };
const ADMIN_USUARIO = { id: 'admin-1', correo: 'admin@ucaldas.edu.co', nombre: 'Admin', materiasCursando: ['Álgebra'] };

const MATERIA_MOCK = { id: 'mat-1', nombre: 'Álgebra', createdAt: new Date() };

const GRUPO_MOCK: GroupRecord = {
  id: 'grupo-1',
  nombre: 'Álgebra Lineal',
  materiaId: 'mat-1',
  creadorId: 'user-1',
  administradorId: 'admin-1',
  candidatoAdminId: null,
  estado: 'ACTIVO',
  createdAt: new Date(),
  materia: MATERIA_MOCK,
  miembros: [
    { id: 'mb-1', usuarioId: 'user-1', usuario: { id: 'user-1', nombre: 'Test', apellido: 'User' } },
  ],
};

const SOLICITUD_MOCK: SolicitudGrupoRecord = {
  id: 'sol-1',
  solicitanteId: 'user-1',
  grupoId: 'grupo-1',
  tipo: 'INGRESO',
  estado: 'PENDIENTE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeGroupRepo(overrides: Partial<GroupRepository> = {}): GroupRepository {
  return {
    create: jest.fn().mockResolvedValue(GRUPO_MOCK),
    listByUser: jest.fn().mockResolvedValue([]),
    listAvailable: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    countByMateria: jest.fn().mockResolvedValue(0),
    join: jest.fn().mockResolvedValue(undefined),
    updateAdministrador: jest.fn().mockResolvedValue(undefined),
    updateEstado: jest.fn().mockResolvedValue(undefined),
    updateCandidatoAdmin: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    deleteGroup: jest.fn().mockResolvedValue(undefined),
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
    createCatalog: jest.fn(),
    ...overrides,
  };
}

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
    updateProfile: jest.fn(),
    delete: jest.fn(),
    obtenerEmailPorId: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeArchivoRepo(overrides: Partial<GrupoArchivoRepository> = {}): GrupoArchivoRepository {
  return {
    crear: jest.fn(),
    listarPorGrupo: jest.fn().mockResolvedValue([]),
    buscarPorId: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeSolicitudRepo(overrides: Partial<SolicitudGrupoRepository> = {}): SolicitudGrupoRepository {
  return {
    crear: jest.fn().mockResolvedValue(SOLICITUD_MOCK),
    buscarPendiente: jest.fn().mockResolvedValue(null),
    listarPorGrupo: jest.fn().mockResolvedValue([]),
    listarPorUsuario: jest.fn().mockResolvedValue([]),
    aprobar: jest.fn().mockResolvedValue({ ...SOLICITUD_MOCK, estado: 'APROBADA' }),
    rechazar: jest.fn().mockResolvedValue({ ...SOLICITUD_MOCK, estado: 'RECHAZADA' }),
    buscarPorId: jest.fn().mockResolvedValue(null),
    eliminarRechazada: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUC(
  groupOverrides: Partial<GroupRepository> = {},
  materiaOverrides: Partial<MateriaRepository> = {},
  userOverrides: Partial<UserRepository> = {},
  archivoOverrides: Partial<GrupoArchivoRepository> = {},
  solicitudOverrides: Partial<SolicitudGrupoRepository> = {},
) {
  return new GroupUseCases(
    makeGroupRepo(groupOverrides),
    makeMateriaRepo(materiaOverrides),
    makeUserRepo(userOverrides),
    makeArchivoRepo(archivoOverrides),
    makeSolicitudRepo(solicitudOverrides),
  );
}

describe('GroupUseCases', () => {

  // ─── crearGrupo ───────────────────────────────────────────────────────────────

  describe('crearGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.crearGrupo(undefined, { nombre: 'Test', materiaId: 'mat-1' })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si nombre está vacío', async () => {
      const uc = makeUC();
      await expect(uc.crearGrupo(USUARIO, { nombre: '', materiaId: 'mat-1' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si materiaId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.crearGrupo(USUARIO, { nombre: 'Mi Grupo', materiaId: '' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 409 si ya existe un grupo con ese nombre', async () => {
      const uc = makeUC({ findByName: jest.fn().mockResolvedValue({ id: 'otro-grupo' }) });
      await expect(uc.crearGrupo(USUARIO, { nombre: 'Álgebra Lineal', materiaId: 'mat-1' })).rejects.toMatchObject({ status: 409 });
    });

    it('lanza 404 si la materia no existe', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(null) });
      await expect(uc.crearGrupo(USUARIO, { nombre: 'Nuevo Grupo', materiaId: 'mat-inexistente' })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no cursa la materia', async () => {
      const materiaOtra = { id: 'mat-2', nombre: 'Cálculo', createdAt: new Date() };
      const usuarioSinMateria = { ...USUARIO, materiasCursando: ['Física'] };
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(materiaOtra) });
      await expect(uc.crearGrupo(usuarioSinMateria, { nombre: 'Nuevo Grupo', materiaId: 'mat-2' })).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 409 si ya hay 3 grupos para esa materia', async () => {
      const uc = makeUC(
        { countByMateria: jest.fn().mockResolvedValue(3) },
        { findById: jest.fn().mockResolvedValue(MATERIA_MOCK) },
      );
      await expect(uc.crearGrupo(USUARIO, { nombre: 'Nuevo Grupo', materiaId: 'mat-1' })).rejects.toMatchObject({ status: 409 });
    });

    it('crea el grupo correctamente', async () => {
      const uc = makeUC(
        {},
        { findById: jest.fn().mockResolvedValue(MATERIA_MOCK) },
      );
      const result = await uc.crearGrupo(USUARIO, { nombre: 'Álgebra Lineal', materiaId: 'mat-1' });
      expect(result.message).toMatch(/creado/i);
      expect(result.data.nombre).toBe(GRUPO_MOCK.nombre);
    });
  });

  // ─── listarMisGrupos ──────────────────────────────────────────────────────────

  describe('listarMisGrupos', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.listarMisGrupos(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna los grupos del usuario', async () => {
      const uc = makeUC({ listByUser: jest.fn().mockResolvedValue([GRUPO_MOCK]) });
      const result = await uc.listarMisGrupos(USUARIO);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── listarGruposDisponibles ──────────────────────────────────────────────────

  describe('listarGruposDisponibles', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.listarGruposDisponibles(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna grupos disponibles por materias del usuario', async () => {
      const uc = makeUC({ listAvailable: jest.fn().mockResolvedValue([GRUPO_MOCK]) });
      const result = await uc.listarGruposDisponibles(USUARIO);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── buscarPorTexto ───────────────────────────────────────────────────────────

  describe('buscarPorTexto', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.buscarPorTexto(undefined, 'álgebra')).rejects.toMatchObject({ status: 401 });
    });

    it('retorna lista vacía si texto está vacío', async () => {
      const uc = makeUC();
      const result = await uc.buscarPorTexto(USUARIO, '  ');
      expect(result.data).toHaveLength(0);
    });

    it('busca por texto cuando hay texto válido', async () => {
      const uc = makeUC({ searchByText: jest.fn().mockResolvedValue([GRUPO_MOCK]) });
      const result = await uc.buscarPorTexto(USUARIO, 'álgebra');
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── obtenerGrupo ─────────────────────────────────────────────────────────────

  describe('obtenerGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerGrupo(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si grupoId no es string', async () => {
      const uc = makeUC();
      await expect(uc.obtenerGrupo(USUARIO, 123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.obtenerGrupo(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es miembro', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.obtenerGrupo(OTRO_USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 403 });
    });

    it('retorna el grupo cuando el usuario es miembro', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      const result = await uc.obtenerGrupo(USUARIO, 'grupo-1');
      expect(result.data.id).toBe('grupo-1');
    });
  });

  // ─── solicitarIngreso ─────────────────────────────────────────────────────────

  describe('solicitarIngreso', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.solicitarIngreso(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.solicitarIngreso(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no cursa la materia del grupo', async () => {
      const grupoOtraMateria = { ...GRUPO_MOCK, materia: { id: 'mat-3', nombre: 'Física', createdAt: new Date() } };
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(grupoOtraMateria) });
      await expect(uc.solicitarIngreso(USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 409 si ya hay una solicitud pendiente', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
        {}, {},  {},
        { buscarPendiente: jest.fn().mockResolvedValue(SOLICITUD_MOCK) },
      );
      await expect(uc.solicitarIngreso(USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 409 });
    });

    it('crea la solicitud correctamente', async () => {
      // OTRO_USUARIO cursa Álgebra pero no está en los miembros del grupo
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.solicitarIngreso(OTRO_USUARIO, 'grupo-1');
      expect(result.message).toMatch(/enviada/i);
      expect(result.data.estado).toBe('PENDIENTE');
    });
  });

  // ─── listarSolicitudesGrupo ───────────────────────────────────────────────────

  describe('listarSolicitudesGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.listarSolicitudesGrupo(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.listarSolicitudesGrupo(ADMIN_USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no es el administrador', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.listarSolicitudesGrupo(OTRO_USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 403 });
    });

    it('retorna solicitudes cuando es el administrador', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
        {}, {}, {},
        { listarPorGrupo: jest.fn().mockResolvedValue([SOLICITUD_MOCK]) },
      );
      const result = await uc.listarSolicitudesGrupo(ADMIN_USUARIO, 'grupo-1');
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── obtenerMiembrosGrupo ─────────────────────────────────────────────────────

  describe('obtenerMiembrosGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerMiembrosGrupo(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.obtenerMiembrosGrupo(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no es miembro', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.obtenerMiembrosGrupo(OTRO_USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 403 });
    });

    it('retorna miembros del grupo', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      const result = await uc.obtenerMiembrosGrupo(USUARIO, 'grupo-1');
      expect(result.data.grupoId).toBe('grupo-1');
      expect(result.data.cantidadMiembros).toBe(1);
    });
  });

  // ─── abandonarGrupo ───────────────────────────────────────────────────────────

  describe('abandonarGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.abandonarGrupo(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.abandonarGrupo(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('abandona el grupo correctamente cuando hay más miembros', async () => {
      const grupoConDosMiembros = {
        ...GRUPO_MOCK,
        miembros: [
          { id: 'mb-1', usuarioId: 'user-1', usuario: { id: 'user-1', nombre: 'Test', apellido: 'User' } },
          { id: 'mb-2', usuarioId: 'user-2', usuario: { id: 'user-2', nombre: 'Otro', apellido: 'User' } },
        ],
      };
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(grupoConDosMiembros) });
      const result = await uc.abandonarGrupo(USUARIO, 'grupo-1');
      expect(result.grupoEliminado).toBe(false);
    });
  });
});
