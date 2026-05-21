import { MessageUseCases } from '../src/modules/messages/application/message.use-cases';
import type {
  MessageRepository,
  UserRepository,
  ContactRepository,
  GroupRepository,
  MessageGateway,
  MessageRecord,
  GroupMessageRecord,
  GroupRecord,
} from '../src/domain/contracts';
import { ChatSubject } from '../src/modules/messages/domain/chat-subject';
import { NotificacionService } from '../src/modules/notifications/application/NotificacionService';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };
const OTRO = { id: 'user-2', correo: 'otro@ucaldas.edu.co', nombre: 'Otro', materiasCursando: [] };

// ID Mongo válido (24 hex chars)
const MONGO_ID_1 = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const MONGO_ID_2 = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const MONGO_ID_GRUPO = 'cccccccccccccccccccccccc';

const MENSAJE_MOCK: MessageRecord = {
  id: 'msg-1',
  contenido: 'Hola!',
  emisorId: MONGO_ID_1,
  receptorId: MONGO_ID_2,
  createdAt: new Date(),
};

const GRUPO_MENSAJE_MOCK: GroupMessageRecord = {
  id: 'gmsg-1',
  contenido: 'Hola grupo!',
  grupoId: MONGO_ID_GRUPO,
  emisorId: MONGO_ID_1,
  createdAt: new Date(),
};

const GRUPO_MOCK: GroupRecord = {
  id: MONGO_ID_GRUPO,
  nombre: 'Álgebra',
  materiaId: 'mat-1',
  creadorId: MONGO_ID_1,
  administradorId: MONGO_ID_1,
  candidatoAdminId: null,
  estado: 'ACTIVO',
  createdAt: new Date(),
  materia: { id: 'mat-1', nombre: 'Álgebra', createdAt: new Date() },
  miembros: [
    { id: 'mb-1', usuarioId: MONGO_ID_1, usuario: { id: MONGO_ID_1, nombre: 'Test', apellido: 'User' } },
  ],
};

