import { CategoriaEvento, EventRecord } from '../../domain/contracts';
import { IEventoObserver } from './IEventoObserver';

export class EventoPublicador {
  private static instance: EventoPublicador;
  private suscriptores = new Map<CategoriaEvento, Set<IEventoObserver>>();

  private constructor() {}

  static getInstance(): EventoPublicador {
    if (!EventoPublicador.instance) {
      EventoPublicador.instance = new EventoPublicador();
    }
    return EventoPublicador.instance;
  }

  suscribir(categoria: CategoriaEvento, observer: IEventoObserver): void {
    if (!this.suscriptores.has(categoria)) {
      this.suscriptores.set(categoria, new Set());
    }
    this.suscriptores.get(categoria)!.add(observer);
  }

  desuscribir(categoria: CategoriaEvento, observer: IEventoObserver): void {
    this.suscriptores.get(categoria)?.delete(observer);
  }

  notificar(categoria: CategoriaEvento, evento: EventRecord): void {
    this.suscriptores.get(categoria)?.forEach((obs) => obs.onNuevoEvento(evento));
  }

  contarSuscriptores(categoria: CategoriaEvento): number {
    return this.suscriptores.get(categoria)?.size ?? 0;
  }
}
