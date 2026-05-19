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
import { ChatSubject } from '../domain/chat-subject';
import { crearCadenaValidacion } from './validacion/ValidadorMensajeChainFactory';
import { extractMentions, getMentionedUsernames } from './parsers/mention-parser';
import { isValidReactionEmoji } from './parsers/emoji-validator';

export class MessageUseCases {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository,
    private readonly contactRepository: ContactRepository,
    private readonly groupRepository: GroupRepository,
    private readonly messageGateway: MessageGateway,
    private readonly chatSubject: ChatSubject,
  ) {}

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

    if (typeof contenido !== 'string') {
      throw new ApplicationError(400, 'Debes enviar un contenido de mensaje válido');
    }

    const receptor = await this.userRepository.findById(receptorId.trim());
    if (!receptor) {
      throw new ApplicationError(404, 'El receptor no existe');
    }

    const relacion = await this.contactRepository.findRelationBetweenUsers(
      authUser.id,
      receptorId.trim(),
    );

    const cadena = crearCadenaValidacion({
      esMiembroDeGrupo: () => true,
      tieneRelacionAceptada: () => !!(relacion && relacion.estado === 'ACEPTADA'),
    });

    const resultado = cadena.manejar({
      emisorId: authUser.id,
      contenido,
      receptorId: receptorId.trim(),
    });

    if (!resultado.valido) {
      throw new ApplicationError(400, resultado.error ?? 'Mensaje inválido');
    }

    const mensaje = await this.messageRepository.create({
      contenido: contenido.trim(),
      emisorId: authUser.id,
      receptorId: receptorId.trim(),
    });

    this.messageGateway.emitNewMessage(mensaje);

    // Procesar menciones en el mensaje
    await this.procesarMencionesMensajeIndividual(mensaje.id, mensaje.contenido);

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
      throw new ApplicationError(403, 'Solo puedes consultar chats con compañeros agregados');
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

    if (typeof contenido !== 'string') {
      throw new ApplicationError(400, 'Debes enviar un contenido de mensaje válido');
    }

    const grupo = await this.groupRepository.findById(grupoId.trim());
    if (!grupo) {
      throw new ApplicationError(404, 'El grupo no existe');
    }

    const esMiembro = grupo.miembros.some(
      (miembro) => miembro.usuarioId === authUser.id || miembro.usuario?.id === authUser.id,
    );

    const cadena = crearCadenaValidacion({
      esMiembroDeGrupo: () => esMiembro,
      tieneRelacionAceptada: () => true,
    });

    const resultado = cadena.manejar({
      emisorId: authUser.id,
      contenido,
      grupoId: grupoId.trim(),
    });

    if (!resultado.valido) {
      throw new ApplicationError(400, resultado.error ?? 'Mensaje inválido');
    }

    const mensaje = await this.messageRepository.createGroupMessage({
      contenido: contenido.trim(),
      grupoId: grupoId.trim(),
      emisorId: authUser.id,
    });

    this.messageGateway.emitNewGroupMessage(mensaje);
    this.chatSubject.emitirNuevoMensaje(grupoId.trim(), mensaje);

    // Procesar menciones en el mensaje grupal
    await this.procesarMencionesMensajeGrupo(mensaje.id, mensaje.contenido, grupoId.trim());

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

  /**
   * Procesa menciones en un mensaje de grupo
   * Extrae los nombres de usuario mencionados y crea registros de mención
   */
  private async procesarMencionesMensajeGrupo(
    mensajeId: string,
    contenido: string,
    grupoId: string
  ) {
    try {
      const usuariosMencionados = getMentionedUsernames(contenido);

      for (const username of usuariosMencionados) {
        // Buscar el usuario por nombre
        const usuario = await this.buscarUsuarioPorNombre(username);
        
        if (usuario) {
          // Verificar que el usuario sea miembro del grupo
          const grupo = await this.groupRepository.findById(grupoId);
          const esMiembroDelGrupo = grupo?.miembros.some(
            (miembro) => miembro.usuarioId === usuario.id || miembro.usuario?.id === usuario.id
          );

          if (esMiembroDelGrupo) {
            // Crear registro de mención
            const mencion = await this.messageRepository.addMencion(
              {
                mensajeId,
                usuarioMencionadoId: usuario.id,
              },
              true // esGrupo
            );

            // Emitir evento de mención
            this.messageGateway.emitMencion(mencion);
          }
        }
      }
    } catch (error) {
      console.error('Error al procesar menciones:', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Procesa menciones en un mensaje individual
   */
  private async procesarMencionesMensajeIndividual(
    mensajeId: string,
    contenido: string
  ) {
    try {
      const usuariosMencionados = getMentionedUsernames(contenido);

      for (const username of usuariosMencionados) {
        const usuario = await this.buscarUsuarioPorNombre(username);
        
        if (usuario) {
          const mencion = await this.messageRepository.addMencion(
            {
              mensajeId,
              usuarioMencionadoId: usuario.id,
            },
            false // esGrupo
          );

          this.messageGateway.emitMencion(mencion);
        }
      }
    } catch (error) {
      console.error('Error al procesar menciones:', error);
    }
  }

  /**
   * Busca un usuario por nombre (búsqueda simple por nombre)
   * En una aplicación real, esto sería más sofisticado
   */
  private async buscarUsuarioPorNombre(nombre: string) {
    // Esta es una búsqueda simple
    // En producción, implementar una búsqueda más robusta en la base de datos
    const usuarios = await this.userRepository.listAll();
    return usuarios.find(
      (u) => 
        u.nombre.toLowerCase() === nombre.toLowerCase() ||
        `${u.nombre.toLowerCase()}_${u.apellido.toLowerCase()}` === nombre.toLowerCase()
    );
  }

  /**
   * Agrega una reacción a un mensaje
   * 
   * @param usuario Usuario autenticado
   * @param mensajeId ID del mensaje
   * @param emoji Emoji para la reacción
   * @param esGrupo Si es un mensaje de grupo
   */
  async agregarReaccion(
    usuario: AuthenticatedUser | undefined,
    mensajeId: unknown,
    emoji: unknown,
    esGrupo: unknown
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof mensajeId !== 'string' || !mensajeId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un mensajeId válido');
    }

    if (!isValidMongoId(mensajeId.trim())) {
      throw new ApplicationError(400, 'mensajeId tiene formato inválido');
    }

    if (typeof emoji !== 'string' || !emoji.trim()) {
      throw new ApplicationError(400, 'Debes enviar un emoji válido');
    }

    if (!isValidReactionEmoji(emoji.trim())) {
      throw new ApplicationError(400, 'El emoji no está permitido para reacciones');
    }

    if (typeof esGrupo !== 'boolean') {
      throw new ApplicationError(400, 'Debes especificar si es un mensaje de grupo');
    }

    const reaccion = await this.messageRepository.addReaccion(
      {
        mensajeId: mensajeId.trim(),
        usuarioId: authUser.id,
        emoji: emoji.trim(),
      },
      esGrupo
    );

    this.messageGateway.emitReaccion(reaccion);

    return {
      message: 'Reacción agregada correctamente',
      data: reaccion,
    };
  }

  /**
   * Remueve una reacción de un mensaje
   */
  async removerReaccion(
    usuario: AuthenticatedUser | undefined,
    mensajeId: unknown,
    emoji: unknown,
    esGrupo: unknown
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof mensajeId !== 'string' || !mensajeId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un mensajeId válido');
    }

    if (!isValidMongoId(mensajeId.trim())) {
      throw new ApplicationError(400, 'mensajeId tiene formato inválido');
    }

    if (typeof emoji !== 'string' || !emoji.trim()) {
      throw new ApplicationError(400, 'Debes enviar un emoji válido');
    }

    if (typeof esGrupo !== 'boolean') {
      throw new ApplicationError(400, 'Debes especificar si es un mensaje de grupo');
    }

    const reaccion = await this.messageRepository.removeReaccion(
      mensajeId.trim(),
      authUser.id,
      emoji.trim(),
      esGrupo
    );

    this.messageGateway.emitRemoveReaccion(mensajeId.trim(), authUser.id, emoji.trim(), esGrupo, reaccion);

    return {
      message: 'Reacción removida correctamente',
    };
  }

  /**
   * Obtiene las reacciones de un mensaje
   */
  async obtenerReacciones(
    usuario: AuthenticatedUser | undefined,
    mensajeId: unknown,
    esGrupo: unknown
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof mensajeId !== 'string' || !mensajeId.trim()) {
      throw new ApplicationError(400, 'Debes enviar un mensajeId válido');
    }

    if (!isValidMongoId(mensajeId.trim())) {
      throw new ApplicationError(400, 'mensajeId tiene formato inválido');
    }

    if (typeof esGrupo !== 'boolean') {
      throw new ApplicationError(400, 'Debes especificar si es un mensaje de grupo');
    }

    const reacciones = await this.messageRepository.getReaccionesByMensaje(
      mensajeId.trim(),
      esGrupo
    );

    return { data: reacciones };
  }

  /**
   * Obtiene las menciones pendientes del usuario
   */
  async obtenerMencionesPendientes(usuario: AuthenticatedUser | undefined) {
    const authUser = this.ensureAuthenticated(usuario);

    const menciones = await this.messageRepository.getMencionesPendientes(authUser.id);

    return { data: menciones };
  }
}
