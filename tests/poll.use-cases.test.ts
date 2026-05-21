import { PollUseCases } from '../src/modules/polls/application/poll.use-cases';
import type {
  PollRepository,
  GroupRepository,
  PollGateway,
  PollRecord,
  PollOptionRecord,
  GroupRecord,
} from '../src/domain/contracts';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };
const OTRO = { id: 'user-2', correo: 'otro@ucaldas.edu.co', nombre: 'Otro', materiasCursando: [] };

const GRUPO_MOCK: GroupRecord = {
  id: 'grupo-1',
  nombre: 'Álgebra',
  materiaId: 'mat-1',
  creadorId: 'user-1',
  administradorId: 'user-1',
  candidatoAdminId: null,
  estado: 'ACTIVO',
  createdAt: new Date(),
  materia: { id: 'mat-1', nombre: 'Álgebra', createdAt: new Date() },
  miembros: [
    { id: 'mb-1', usuarioId: 'user-1', usuario: { id: 'user-1', nombre: 'Test', apellido: 'User' } },
    { id: 'mb-2', usuarioId: 'user-2', usuario: { id: 'user-2', nombre: 'Otro', apellido: 'User' } },
  ],
};

const ENCUESTA_ABIERTA: PollRecord = {
  id: 'poll-1',
  question: '¿Cuándo nos reunimos?',
  status: 'OPEN',
  target: { type: 'CHANNEL', id: 'grupo-1' },
  createdById: 'user-1',
  autoCloseAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ENCUESTA_CERRADA: PollRecord = { ...ENCUESTA_ABIERTA, id: 'poll-2', status: 'CLOSED' };

const ENCUESTA_EXPIRADA: PollRecord = {
  ...ENCUESTA_ABIERTA,
  id: 'poll-3',
  autoCloseAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora en el pasado
};

const OPCIONES_MOCK: PollOptionRecord[] = [
  { id: 'opt-1', pollId: 'poll-1', text: 'Lunes', position: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'opt-2', pollId: 'poll-1', text: 'Martes', position: 2, createdAt: new Date(), updatedAt: new Date() },
];

function makePollRepo(overrides: Partial<PollRepository> = {}): PollRepository {
  return {
    create: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA),
    findById: jest.fn().mockResolvedValue(null),
    findExpiredOpen: jest.fn().mockResolvedValue([]),
    listByTarget: jest.fn().mockResolvedValue([]),
    listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
    listVotesByPollId: jest.fn().mockResolvedValue([]),
    addOption: jest.fn(),
    vote: jest.fn().mockResolvedValue({ id: 'vote-1', pollId: 'poll-1', optionId: 'opt-1', voterId: 'user-1', createdAt: new Date(), updatedAt: new Date() }),
    updateStatus: jest.fn().mockResolvedValue(ENCUESTA_CERRADA),
    ...overrides,
  };
}

function makeGroupRepo(overrides: Partial<GroupRepository> = {}): GroupRepository {
  return {
    create: jest.fn(),
    listByUser: jest.fn().mockResolvedValue([]),
    listAvailable: jest.fn().mockResolvedValue([]),
    searchByText: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    countByMateria: jest.fn().mockResolvedValue(0),
    join: jest.fn(),
    updateAdministrador: jest.fn(),
    updateEstado: jest.fn(),
    updateCandidatoAdmin: jest.fn(),
    leave: jest.fn(),
    deleteGroup: jest.fn(),
    ...overrides,
  };
}

function makeGateway(): PollGateway {
  return {
    emitNewPoll: jest.fn(),
    emitUpdatedPoll: jest.fn(),
  };
}

function makeUC(
  pollOverrides: Partial<PollRepository> = {},
  groupOverrides: Partial<GroupRepository> = {},
) {
  return new PollUseCases(
    makePollRepo(pollOverrides),
    makeGroupRepo(groupOverrides),
    makeGateway(),
  );
}