function makeMessageRepo(overrides: Partial<MessageRepository> = {}): MessageRepository {
  return {
    create: jest.fn().mockResolvedValue(MENSAJE_MOCK),
    getConversation: jest.fn().mockResolvedValue([]),
    createGroupMessage: jest.fn().mockResolvedValue(GRUPO_MENSAJE_MOCK),
    getGroupHistory: jest.fn().mockResolvedValue([]),
    addMencion: jest.fn().mockResolvedValue({ id: 'men-1', mensajeId: 'msg-1', usuarioMencionadoId: 'u-1', createdAt: new Date() }),
    getMencionesByMensaje: jest.fn().mockResolvedValue([]),
    getMencionesPendientes: jest.fn().mockResolvedValue([]),
    addReaccion: jest.fn().mockResolvedValue({ id: 'r-1', mensajeId: 'msg-1', usuarioId: 'u-1', emoji: '👍', createdAt: new Date() }),
    removeReaccion: jest.fn().mockResolvedValue(undefined),
    getReaccionesByMensaje: jest.fn().mockResolvedValue([]),
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

function makeContactRepo(overrides: Partial<ContactRepository> = {}): ContactRepository {
  return {
    findRelationBetweenUsers: jest.fn().mockResolvedValue(null),
    createRequest: jest.fn(),
    getRelatedIds: jest.fn().mockResolvedValue([]),
    listAcceptedPeers: jest.fn().mockResolvedValue([]),
    listReceivedPendingRequests: jest.fn().mockResolvedValue([]),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
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
    join: jest.fn().mockResolvedValue(undefined),
    updateAdministrador: jest.fn().mockResolvedValue(undefined),
    updateEstado: jest.fn().mockResolvedValue(undefined),
    updateCandidatoAdmin: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    deleteGroup: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeGateway(): MessageGateway {
  return {
    emitNewMessage: jest.fn(),
    emitNewGroupMessage: jest.fn(),
    emitMencion: jest.fn(),
    emitReaccion: jest.fn(),
    emitRemoveReaccion: jest.fn(),
  };
}

function makeChatSubject(): ChatSubject {
  return { emitirNuevoMensaje: jest.fn() } as any;
}

function makeNotificacionService(): NotificacionService {
  return { notificar: jest.fn().mockResolvedValue(undefined) } as any;
}

function makeUC(
  msgOverrides: Partial<MessageRepository> = {},
  userOverrides: Partial<UserRepository> = {},
  contactOverrides: Partial<ContactRepository> = {},
  groupOverrides: Partial<GroupRepository> = {},
) {
  return new MessageUseCases(
    makeMessageRepo(msgOverrides),
    makeUserRepo(userOverrides),
    makeContactRepo(contactOverrides),
    makeGroupRepo(groupOverrides),
    makeGateway(),
    makeChatSubject(),
    makeNotificacionService(),
  );
}

// Usuario con mongoId válido para las pruebas
const USUARIO_MONGO = { ...USUARIO, id: MONGO_ID_1 };

describe('MessageUseCases', () => {

  // ─── enviarMensaje ────────────────────────────────────────────────────────────

  describe('enviarMensaje', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensaje(undefined, MONGO_ID_2, 'Hola')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si receptorId está vacío', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensaje(USUARIO_MONGO, '', 'Hola')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si receptorId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensaje(USUARIO_MONGO, 'no-es-mongo-id', 'Hola')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si contenido no es string', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensaje(USUARIO_MONGO, MONGO_ID_2, 123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el receptor no existe', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(null) });
      await expect(uc.enviarMensaje(USUARIO_MONGO, MONGO_ID_2, 'Hola')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si no son compañeros (relación no aceptada)', async () => {
      const uc = makeUC(
        {},
        { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        { findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'PENDIENTE' }) },
      );
      await expect(uc.enviarMensaje(USUARIO_MONGO, MONGO_ID_2, 'Hola')).rejects.toMatchObject({ status: 400 });
    });

    it('envía mensaje correctamente entre compañeros', async () => {
      const uc = makeUC(
        { create: jest.fn().mockResolvedValue(MENSAJE_MOCK) },
        { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        { findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'ACEPTADA' }) },
      );
      const result = await uc.enviarMensaje(USUARIO_MONGO, MONGO_ID_2, 'Hola!');
      expect(result.message).toMatch(/enviado/i);
      expect(result.data).toEqual(MENSAJE_MOCK);
    });
  });

  // ─── obtenerHistorial ─────────────────────────────────────────────────────────

  describe('obtenerHistorial', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerHistorial(undefined, MONGO_ID_2, 50)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si companeroId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.obtenerHistorial(USUARIO_MONGO, 'invalid', 50)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si companeroId es el mismo usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerHistorial(USUARIO_MONGO, MONGO_ID_1, 50)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el compañero no existe', async () => {
      const uc = makeUC({}, { findById: jest.fn().mockResolvedValue(null) });
      await expect(uc.obtenerHistorial(USUARIO_MONGO, MONGO_ID_2, 50)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no son compañeros', async () => {
      const uc = makeUC(
        {},
        { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        { findRelationBetweenUsers: jest.fn().mockResolvedValue(null) },
      );
      await expect(uc.obtenerHistorial(USUARIO_MONGO, MONGO_ID_2, 50)).rejects.toMatchObject({ status: 403 });
    });

    it('retorna historial de conversación', async () => {
      const uc = makeUC(
        { getConversation: jest.fn().mockResolvedValue([MENSAJE_MOCK]) },
        { findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) },
        { findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'ACEPTADA' }) },
      );
      const result = await uc.obtenerHistorial(USUARIO_MONGO, MONGO_ID_2, 50);
      expect(result.data).toHaveLength(1);
    });

    it('usa límite 50 por defecto si limit es inválido', async () => {
      const msgRepo = makeMessageRepo({ getConversation: jest.fn().mockResolvedValue([]) });
      const uc = new MessageUseCases(
        msgRepo,
        makeUserRepo({ findById: jest.fn().mockResolvedValue({ id: MONGO_ID_2 }) }),
        makeContactRepo({ findRelationBetweenUsers: jest.fn().mockResolvedValue({ estado: 'ACEPTADA' }) }),
        makeGroupRepo(),
        makeGateway(),
        makeChatSubject(),
        makeNotificacionService(),
      );
      await uc.obtenerHistorial(USUARIO_MONGO, MONGO_ID_2, 'invalido');
      expect(msgRepo.getConversation).toHaveBeenCalledWith(MONGO_ID_1, MONGO_ID_2, 50);
    });
  });

  // ─── enviarMensajeGrupo ───────────────────────────────────────────────────────

  describe('enviarMensajeGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensajeGrupo(undefined, MONGO_ID_GRUPO, 'Hola')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si grupoId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensajeGrupo(USUARIO_MONGO, 'no-id', 'Hola')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si el grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.enviarMensajeGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 'Hola')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si el usuario no es miembro del grupo', async () => {
      const grupoSinMiembro = { ...GRUPO_MOCK, miembros: [] };
      const uc = makeUC({}, {}, {}, { findById: jest.fn().mockResolvedValue(grupoSinMiembro) });
      await expect(uc.enviarMensajeGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 'Hola')).rejects.toMatchObject({ status: 400 });
    });

    it('envía mensaje de grupo correctamente', async () => {
      const uc = makeUC(
        { createGroupMessage: jest.fn().mockResolvedValue(GRUPO_MENSAJE_MOCK) },
        {},
        {},
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.enviarMensajeGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 'Hola grupo!');
      expect(result.message).toMatch(/enviado/i);
      expect(result.data).toEqual(GRUPO_MENSAJE_MOCK);
    });
  });

  // ─── obtenerHistorialGrupo ────────────────────────────────────────────────────

  describe('obtenerHistorialGrupo', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerHistorialGrupo(undefined, MONGO_ID_GRUPO, 50)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 404 si el grupo no existe', async () => {
      const uc = makeUC();
      await expect(uc.obtenerHistorialGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 50)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si no es miembro del grupo', async () => {
      const grupoSinMiembro = { ...GRUPO_MOCK, miembros: [] };
      const uc = makeUC({}, {}, {}, { findById: jest.fn().mockResolvedValue(grupoSinMiembro) });
      await expect(uc.obtenerHistorialGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 50)).rejects.toMatchObject({ status: 403 });
    });

    it('retorna historial del grupo', async () => {
      const uc = makeUC(
        { getGroupHistory: jest.fn().mockResolvedValue([GRUPO_MENSAJE_MOCK]) },
        {},
        {},
        { findById: jest.fn().mockResolvedValue(GRUPO_MOCK) },
      );
      const result = await uc.obtenerHistorialGrupo(USUARIO_MONGO, MONGO_ID_GRUPO, 50);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── agregarReaccion ──────────────────────────────────────────────────────────

  describe('agregarReaccion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.agregarReaccion(undefined, MONGO_ID_1, '👍', false)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si mensajeId no tiene formato MongoDB', async () => {
      const uc = makeUC();
      await expect(uc.agregarReaccion(USUARIO_MONGO, 'invalid', '👍', false)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si emoji está vacío', async () => {
      const uc = makeUC();
      await expect(uc.agregarReaccion(USUARIO_MONGO, MONGO_ID_1, '', false)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si esGrupo no es booleano', async () => {
      const uc = makeUC();
      await expect(uc.agregarReaccion(USUARIO_MONGO, MONGO_ID_1, '👍', 'true')).rejects.toMatchObject({ status: 400 });
    });

    it('agrega reacción correctamente con emoji válido', async () => {
      const reaccionMock = { id: 'r-1', mensajeId: MONGO_ID_1, usuarioId: MONGO_ID_1, emoji: '👍', createdAt: new Date() };
      const uc = makeUC({ addReaccion: jest.fn().mockResolvedValue(reaccionMock) });
      const result = await uc.agregarReaccion(USUARIO_MONGO, MONGO_ID_1, '👍', false);
      expect(result.message).toMatch(/agregada/i);
    });
  });

  // ─── obtenerMencionesPendientes ───────────────────────────────────────────────

  describe('obtenerMencionesPendientes', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = makeUC();
      await expect(uc.obtenerMencionesPendientes(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna menciones pendientes del usuario', async () => {
      const mencionMock = { id: 'men-1', mensajeId: 'msg-1', usuarioMencionadoId: MONGO_ID_1, createdAt: new Date() };
      const uc = makeUC({ getMencionesPendientes: jest.fn().mockResolvedValue([mencionMock]) });
      const result = await uc.obtenerMencionesPendientes(USUARIO_MONGO);
      expect(result.data).toHaveLength(1);
    });
  });
});
