/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { EventoPublicador } from '../src/shared/eventos-observer/EventoPublicador';
import { IEventoObserver } from '../src/shared/eventos-observer/IEventoObserver';
import { SocketEventoObserver } from '../src/shared/eventos-observer/SocketEventoObserver';
import { EventRecord, CategoriaEvento } from '../src/domain/contracts';

const mockEmitirEvento = jest.fn();
jest.mock('../src/lib/socket', () => ({
  emitirEventoNuevoPorCategoria: (...args: unknown[]) => mockEmitirEvento(...args),
}));

function crearEventoMock(categoria: CategoriaEvento, titulo = 'Evento test'): EventRecord {
  return {
    id: 'evento-1',
    titulo,
    descripcion: 'Descripcion de prueba',
    lugar: 'Auditorio',
    fechaEvento: new Date('2027-01-15T10:00:00Z'),
    categoria,
    creadorId: 'usuario-1',
    createdAt: new Date(),
  };
}

let mockIdCounter = 1;

function crearObserverMock(): IEventoObserver & { llamadas: EventRecord[] } {
  const llamadas: EventRecord[] = [];
  const miId = `mock-user-${mockIdCounter++}`;

  return {
    llamadas,
    getUsuarioId: () => miId, 
    onNuevoEvento(evento: EventRecord) {
      llamadas.push(evento);
    },
  };
}

