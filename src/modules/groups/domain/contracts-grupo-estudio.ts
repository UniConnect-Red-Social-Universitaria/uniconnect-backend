import { GrupoEstudioEvent } from './grupo-estudio-subject';

/**
 * Interfaz para los observadores del GrupoEstudioSubject
 */
export interface IGrupoEstudioObserver {
  /**
   * Se invoca cuando ocurre un evento en el grupo de estudio
   * @param evento Evento del grupo (creado, modificado, miembro agregado, etc.)
   */
  onEventoGrupo(evento: GrupoEstudioEvent): void;
}

/**
 * Tipos de eventos que pueden ocurrir en un grupo de estudio
 */
export type GrupoEstudioEventType =
  | 'creado'
  | 'modificado'
  | 'finalizado'
  | 'miembro-agregado'
  | 'miembro-removido';
