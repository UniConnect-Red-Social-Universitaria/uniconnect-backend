export type ContactStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface AuthenticatedUser {
  id: string;
  correo: string;
  nombre: string;
  materiasCursando: string[];
}

export interface CatalogItem {
  id: string;
  nombre: string;
  createdAt?: Date;
}

export interface UserSummary {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  carrera: string;
  semestre: number | null;
  materiasCursando: string[];
  correoVerificado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWithPassword extends UserSummary {
  contrasenaHash: string;
}

export interface CreateUserData {
  nombre: string;
  apellido: string;
  correo: string;
  contrasenaHash: string;
  carrera: string;
  carreraId?: string;
  semestre: number;
  materiasCursando: string[];
  correoVerificado: boolean;
  googleSub?: string;
}

export interface UpdateUserProfileData {
  carrera?: string;
  carreraId?: string;
  semestre?: number;
  materiasCursando?: string[];
}

export interface ContactRelation {
  estado: ContactStatus;
}

export interface ContactRequestRecord {
  id: string;
  estado: ContactStatus;
  solicitanteId: string;
  receptorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactPeerView {
  contactoId: string;
  estado: ContactStatus;
  usuario: UserSummary;
}

export interface ReceivedContactRequestView {
  solicitudId: string;
  estado: ContactStatus;
  createdAt: Date;
  solicitante: UserSummary;
}

export interface GroupMemberView {
  id: string;
  usuarioId?: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface GroupRecord {
  id: string;
  nombre: string;
  materiaId: string;
  creadorId: string;
  administradorId: string;
  createdAt: Date;
  materia: CatalogItem;
  miembros: GroupMemberView[];
}

export interface GrupoArchivoRecord {
  id: string;
  nombre: string;
  nombreFisico: string;
  ruta: string;
  mimeType: string;
  tamanoBytes: number;
  grupoId: string;
  subidoPorId: string;
  createdAt: Date;
  subidoPor?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface CreateGrupoArchivoData {
  nombre: string;
  nombreFisico: string;
  ruta: string;
  mimeType: string;
  tamanoBytes: number;
  grupoId: string;
  subidoPorId: string;
}

export interface CreateGroupData {
  nombre: string;
  materiaId: string;
  creadorId: string;
}

export interface MessageRecord {
  id: string;
  contenido: string;
  emisorId: string;
  receptorId: string;
  createdAt: Date;
  emisor?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface GroupMessageRecord {
  id: string;
  contenido: string;
  grupoId: string;
  nombreGrupo?: string;
  emisorId: string;
  createdAt: Date;
  emisor?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface CreateMessageData {
  contenido: string;
  emisorId: string;
  receptorId: string;
}

export interface EventCreator {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
}

export interface EventRecord {
  id: string;
  titulo: string;
  descripcion: string;
  lugar?: string | null;
  fechaEvento: Date;
  creadorId: string;
  createdAt: Date;
  creador?: EventCreator;
}

export interface CreateEventData {
  titulo: string;
  descripcion: string;
  lugar: string;
  fechaEvento: Date;
  creadorId: string;
}

export interface CountResult {
  count: number;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<{
    id: string;
    createdAt: Date;
  }>;
  findByEmail(correo: string): Promise<{ id: string } | null>;
  findByEmailWithPassword(correo: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<{ id: string } | null>;
  findSafeById(id: string): Promise<UserSummary | null>;
  listAll(): Promise<UserSummary[]>;
  searchByMateriaExcluding(
    materia: string,
    usuarioActualId: string,
    idsExcluidos: string[],
  ): Promise<Array<{
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    carrera: string;
    semestre: number;
    materiasCursando: string[];
  }>>;
  updateProfile(id: string, data: UpdateUserProfileData): Promise<UserSummary>;
  delete(id: string): Promise<void>;
}

export interface ContactRepository {
  findRelationBetweenUsers(
    usuarioAId: string,
    usuarioBId: string,
  ): Promise<ContactRelation | null>;
  createRequest(
    solicitanteId: string,
    receptorId: string,
  ): Promise<ContactRequestRecord>;
  getRelatedIds(usuarioId: string): Promise<string[]>;
  listAcceptedPeers(usuarioId: string): Promise<ContactPeerView[]>;
  listReceivedPendingRequests(
    usuarioId: string,
  ): Promise<ReceivedContactRequestView[]>;
  acceptRequest(
    solicitudId: string,
    usuarioReceptorId: string,
  ): Promise<ContactRequestRecord>;
}

export interface CareerRepository {
  findByName(nombre: string): Promise<CatalogItem | null>;
  listAll(): Promise<CatalogItem[]>;
  count(): Promise<number>;
  createCatalog(nombres: string[]): Promise<CountResult>;
}

export interface MateriaRepository {
  create(nombre: string): Promise<{ id: string; nombre: string; createdAt: Date }>;
  findById(id: string): Promise<CatalogItem | null>;
  findByName(nombre: string): Promise<CatalogItem | null>;
  listAll(): Promise<CatalogItem[]>;
  count(): Promise<number>;
  createCatalog(nombres: string[]): Promise<CountResult>;
}

export interface GroupRepository {
  create(data: CreateGroupData): Promise<GroupRecord>;
  listByUser(usuarioId: string): Promise<GroupRecord[]>;
  listAvailable(materiasCursando: string[], usuarioId: string): Promise<GroupRecord[]>;
  findById(id: string): Promise<GroupRecord | null>;
  findByName(nombre: string): Promise<{ id: string } | null>;
  countByMateria(materiaId: string): Promise<number>;
  join(grupoId: string, usuarioId: string): Promise<void>;
  updateAdministrador(grupoId: string, nuevoAdminId: string): Promise<void>;
}

export interface GrupoArchivoRepository {
  crear(data: CreateGrupoArchivoData): Promise<GrupoArchivoRecord>;
  listarPorGrupo(grupoId: string): Promise<GrupoArchivoRecord[]>;
  buscarPorId(archivoId: string): Promise<GrupoArchivoRecord | null>;
}

export interface MessageRepository {
  create(data: CreateMessageData): Promise<MessageRecord>;
  getConversation(usuarioAId: string, usuarioBId: string, limit: number): Promise<MessageRecord[]>;
  createGroupMessage(data: {
    contenido: string;
    grupoId: string;
    emisorId: string;
  }): Promise<GroupMessageRecord>;
  getGroupHistory(grupoId: string, limit: number): Promise<GroupMessageRecord[]>;
}

export interface EventRepository {
  create(data: CreateEventData): Promise<EventRecord>;
  listUpcoming(): Promise<EventRecord[]>;
}

export interface PasswordService {
  hash(value: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}

export interface TokenService {
  sign(payload: AuthenticatedUser): string;
  decodeExpiration(token: string): number | null;
}

export interface IdentityVerificationResult {
  correoVerificado: boolean;
  googleSub: string;
}

export interface IdentityVerificationService {
  verifyRegistrationIdentity(
    googleIdToken: string,
    correo: string,
  ): Promise<IdentityVerificationResult>;
}

export interface TokenBlacklistService {
  revoke(token: string, expSeconds: number): void;
}

export interface MessageGateway {
  emitNewMessage(payload: MessageRecord): void;
  emitNewGroupMessage(payload: GroupMessageRecord): void;
}