describe('PollUseCases', () => {

  // ─── crearEncuestaEnGrupo ─────────────────────────────────────────────────────

  describe('crearEncuestaEnGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.crearEncuestaEnGrupo(undefined, 'grupo-1', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Martes'], autoCloseAt: null })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si grupoId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.crearEncuestaEnGrupo(USUARIO, '  ', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Martes'], autoCloseAt: null })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'inexistente', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Martes'], autoCloseAt: null })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es miembro del grupo', async () => {
      const grupoSinMiembro = { ...GRUPO_MOCK, miembros: [] };
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(grupoSinMiembro) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Martes'], autoCloseAt: null })).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 400 si opciones no es array', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: '¿Cuándo?', opciones: 'Lunes', autoCloseAt: null })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la pregunta es muy corta (menos de 3 chars)', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: 'A', opciones: ['Lunes', 'Martes'], autoCloseAt: null })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si hay menos de 2 opciones', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: '¿Cuándo nos reunimos?', opciones: ['Lunes'], autoCloseAt: null })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si hay opciones duplicadas', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Lunes'], autoCloseAt: null })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si autoCloseAt tiene formato inválido', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) });
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', { pregunta: '¿Cuándo?', opciones: ['Lunes', 'Martes'], autoCloseAt: 'no-es-fecha' })).rejects.toMatchObject({ status: 400 });
    });

    it('crea la encuesta correctamente con opciones string', async () => {
      const payload = { ...ENCUESTA_ABIERTA, grupoId: 'grupo-1', opciones: OPCIONES_MOCK.map(o => ({ ...o, votos: 0 })) };
      const uc = makeUC(
        { create: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA) },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', {
        pregunta: '¿Cuándo nos reunimos?',
        opciones: ['Lunes', 'Martes'],
        autoCloseAt: null,
      });
      expect(result.message).toMatch(/creada/i);
    });

    it('crea la encuesta con opciones en formato objeto', async () => {
      const uc = makeUC(
        { create: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA) },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', {
        pregunta: '¿Cuándo nos reunimos?',
        opciones: [{ text: 'Lunes', position: 1 }, { text: 'Martes', position: 2 }],
        autoCloseAt: null,
      });
      expect(result.message).toMatch(/creada/i);
    });

    it('acepta autoCloseAt como fecha futura válida en ISO', async () => {
      const fechaFutura = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const uc = makeUC(
        { create: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA) },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      await expect(uc.crearEncuestaEnGrupo(USUARIO, 'grupo-1', {
        pregunta: '¿Cuándo nos reunimos?',
        opciones: ['Lunes', 'Martes'],
        autoCloseAt: fechaFutura,
      })).resolves.toBeDefined();
    });
  });

  // ─── votarEncuestaEnGrupo ─────────────────────────────────────────────────────

  describe('votarEncuestaEnGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.votarEncuestaEnGrupo(undefined, 'poll-1', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si encuestaId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.votarEncuestaEnGrupo(USUARIO, '', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la encuesta no existe', async () => {
      const uc = makeUC();
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-inexistente', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si encuesta no es de tipo CHANNEL', async () => {
      const encuestaChat = { ...ENCUESTA_ABIERTA, target: { type: 'CHAT' as const, id: 'chat-1' } };
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(encuestaChat) });
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el grupo de la encuesta no existe', async () => {
      const uc = makeUC({ findById: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA) });
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es miembro del grupo', async () => {
      const grupoSinMiembro = { ...GRUPO_MOCK, miembros: [] };
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA) },
        { findById: jest.fn().mockResolvedValue(grupoSinMiembro) },
      );
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 409 si la encuesta ya expiró (autoClose)', async () => {
      const uc = makeUC(
        {
          findById: jest.fn().mockResolvedValue(ENCUESTA_EXPIRADA),
          updateStatus: jest.fn().mockResolvedValue(ENCUESTA_CERRADA),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([]),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-3', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 409 });
    });

    it('lanza 409 si la encuesta está cerrada', async () => {
      const uc = makeUC(
        { findById: jest.fn().mockResolvedValue(ENCUESTA_CERRADA) },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-2', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 409 });
    });

    it('lanza 400 si la opción no pertenece a esta encuesta', async () => {
      const uc = makeUC(
        {
          findById: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([]),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-inexistente' })).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 409 si el usuario ya votó', async () => {
      const voto = { id: 'v-1', pollId: 'poll-1', optionId: 'opt-1', voterId: 'user-1', createdAt: new Date(), updatedAt: new Date() };
      const uc = makeUC(
        {
          findById: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([voto]),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      await expect(uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-1' })).rejects.toMatchObject({ status: 409 });
    });

    it('registra el voto correctamente', async () => {
      const uc = makeUC(
        {
          findById: jest.fn().mockResolvedValue(ENCUESTA_ABIERTA),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([]),
          vote: jest.fn().mockResolvedValue({ id: 'v-1', pollId: 'poll-1', optionId: 'opt-1', voterId: 'user-1', createdAt: new Date(), updatedAt: new Date() }),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.votarEncuestaEnGrupo(USUARIO, 'poll-1', { optionId: 'opt-1' });
      expect(result.message).toMatch(/registrado/i);
    });
  });

  // ─── obtenerEncuestasDeGrupo ──────────────────────────────────────────────────

  describe('obtenerEncuestasDeGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerEncuestasDeGrupo(undefined, 'grupo-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si grupoId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.obtenerEncuestasDeGrupo(USUARIO, '')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.obtenerEncuestasDeGrupo(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es miembro', async () => {
      const grupoSinMiembro = { ...GRUPO_MOCK, miembros: [] };
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(grupoSinMiembro) });
      await expect(uc.obtenerEncuestasDeGrupo(USUARIO, 'grupo-1')).rejects.toMatchObject({ status: 403 });
    });

    it('retorna lista vacía cuando no hay encuestas', async () => {
      const uc = makeUC(
        { listByTarget: jest.fn().mockResolvedValue([]) },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.obtenerEncuestasDeGrupo(USUARIO, 'grupo-1');
      expect(result.data).toHaveLength(0);
    });

    it('retorna encuestas con resultados calculados', async () => {
      const voto = { id: 'v-1', pollId: 'poll-1', optionId: 'opt-1', voterId: 'user-2', createdAt: new Date(), updatedAt: new Date() };
      const uc = makeUC(
        {
          listByTarget: jest.fn().mockResolvedValue([ENCUESTA_ABIERTA]),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([voto]),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.obtenerEncuestasDeGrupo(USUARIO, 'grupo-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].opciones).toBeDefined();
    });

    it('ordena las encuestas de más antigua a más reciente', async () => {
      const encuesta1 = { ...ENCUESTA_ABIERTA, id: 'poll-a', createdAt: new Date('2024-01-01') };
      const encuesta2 = { ...ENCUESTA_ABIERTA, id: 'poll-b', createdAt: new Date('2024-06-01') };
      const uc = makeUC(
        {
          listByTarget: jest.fn().mockResolvedValue([encuesta2, encuesta1]),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([]),
        },
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.obtenerEncuestasDeGrupo(USUARIO, 'grupo-1');
      expect(result.data[0].id).toBe('poll-a');
      expect(result.data[1].id).toBe('poll-b');
    });
  });

  // ─── cerrarEncuestasExpiradas ─────────────────────────────────────────────────

  describe('cerrarEncuestasExpiradas', () => {
    it('retorna lista vacía si no hay encuestas expiradas', async () => {
      const uc = makeUC({ findExpiredOpen: jest.fn().mockResolvedValue([]) });
      const result = await uc.cerrarEncuestasExpiradas();
      expect(result.data).toHaveLength(0);
    });

    it('cierra encuestas expiradas y emite eventos', async () => {
      const gateway = makeGateway();
      const uc = new PollUseCases(
        makePollRepo({
          findExpiredOpen: jest.fn().mockResolvedValue([ENCUESTA_EXPIRADA]),
          updateStatus: jest.fn().mockResolvedValue(ENCUESTA_CERRADA),
          listOptionsByPollId: jest.fn().mockResolvedValue(OPCIONES_MOCK),
          listVotesByPollId: jest.fn().mockResolvedValue([]),
        }),
        makeGroupRepo(),
        gateway,
      );
      const result = await uc.cerrarEncuestasExpiradas();
      expect(result.data).toHaveLength(1);
      expect(gateway.emitUpdatedPoll).toHaveBeenCalled();
    });

    it('usa el timestamp pasado como parámetro para cerrar', async () => {
      const pollRepo = makePollRepo({
        findExpiredOpen: jest.fn().mockResolvedValue([]),
      });
      const uc = new PollUseCases(pollRepo, makeGroupRepo(), makeGateway());
      const ahora = new Date('2025-01-01');
      await uc.cerrarEncuestasExpiradas(ahora);
      expect(pollRepo.findExpiredOpen).toHaveBeenCalledWith(ahora);
    });
  });
});
