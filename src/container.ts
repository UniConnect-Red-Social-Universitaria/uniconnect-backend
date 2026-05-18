import { ForoUseCases } from './modules/foro/application/foro.use-cases';
import { PrismaForoRepository } from './modules/foro/infrastructure/prisma-foro.repository';
import { SesionEstudioUseCases } from './modules/sesiones/application/sesion.use-cases';
import { PrismaSesionEstudioRepository } from './modules/sesiones/infrastructure/prisma-sesion.repository';
import { RecordatorioScheduler } from './modules/sesiones/infrastructure/RecordatorioScheduler';
import { CatalogUseCases } from './modules/catalog/application/catalog.use-cases';
import { PrismaCarreraRepository } from './modules/catalog/infrastructure/prisma-carrera.repository';
import { EventUseCases } from './modules/events/application/event.use-cases';
import { PrismaEventoRepository } from './modules/events/infrastructure/prisma-evento.repository';
import { GroupUseCases } from './modules/groups/application/group.use-cases';
import { PrismaGrupoRepository, PrismaGrupoArchivoRepository } from './modules/groups/infrastructure/prisma-grupo.repository';
import { PrismaSolicitudGrupoRepository } from './modules/groups/infrastructure/prisma-solicitud-grupo.repository';
import { SocketGroupObserver } from './modules/groups/infrastructure/socket-group.observer';
import { PersistenciaGroupObserver } from './modules/groups/infrastructure/persistencia-group.observer';
import { MateriaUseCases } from './modules/materias/application/materia.use-cases';
import { PrismaMateriaRepository } from './modules/materias/infrastructure/prisma-materia.repository';
import { ChatSubject } from './modules/messages/domain/chat-subject';
import { MessageUseCases } from './modules/messages/application/message.use-cases';
import { PrismaMensajeRepository } from './modules/messages/infrastructure/prisma-mensaje.repository';
import { SocketMessageGateway } from './modules/messages/infrastructure/socket-message.gateway';
import { PollUseCases } from './modules/polls/application/poll.use-cases';
import { PrismaPollRepository } from './modules/polls/infrastructure/prisma-poll.repository';
import { ModerationPollGatewayDecorator } from './modules/polls/infrastructure/moderation-poll-gateway.decorator';
import { LoggingPollGatewayDecorator } from './modules/polls/infrastructure/logging-poll-gateway.decorator';
import { SocketPollGateway } from './modules/polls/infrastructure/socket-poll.gateway';
import { PollAutoCloseScheduler } from './modules/polls/infrastructure/poll-auto-close.scheduler';
import { UsersUseCases } from './modules/users/application/users.use-cases';
import { Auth0IdentityVerificationService } from './modules/users/infrastructure/auth0-identity.service';
import { BcryptPasswordService } from './modules/users/infrastructure/bcrypt-password.service';
import { PrismaContactRepository } from './modules/users/infrastructure/prisma-contact.repository';
import { JwtTokenService } from './modules/users/infrastructure/jwt-token.service';
import { InMemoryTokenBlacklistService } from './modules/users/infrastructure/token-blacklist.service';
import { PrismaUserRepository } from './modules/users/infrastructure/prisma-user.repository';
import { PrismaEstadisticasRepository } from './modules/users/infrastructure/prisma-estadisticas.repository';
import { NotificacionService } from './modules/notifications/application/NotificacionService';
import { PrismaPreferenciaRepository } from './modules/notifications/infrastructure/prisma-preferencia.repository';
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
const pollRepository = new PrismaPollRepository();

const estadisticasRepository = new PrismaEstadisticasRepository();

const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();
const identityVerificationService = new Auth0IdentityVerificationService();
const tokenBlacklistService = new InMemoryTokenBlacklistService();
const messageGateway = new SocketMessageGateway();
const pollGateway = new ModerationPollGatewayDecorator(
  new LoggingPollGatewayDecorator(new SocketPollGateway()),
);
const groupEventObserver = new SocketGroupObserver();
const groupPersistenciaObserver = new PersistenciaGroupObserver();

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
  [groupEventObserver, groupPersistenciaObserver]
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
export const pollUseCases = new PollUseCases(pollRepository, grupoRepository, pollGateway);
export const pollAutoCloseScheduler = new PollAutoCloseScheduler(pollRepository, pollGateway);

// ── Exportar ChatSubject para uso en socket.ts ──
export { chatSubject };

// ── Patrón Strategy: Notificaciones ──
export const preferenciaRepository = new PrismaPreferenciaRepository();

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

// ── Módulo Sesiones de Estudio ──
const sesionRepository = new PrismaSesionEstudioRepository();
export const sesionUseCases = new SesionEstudioUseCases(sesionRepository);

export const recordatorioScheduler = new RecordatorioScheduler(sesionRepository, notificacionService);