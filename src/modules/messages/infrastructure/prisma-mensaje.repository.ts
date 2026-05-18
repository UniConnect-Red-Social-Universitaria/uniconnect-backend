import {
  MessageRepository,
  MencionMensajeRecord,
  MencionMensajeGrupoRecord,
  ReaccionMensajeRecord,
  ReaccionMensajeGrupoRecord,
  ReaccionAgrupadaView,
  CreateMencionData,
  CreateReaccionData,
} from '../../../domain/contracts';
import { MensajeModel } from '../../../models/mensaje.model';

export class PrismaMensajeRepository implements MessageRepository {
  async create(data: { contenido: string; emisorId: string; receptorId: string }) {
    return MensajeModel.crear(data);
  }

  async getConversation(usuarioAId: string, usuarioBId: string, limit: number) {
    return MensajeModel.obtenerConversacion(usuarioAId, usuarioBId, limit);
  }

  async createGroupMessage(data: {
    contenido: string;
    grupoId: string;
    emisorId: string;
  }) {
    return MensajeModel.crearMensajeGrupo(data);
  }

  async getGroupHistory(grupoId: string, limit: number) {
    return MensajeModel.obtenerHistorialGrupo(grupoId, limit);
  }

  // Métodos para menciones
  async addMencion(data: CreateMencionData, esGrupo: boolean): Promise<MencionMensajeRecord | MencionMensajeGrupoRecord> {
    return MensajeModel.agregarMencion(data, esGrupo);
  }

  async getMencionesByMensaje(mensajeId: string, esGrupo: boolean): Promise<(MencionMensajeRecord | MencionMensajeGrupoRecord)[]> {
    return MensajeModel.obtenerMencionesMensaje(mensajeId, esGrupo);
  }

  async getMencionesPendientes(usuarioId: string): Promise<(MencionMensajeRecord | MencionMensajeGrupoRecord)[]> {
    return MensajeModel.obtenerMencionesPendientes(usuarioId);
  }

  // Métodos para reacciones
  async addReaccion(data: CreateReaccionData, esGrupo: boolean): Promise<ReaccionMensajeRecord | ReaccionMensajeGrupoRecord> {
    return MensajeModel.agregarReaccion(data, esGrupo);
  }

  async removeReaccion(mensajeId: string, usuarioId: string, emoji: string, esGrupo: boolean): Promise<any> {
    return MensajeModel.removerReaccion(mensajeId, usuarioId, emoji, esGrupo);
  }

  async getReaccionesByMensaje(mensajeId: string, esGrupo: boolean): Promise<ReaccionAgrupadaView[]> {
    return MensajeModel.obtenerReaccionesMensaje(mensajeId, esGrupo);
  }
}