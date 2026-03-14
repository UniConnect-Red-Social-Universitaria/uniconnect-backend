import {
  AuthenticatedUser,
  ContactRepository,
  GroupRepository,
  MessageGateway,
  MessageRepository,
  UserRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import { isValidMongoId } from '../../../shared/mongo-id';

export class MessageUseCases {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository,
    private readonly contactRepository: ContactRepository,
    private readonly groupRepository: GroupRepository,
    private readonly messageGateway: MessageGateway,
  ) { }

  async enviarMensaje(
    usuario: AuthenticatedUser | undefined,
    receptorId: unknown,
    contenido: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof receptorId !== 'string' || !receptorId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un receptorId válido');
    }

    if (!isValidMongoId(receptorId.trim())) {
      throw new ApplicationError(400, 'receptorId tiene formato inválido');
    }

    if (typeof contenido !== 'string' || !contenido.trim()) {
      throw new ApplicationError(400, 'Debes enviar un contenido de mensaje válido');
    }

    if (receptorId.trim() === authUser.id) {
      throw new ApplicationError(400, 'No puedes enviarte mensajes a ti mismo');
    }

    const receptor = await this.userRepository.findById(receptorId.trim());

    if (!receptor) {
      throw new ApplicationError(404, 'El receptor no existe');
    }

    const relacion = await this.contactRepository.findRelationBetweenUsers(
      authUser.id,
      receptorId.trim(),
    );

    if (!relacion || relacion.estado !== 'ACEPTADA') {
      throw new ApplicationError(403, 'Solo puedes chatear con compañeros agregados');
    }

    const mensaje = await this.messageRepository.create({
      contenido: contenido.trim(),
      emisorId: authUser.id,
      receptorId: receptorId.trim(),
    });

    this.messageGateway.emitNewMessage(mensaje);

    return {
      message: 'Mensaje enviado correctamente',
      data: mensaje,
    };
  }

  async obtenerHistorial(
    usuario: AuthenticatedUser | undefined,
    companeroId: unknown,
    limit: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof companeroId !== 'string' || !companeroId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un companeroId válido');
    }

    if (!isValidMongoId(companeroId.trim())) {
      throw new ApplicationError(400, 'companeroId tiene formato inválido');
    }

    if (companeroId.trim() === authUser.id) {
      throw new ApplicationError(400, 'No puedes consultar conversación contigo mismo');
    }

    const companero = await this.userRepository.findById(companeroId.trim());

    if (!companero) {
      throw new ApplicationError(404, 'El compañero no existe');
    }

    const relacion = await this.contactRepository.findRelationBetweenUsers(
      authUser.id,
      companeroId.trim(),
    );

    if (!relacion || relacion.estado !== 'ACEPTADA') {
      throw new ApplicationError(
        403,
        'Solo puedes consultar chats con compañeros agregados',
      );
    }

    const limitQuery = Number(limit ?? 50);
    const limitNormalizado =
      Number.isInteger(limitQuery) && limitQuery > 0 && limitQuery <= 200
        ? limitQuery
        : 50;

    const mensajes = await this.messageRepository.getConversation(
      authUser.id,
      companeroId.trim(),
      limitNormalizado,
    );

    return { data: mensajes };
  }

  async enviarMensajeGrupo(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    contenido: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof grupoId !== 'string' || !grupoId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un grupoId válido');
    }

    if (!isValidMongoId(grupoId.trim())) {
      throw new ApplicationError(400, 'grupoId tiene formato inválido');
    }

    if (typeof contenido !== 'string' || !contenido.trim()) {
      throw new ApplicationError(400, 'Debes enviar un contenido de mensaje válido');
    }

    const grupo = await this.groupRepository.findById(grupoId.trim());

    if (!grupo) {
      throw new ApplicationError(404, 'El grupo no existe');
    }

    const esMiembro = grupo.miembros.some(
      (miembro) => miembro.usuarioId === authUser.id || miembro.usuario?.id === authUser.id,
    );

    if (!esMiembro) {
      throw new ApplicationError(403, 'Solo los miembros pueden enviar mensajes al grupo');
    }

    const mensaje = await this.messageRepository.createGroupMessage({
      contenido: contenido.trim(),
      grupoId: grupoId.trim(),
      emisorId: authUser.id,
    });

    this.messageGateway.emitNewGroupMessage(mensaje);

    return {
      message: 'Mensaje de grupo enviado correctamente',
      data: mensaje,
    };
  }

  async obtenerHistorialGrupo(
    usuario: AuthenticatedUser | undefined,
    grupoId: unknown,
    limit: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof grupoId !== 'string' || !grupoId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un grupoId válido');
    }

    if (!isValidMongoId(grupoId.trim())) {
      throw new ApplicationError(400, 'grupoId tiene formato inválido');
    }

    const grupo = await this.groupRepository.findById(grupoId.trim());

    if (!grupo) {
      throw new ApplicationError(404, 'El grupo no existe');
    }

    const esMiembro = grupo.miembros.some(
      (miembro) => miembro.usuarioId === authUser.id || miembro.usuario?.id === authUser.id,
    );

    if (!esMiembro) {
      throw new ApplicationError(403, 'Solo los miembros pueden consultar este chat de grupo');
    }

    const limitQuery = Number(limit ?? 50);
    const limitNormalizado =
      Number.isInteger(limitQuery) && limitQuery > 0 && limitQuery <= 200
        ? limitQuery
        : 50;

    const mensajes = await this.messageRepository.getGroupHistory(
      grupoId.trim(),
      limitNormalizado,
    );

    return { data: mensajes };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }

    return usuario;
  }
}