describe('EventoPublicador', () => {
  let publicador: EventoPublicador;

  beforeEach(() => {
    // Reiniciar singleton entre tests accediendo al campo privado
    (EventoPublicador as unknown as { instance: undefined }).instance = undefined;
    publicador = EventoPublicador.getInstance();
  });

  it('getInstance devuelve siempre la misma instancia', () => {
    const a = EventoPublicador.getInstance();
    const b = EventoPublicador.getInstance();
    expect(a).toBe(b);
  });

  it('notifica solo a los observers de la categoria correcta', () => {
    const obsAcademico = crearObserverMock();
    const obsCultural = crearObserverMock();

    publicador.suscribir('academico', obsAcademico);
    publicador.suscribir('cultural', obsCultural);

    publicador.notificar('academico', crearEventoMock('academico'));

    expect(obsAcademico.llamadas).toHaveLength(1);
    expect(obsCultural.llamadas).toHaveLength(0);
  });

  it('notifica a todos los observers de una misma categoria', () => {
    const obs1 = crearObserverMock();
    const obs2 = crearObserverMock();

    publicador.suscribir('deportivo', obs1);
    publicador.suscribir('deportivo', obs2);

    publicador.notificar('deportivo', crearEventoMock('deportivo'));

    expect(obs1.llamadas).toHaveLength(1);
    expect(obs2.llamadas).toHaveLength(1);
  });

  it('desuscribir elimina al observer de las notificaciones', () => {
    const obs = crearObserverMock();

    publicador.suscribir('cultural', obs);
    publicador.desuscribir('cultural', obs);
    publicador.notificar('cultural', crearEventoMock('cultural'));

    expect(obs.llamadas).toHaveLength(0);
  });

  it('realiza el ciclo completo del patrón Observer: suscripción, notificación y desuscripción', () => {
    const obs = crearObserverMock();
    const evento1 = crearEventoMock('academico', 'Charla inicial');
    const evento2 = crearEventoMock('academico', 'Charla posterior');

    expect(publicador.contarSuscriptores('academico')).toBe(0);

    publicador.suscribir('academico', obs);
    expect(publicador.contarSuscriptores('academico')).toBe(1);

    publicador.notificar('academico', evento1);
    expect(obs.llamadas).toHaveLength(1);
    expect(obs.llamadas[0]).toMatchObject({ titulo: 'Charla inicial' });

    publicador.desuscribir('academico', obs);
    expect(publicador.contarSuscriptores('academico')).toBe(0);

    publicador.notificar('academico', evento2);
    expect(obs.llamadas).toHaveLength(1); // no debe recibir el segundo evento después de desuscribir
  });

  it('notificar sin suscriptores no lanza error', () => {
    expect(() => publicador.notificar('otro', crearEventoMock('otro'))).not.toThrow();
  });

  it('contarSuscriptores refleja alta y baja', () => {
    const obs = crearObserverMock();

    expect(publicador.contarSuscriptores('academico')).toBe(0);

    publicador.suscribir('academico', obs);
    expect(publicador.contarSuscriptores('academico')).toBe(1);

    publicador.desuscribir('academico', obs);
    expect(publicador.contarSuscriptores('academico')).toBe(0);
  });

  it('el observer recibe el evento correcto con todos sus campos', () => {
    const obs = crearObserverMock();
    const evento = crearEventoMock('academico', 'Seminario de IA');

    publicador.suscribir('academico', obs);
    publicador.notificar('academico', evento);

    expect(obs.llamadas[0]).toMatchObject({
      titulo: 'Seminario de IA',
      categoria: 'academico',
    });
  });

  it('multiples categorias son independientes', () => {
    const obsA = crearObserverMock();
    const obsB = crearObserverMock();

    publicador.suscribir('academico', obsA);
    publicador.suscribir('deportivo', obsB);

    publicador.notificar('academico', crearEventoMock('academico'));
    publicador.notificar('deportivo', crearEventoMock('deportivo'));
    publicador.notificar('cultural', crearEventoMock('cultural'));

    expect(obsA.llamadas).toHaveLength(1);
    expect(obsB.llamadas).toHaveLength(1);
    expect(obsA.llamadas[0].categoria).toBe('academico');
    expect(obsB.llamadas[0].categoria).toBe('deportivo');
  });

  it('el fallo de un observer no debe interrumpir la notificación a los demás', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const obsFalla = crearObserverMock();
    obsFalla.onNuevoEvento = jest.fn(() => {
      throw new Error('Fallo simulado');
    });

    const obsExitoso = crearObserverMock();

    publicador.suscribir('academico', obsFalla);
    publicador.suscribir('academico', obsExitoso);

    expect(() => {
      publicador.notificar('academico', crearEventoMock('academico'));
    }).not.toThrow();

    expect(obsFalla.onNuevoEvento).toHaveBeenCalled();
    expect(obsExitoso.llamadas).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });

  it('listarCategoriasSuscritas retorna categorias donde el usuario esta', () => {
    const obs = crearObserverMock();
    const usuarioId = obs.getUsuarioId();

    publicador.suscribir('academico', obs);
    publicador.suscribir('deportivo', obs);

    const categorias = publicador.listarCategoriasSuscritas(usuarioId);
    expect(categorias).toContain('academico');
    expect(categorias).toContain('deportivo');
  });

  it('listarCategoriasSuscritas retorna vacio si el usuario no esta suscrito', () => {
    const categorias = publicador.listarCategoriasSuscritas('usuario-inexistente');
    expect(categorias).toHaveLength(0);
  });

  it('listarCategoriasSuscritas solo retorna categorias donde el usuario esta', () => {
    const obs = crearObserverMock();
    const id = obs.getUsuarioId();
    const obsOtro = crearObserverMock();

    publicador.suscribir('academico', obs);
    publicador.suscribir('deportivo', obsOtro);

    const categorias = publicador.listarCategoriasSuscritas(id);
    expect(categorias).toEqual(['academico']);
    expect(categorias).not.toContain('deportivo');
  });

  it('notificar con usuarioExcluido omite a ese observer', () => {
    const obs = crearObserverMock();
    const usuarioId = obs.getUsuarioId();

    publicador.suscribir('academico', obs);
    publicador.notificar('academico', crearEventoMock('academico'), usuarioId);

    expect(obs.llamadas).toHaveLength(0);
  });

  it('notificar con usuarioExcluido notifica a los demas observers', () => {
    const obs1 = crearObserverMock();
    const obs2 = crearObserverMock();

    publicador.suscribir('academico', obs1);
    publicador.suscribir('academico', obs2);

    publicador.notificar('academico', crearEventoMock('academico'), obs1.getUsuarioId());

    expect(obs1.llamadas).toHaveLength(0);
    expect(obs2.llamadas).toHaveLength(1);
  });

  it('desuscribir de categoria inexistente no lanza error', () => {
    const obs = crearObserverMock();
    expect(() => publicador.desuscribir('inexistente' as CategoriaEvento, obs)).not.toThrow();
  });
});

describe('SocketEventoObserver', () => {
  beforeEach(() => {
    mockEmitirEvento.mockClear();
  });

  it('getUsuarioId retorna el id correcto', () => {
    const obs = new SocketEventoObserver('usuario-abc');
    expect(obs.getUsuarioId()).toBe('usuario-abc');
  });

  it('onNuevoEvento llama a emitirEventoNuevoPorCategoria con usuarioId y evento', () => {
    const obs = new SocketEventoObserver('usuario-xyz');
    const evento = crearEventoMock('academico', 'Evento de prueba');

    obs.onNuevoEvento(evento);

    expect(mockEmitirEvento).toHaveBeenCalledWith('usuario-xyz', evento);
  });
});
