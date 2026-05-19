/**
 * Canales de entrega disponibles.
 * - in-app   → WebSocket en tiempo real
 * - email    → Correo institucional
 * - push     → Notificación push al dispositivo móvil
 */
export type CanalNotificacion = 'in-app' | 'email' | 'push';

export const CANALES_DISPONIBLES: CanalNotificacion[] = ['in-app', 'email', 'push'];

/** Valor por defecto cuando el usuario no ha configurado preferencias */
export const CANALES_DEFAULT: CanalNotificacion[] = ['in-app', 'email', 'push'];
export const CANALES_DISPONIBLES: CanalNotificacion[] = ['in-app', 'email', 'push'];

export type TipoNotificacion =
  | 'mensaje'
  | 'mensaje-grupo'
  | 'mencion'
  | 'encuesta'
  | 'recordatorio'
  | 'evento-academico'
  | 'evento-cultural'
  | 'evento-deportivo'
  | 'evento-otro';

export const TIPOS_NOTIFICACION: TipoNotificacion[] = [
  'mensaje', 'mensaje-grupo', 'mencion', 'encuesta', 'recordatorio',
  'evento-academico', 'evento-cultural', 'evento-deportivo', 'evento-otro',
];

/**
 * Tipos de evento que generan notificaciones en el sistema.
 * Se usa como clave de preferencias en lugar de CategoriaEvento para
 * tener granularidad completa sobre todos los módulos.
 */
export type TipoNotificacion =
  | 'mensaje'           // Mensaje directo recibido
  | 'mensaje-grupo'     // Mensaje en grupo
  | 'mencion'           // Mención (@usuario) en cualquier chat
  | 'encuesta'          // Nueva encuesta en un grupo
  | 'recordatorio'      // Recordatorio de sesión de estudio
  | 'evento-academico'  // Evento de categoría académica (Observer)
  | 'evento-cultural'   // Evento de categoría cultural
  | 'evento-deportivo'  // Evento de categoría deportiva
  | 'evento-otro';      // Evento de categoría "otro"

export const TIPOS_NOTIFICACION: TipoNotificacion[] = [
  'mensaje',
  'mensaje-grupo',
  'mencion',
  'encuesta',
  'recordatorio',
  'evento-academico',
  'evento-cultural',
  'evento-deportivo',
  'evento-otro',
];

export interface PreferenciaCanal {
  usuarioId: string;
  tipoEvento: TipoNotificacion;
  canalesActivos: CanalNotificacion[];
}

export interface PreferenciaCanalRepository {
  obtenerPreferencias(usuarioId: string, tipoEvento: TipoNotificacion): Promise<PreferenciaCanal>;
  actualizarPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal>;
}
