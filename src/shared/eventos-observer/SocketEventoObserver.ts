import { EventRecord } from '../../domain/contracts';
import { emitirEventoNuevoPorCategoria } from '../../lib/socket';
import { IEventoObserver } from './IEventoObserver';

export class SocketEventoObserver implements IEventoObserver {
  constructor(private readonly usuarioId: string) {}

  onNuevoEvento(evento: EventRecord): void {
    emitirEventoNuevoPorCategoria(this.usuarioId, evento);
  }

  getUsuarioId(): string {
    return this.usuarioId;
  }
}
