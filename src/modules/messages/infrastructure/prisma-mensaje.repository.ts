import { MessageRepository } from '../../../domain/contracts';
import { MensajeModel } from '../../../models/mensaje.model';

export class PrismaMensajeRepository implements MessageRepository {
  async create(data: { contenido: string; emisorId: string; receptorId: string }) {
    return MensajeModel.crear(data);
  }

  async getConversation(usuarioAId: string, usuarioBId: string, limit: number) {
    return MensajeModel.obtenerConversacion(usuarioAId, usuarioBId, limit);
  }
}