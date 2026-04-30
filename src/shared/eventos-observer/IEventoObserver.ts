import { EventRecord } from '../../domain/contracts';

export interface IEventoObserver {
  onNuevoEvento(evento: EventRecord): void;
  getUsuarioId(): string;
}
