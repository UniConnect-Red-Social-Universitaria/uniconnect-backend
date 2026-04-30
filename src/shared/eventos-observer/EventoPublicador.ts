import { CategoriaEvento, EventRecord } from '../../domain/contracts';
import { IEventoObserver } from './IEventoObserver';

export class EventoPublicador {
  private static instance: EventoPublicador;
  private suscriptores = new Map<CategoriaEvento, Map<string, IEventoObserver>>();

  private constructor() {}

  static getInstance(): EventoPublicador {
    if (!EventoPublicador.instance) {
      EventoPublicador.instance = new EventoPublicador();
    }
    return EventoPublicador.instance;
  }

  suscribir(categoria: CategoriaEvento, observer: IEventoObserver): void {
    if (!this.suscriptores.has(categoria)) {
      this.suscriptores.set(categoria, new Map());
    }
    this.suscriptores.get(categoria)!.set(observer.getUsuarioId(), observer);
  }

  desuscribir(categoria: CategoriaEvento, observer: IEventoObserver): void {
    this.suscriptores.get(categoria)?.delete(observer.getUsuarioId());
  }

  notificar(categoria: CategoriaEvento, evento: EventRecord): void {
    this.suscriptores.get(categoria)?.forEach((obs) => {
      try {
        obs.onNuevoEvento(evento);
      } catch (error) {
        console.error('Error al notificar al observer:', error);
      }
    });
  }

  listarCategoriasSuscritas(usuarioId: string): CategoriaEvento[] {
    const categorias: CategoriaEvento[] = [];
    for (const [categoria, mapa] of this.suscriptores) {
      if (mapa.has(usuarioId)) {
        categorias.push(categoria);
      }
    }
    return categorias;
  }

  contarSuscriptores(categoria: CategoriaEvento): number {
    return this.suscriptores.get(categoria)?.size ?? 0;
  }
}
