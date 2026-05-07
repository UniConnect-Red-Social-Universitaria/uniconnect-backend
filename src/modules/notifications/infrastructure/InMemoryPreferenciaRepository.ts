import { CategoriaEvento } from '../../../domain/contracts';
import {
  CanalNotificacion,
  CANALES_DEFAULT,
  PreferenciaCanal,
  PreferenciaCanalRepository,
} from '../domain/contracts';

export class InMemoryPreferenciaRepository implements PreferenciaCanalRepository {
  private store = new Map<string, CanalNotificacion[]>();

  private key(usuarioId: string, tipoEvento: CategoriaEvento): string {
    return `${usuarioId}::${tipoEvento}`;
  }

  async obtenerPreferencias(
    usuarioId: string,
    tipoEvento: CategoriaEvento,
  ): Promise<PreferenciaCanal> {
    const canalesActivos = this.store.get(this.key(usuarioId, tipoEvento)) ?? [...CANALES_DEFAULT];
    return { usuarioId, tipoEvento, canalesActivos };
  }

  async actualizarPreferencias(
    usuarioId: string,
    tipoEvento: CategoriaEvento,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal> {
    this.store.set(this.key(usuarioId, tipoEvento), canales);
    return { usuarioId, tipoEvento, canalesActivos: canales };
  }
}
