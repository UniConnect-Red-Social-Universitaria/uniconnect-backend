import { CategoriaEvento } from '../../../domain/contracts';

export type CanalNotificacion = 'in-app' | 'email' | 'push' | 'resumen-diario';

export const CANALES_DEFAULT: CanalNotificacion[] = ['in-app', 'email', 'push'];

export interface PreferenciaCanal {
  usuarioId: string;
  tipoEvento: CategoriaEvento;
  canalesActivos: CanalNotificacion[];
}

export interface PreferenciaCanalRepository {
  obtenerPreferencias(usuarioId: string, tipoEvento: CategoriaEvento): Promise<PreferenciaCanal>;
  actualizarPreferencias(
    usuarioId: string,
    tipoEvento: CategoriaEvento,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal>;
}
