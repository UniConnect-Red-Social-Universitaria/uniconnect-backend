import { SolicitudGrupoRepository, SolicitudGrupoRecord, SolicitudGrupoTipo } from '../../../domain/contracts';
import { SolicitudGrupoModel } from '../../../models/solicitud-grupo.model';

export class PrismaSolicitudGrupoRepository implements SolicitudGrupoRepository {
  async crear(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO'): Promise<SolicitudGrupoRecord> {
    return SolicitudGrupoModel.crear(solicitanteId, grupoId, tipo) as Promise<SolicitudGrupoRecord>;
  }

  async buscarPendiente(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO'): Promise<SolicitudGrupoRecord | null> {
    return SolicitudGrupoModel.buscarPendiente(solicitanteId, grupoId, tipo) as Promise<SolicitudGrupoRecord | null>;
  }

  async listarPorGrupo(grupoId: string): Promise<SolicitudGrupoRecord[]> {
    return SolicitudGrupoModel.listarPorGrupo(grupoId) as Promise<SolicitudGrupoRecord[]>;
  }

  async listarPorUsuario(solicitanteId: string): Promise<SolicitudGrupoRecord[]> {
    return SolicitudGrupoModel.listarPorUsuario(solicitanteId) as Promise<SolicitudGrupoRecord[]>;
  }

  async aprobar(solicitudId: string): Promise<SolicitudGrupoRecord> {
    return SolicitudGrupoModel.aprobar(solicitudId) as Promise<SolicitudGrupoRecord>;
  }

  async rechazar(solicitudId: string): Promise<SolicitudGrupoRecord> {
    return SolicitudGrupoModel.rechazar(solicitudId) as Promise<SolicitudGrupoRecord>;
  }

  async buscarPorId(solicitudId: string): Promise<SolicitudGrupoRecord | null> {
    return SolicitudGrupoModel.buscarPorId(solicitudId) as Promise<SolicitudGrupoRecord | null>;
  }

  async eliminarRechazada(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO'): Promise<void> {
    await SolicitudGrupoModel.eliminarRechazada(solicitanteId, grupoId, tipo);
  }
}
