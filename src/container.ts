import { ForoUseCases } from './modules/foro/application/foro.use-cases';
import { PrismaForoRepository } from './modules/foro/infrastructure/prisma-foro.repository';
import { CatalogUseCases } from './modules/catalog/application/catalog.use-cases';
import { PrismaCarreraRepository } from './modules/catalog/infrastructure/prisma-carrera.repository';
import { EventUseCases } from './modules/events/application/event.use-cases';
import { PrismaEventoRepository } from './modules/events/infrastructure/prisma-evento.repository';
import { GroupUseCases } from './modules/groups/application/group.use-cases';
import { PrismaGrupoRepository, PrismaGrupoArchivoRepository } from './modules/groups/infrastructure/prisma-grupo.repository';
import { PrismaSolicitudGrupoRepository } from './modules/groups/infrastructure/prisma-solicitud-grupo.repository';
import { SocketGroupObserver } from './modules/groups/infrastructure/socket-group.observer';
import { MateriaUseCases } from './modules/materias/application/materia.use-cases';
import { PrismaMateriaRepository } from './modules/materias/infrastructure/prisma-materia.repository';
import { ChatSubject } from './modules/messages/domain/chat-subject';
import { MessageUseCases } from './modules/messages/application/message.use-cases';
import { PrismaMensajeRepository } from './modules/messages/infrastructure/prisma-mensaje.repository';
import { SocketMessageGateway } from './modules/messages/infrastructure/socket-message.gateway';
import { UsersUseCases } from './modules/users/application/users.use-cases';
import { Auth0IdentityVerificationService } from './modules/users/infrastructure/auth0-identity.service';
import { BcryptPasswordService } from './modules/users/infrastructure/bcrypt-password.service';
import { PrismaContactRepository } from './modules/users/infrastructure/prisma-contact.repository';
import { JwtTokenService } from './modules/users/infrastructure/jwt-token.service';
import { InMemoryTokenBlacklistService } from './modules/users/infrastructure/token-blacklist.service';
import { PrismaUserRepository } from './modules/users/infrastructure/prisma-user.repository';
import { PrismaEstadisticasRepository } from './modules/users/infrastructure/prisma-estadisticas.repository';
import { NotificacionService } from './modules/notifications/application/NotificacionService';
import { InMemoryPreferenciaRepository } from './modules/notifications/infrastructure/InMemoryPreferenciaRepository';
import { InAppWebSocketStrategy } from './modules/notifications/infrastructure/strategies/InAppWebSocketStrategy';
import { EmailInstitucionalStrategy } from './modules/notifications/infrastructure/strategies/EmailInstitucionalStrategy';
import { PushMovilStrategy } from './modules/notifications/infrastructure/strategies/PushMovilStrategy';
import { ResumenDiarioStrategy } from './modules/notifications/infrastructure/strategies/ResumenDiarioStrategy';

const userRepository = new PrismaUserRepository();
const contactRepository = new PrismaContactRepository();
const careerRepository = new PrismaCarreraRepository();
const materiaRepository = new PrismaMateriaRepository();
const grupoRepository = new PrismaGrupoRepository();
const grupoArchivoRepository = new PrismaGrupoArchivoRepository();
const solicitudGrupoRepository = new PrismaSolicitudGrupoRepository();
const mensajeRepository = new PrismaMensajeRepository();
const eventoRepository = new PrismaEventoRepository();

const estadisticasRepository = new PrismaEstadisticasRepository();

const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();
const identityVerificationService = new Auth0IdentityVerificationService();
const tokenBlacklistService = new InMemoryTokenBlacklistService();
const messageGateway = new SocketMessageGateway();
const groupEventObserver = new SocketGroupObserver();

// ── ChatSubject para mensajes de grupo (Patrón Observer) ──
const chatSubject = ChatSubject.getInstance();

export const usersUseCases = new UsersUseCases({
  userRepository,
  contactRepository,
  careerRepository,
  materiaRepository,
  passwordService,
  tokenService,
  identityVerificationService,
  tokenBlacklistService,
  estadisticasRepository,
});

export const groupUseCases = new GroupUseCases(
  grupoRepository, 
  materiaRepository, 
  userRepository, 
  grupoArchivoRepository, 
  solicitudGrupoRepository,
  [groupEventObserver]
);
export const materiaUseCases = new MateriaUseCases(materiaRepository);
export const messageUseCases = new MessageUseCases(
  mensajeRepository,
  userRepository,
  contactRepository,
  grupoRepository,
  messageGateway,
  chatSubject,
);
export const eventUseCases = new EventUseCases(eventoRepository);
export const catalogUseCases = new CatalogUseCases(careerRepository, materiaRepository);

// ── Exportar ChatSubject para uso en socket.ts ──
export { chatSubject };

// ── Patrón Strategy: Notificaciones ──
export const preferenciaRepository = new InMemoryPreferenciaRepository();

export const notificacionService = new NotificacionService(
  [
    new InAppWebSocketStrategy(),
    new EmailInstitucionalStrategy(),
    new PushMovilStrategy(),
    new ResumenDiarioStrategy(),
  ],
  preferenciaRepository,
);

// ── Módulo Foro ──
const foroRepository = new PrismaForoRepository();
export const foroUseCases = new ForoUseCases(foroRepository);