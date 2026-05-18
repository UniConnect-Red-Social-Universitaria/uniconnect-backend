import { GroupEventObserver } from '../../../domain/contracts';
import {
  emitirSolicitudGrupoNueva,
  emitirSolicitudGrupoResuelta,
  emitirTransferenciaAdmin,
  emitirTransferenciaPendiente,
  emitirTransferenciaAceptada,
  emitirTransferenciaRechazada,
  emitirTransferenciaCancelada,
} from '../../../lib/socket';

export class SocketGroupObserver implements GroupEventObserver {
  onSolicitudNueva(payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    administradorId: string;
    solicitanteId: string;
    solicitanteNombre: string;
    solicitanteApellido?: string;
  }): void {
    emitirSolicitudGrupoNueva(payload);
  }

  onSolicitudResuelta(payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    solicitanteId: string;
    estado: 'APROBADA' | 'RECHAZADA';
  }): void {
    emitirSolicitudGrupoResuelta(payload);
  }

  onAdminTransferido(payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    anteriorAdminNombre: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
  }): void {
    emitirTransferenciaAdmin(payload);
  }

  onTransferenciaPendiente(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
  }): void {
    emitirTransferenciaPendiente(payload);
  }

  onTransferenciaAceptada(payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
    nuevoEstado: string;
  }): void {
    emitirTransferenciaAceptada(payload);
  }

  onTransferenciaRechazada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
  }): void {
    emitirTransferenciaRechazada(payload);
  }

  onTransferenciaCancelada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    nuevoEstado: string;
  }): void {
    emitirTransferenciaCancelada(payload);
  }
}
