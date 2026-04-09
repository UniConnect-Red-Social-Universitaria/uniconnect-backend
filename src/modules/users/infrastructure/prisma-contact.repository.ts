import {
  ContactRepository,
  ContactRequestRecord,
  ContactRelation,
  ContactPeerView,
  ReceivedContactRequestView,
} from '../../../domain/contracts';
import { ContactoModel } from '../../../models/contacto.model';

export class PrismaContactRepository implements ContactRepository {
  async findRelationBetweenUsers(
    usuarioAId: string,
    usuarioBId: string,
  ): Promise<ContactRelation | null> {
    return ContactoModel.existeRelacionEntreUsuarios(usuarioAId, usuarioBId);
  }

  async createRequest(
    solicitanteId: string,
    receptorId: string,
  ): Promise<ContactRequestRecord> {
    return ContactoModel.crearSolicitud(solicitanteId, receptorId);
  }

  async reactivateRejectedRequest(
    solicitanteId: string,
    receptorId: string,
  ): Promise<ContactRequestRecord> {
    return ContactoModel.reactivarSolicitudRechazada(solicitanteId, receptorId);
  }

  async getRelatedIds(usuarioId: string) {
    return ContactoModel.obtenerIdsRelacionados(usuarioId);
  }

  async listAcceptedPeers(usuarioId: string): Promise<ContactPeerView[]> {
    return ContactoModel.listarCompanerosAceptados(usuarioId);
  }

  async listReceivedPendingRequests(
    usuarioId: string,
  ): Promise<ReceivedContactRequestView[]> {
    return ContactoModel.listarSolicitudesRecibidas(usuarioId);
  }

  async acceptRequest(
    solicitudId: string,
    usuarioReceptorId: string,
  ): Promise<ContactRequestRecord> {
    return ContactoModel.aceptarSolicitud(solicitudId, usuarioReceptorId);
  }
}