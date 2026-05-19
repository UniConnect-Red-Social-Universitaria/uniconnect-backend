import {
  CanalNotificacion,
  CANALES_DEFAULT,
  PreferenciaCanal,
  PreferenciaCanalRepository,
  TipoNotificacion,
} from '../domain/contracts';

export class InMemoryPreferenciaRepository implements PreferenciaCanalRepository {
  private store = new Map<string, CanalNotificacion[]>();

  private key(usuarioId: string, tipoEvento: TipoNotificacion): string {
    return `${usuarioId}::${tipoEvento}`;
  }

  async obtenerPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion,
  ): Promise<PreferenciaCanal> {
    const canalesActivos = this.store.get(this.key(usuarioId, tipoEvento)) ?? [...CANALES_DEFAULT];
    return { usuarioId, tipoEvento, canalesActivos };
  }

  async actualizarPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal> {
    this.store.set(this.key(usuarioId, tipoEvento), canales);
    return { usuarioId, tipoEvento, canalesActivos: canales };
  }
}
