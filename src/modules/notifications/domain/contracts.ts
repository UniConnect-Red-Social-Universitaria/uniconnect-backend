export type CanalNotificacion = 'in-app' | 'email' | 'push' | 'resumen-diario';

export const CANALES_DEFAULT: CanalNotificacion[] = ['in-app', 'email', 'push'];
export const CANALES_DISPONIBLES: CanalNotificacion[] = ['in-app', 'email', 'push'];

export type TipoNotificacion =
  | 'mensaje'
  | 'mensaje-grupo'
  | 'solicitud-contacto'
  | 'solicitud-grupo'
  | 'invitacion-grupo'
  | 'transferencia-admin'
  | 'mencion'
  | 'encuesta'
  | 'recordatorio'
  | 'evento-academico'
  | 'evento-cultural'
  | 'evento-deportivo'
  | 'evento-otro';

export const TIPOS_NOTIFICACION: TipoNotificacion[] = [
  'mensaje', 'mensaje-grupo', 'solicitud-contacto', 'solicitud-grupo', 'invitacion-grupo', 'transferencia-admin',
  'mencion', 'encuesta', 'recordatorio',
  'evento-academico', 'evento-cultural', 'evento-deportivo', 'evento-otro',
];

export interface PreferenciaCanal {
  usuarioId: string;
  tipoEvento: string;
  canalesActivos: CanalNotificacion[];
}

export interface PreferenciaCanalRepository {
  obtenerPreferencias(usuarioId: string, tipoEvento: string): Promise<PreferenciaCanal>;
  actualizarPreferencias(
    usuarioId: string,
    tipoEvento: string,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal>;
}
