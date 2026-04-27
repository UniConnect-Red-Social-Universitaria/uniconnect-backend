import { GroupEventObserver } from '../../../domain/contracts';
import {
  emitirSolicitudGrupoNueva,
  emitirSolicitudGrupoResuelta,
  emitirTransferenciaAdmin,
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
}
