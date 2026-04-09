import { CatalogUseCases } from './modules/catalog/application/catalog.use-cases';
import { PrismaCarreraRepository } from './modules/catalog/infrastructure/prisma-carrera.repository';
import { EventUseCases } from './modules/events/application/event.use-cases';
import { PrismaEventoRepository } from './modules/events/infrastructure/prisma-evento.repository';
import { GroupUseCases } from './modules/groups/application/group.use-cases';
import { PrismaGrupoRepository, PrismaGrupoArchivoRepository } from './modules/groups/infrastructure/prisma-grupo.repository';
import { MateriaUseCases } from './modules/materias/application/materia.use-cases';
import { PrismaMateriaRepository } from './modules/materias/infrastructure/prisma-materia.repository';
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

const userRepository = new PrismaUserRepository();
const contactRepository = new PrismaContactRepository();
const careerRepository = new PrismaCarreraRepository();
const materiaRepository = new PrismaMateriaRepository();
const grupoRepository = new PrismaGrupoRepository();
const grupoArchivoRepository = new PrismaGrupoArchivoRepository();
const mensajeRepository = new PrismaMensajeRepository();
const eventoRepository = new PrismaEventoRepository();

const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();
const identityVerificationService = new Auth0IdentityVerificationService();
const tokenBlacklistService = new InMemoryTokenBlacklistService();
const messageGateway = new SocketMessageGateway();

export const usersUseCases = new UsersUseCases({
  userRepository,
  contactRepository,
  careerRepository,
  materiaRepository,
  passwordService,
  tokenService,
  identityVerificationService,
  tokenBlacklistService,
});

export const groupUseCases = new GroupUseCases(
  grupoRepository,
  materiaRepository,
  grupoArchivoRepository,
  userRepository,
);
export const materiaUseCases = new MateriaUseCases(materiaRepository);
export const messageUseCases = new MessageUseCases(
  mensajeRepository,
  userRepository,
  contactRepository,
  grupoRepository,
  messageGateway,
);
export const eventUseCases = new EventUseCases(eventoRepository);
export const catalogUseCases = new CatalogUseCases(careerRepository, materiaRepository);