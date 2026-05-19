import {
  CanalNotificacion,
  CANALES_DEFAULT,
  PreferenciaCanal,
  PreferenciaCanalRepository,
  TipoNotificacion,
} from '../domain/contracts';

export class InMemoryPreferenciaRepository implements PreferenciaCanalRepository {
  private store = new Map<string, CanalNotificacion[]>();

  private key(usuarioId: string, tipoEvento: TipoNotificacion): string { // ← ya no CategoriaEvento
    return `${usuarioId}::${tipoEvento}`;
  }

  async obtenerPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion, // ← cambiado
  ): Promise<PreferenciaCanal> {
    const canalesActivos = this.store.get(this.key(usuarioId, tipoEvento)) ?? [...CANALES_DEFAULT];
    return { usuarioId, tipoEvento, canalesActivos };
  }

  async actualizarPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion, // ← cambiado
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal> {
    this.store.set(this.key(usuarioId, tipoEvento), canales);
    return { usuarioId, tipoEvento, canalesActivos: canales };
  }
}