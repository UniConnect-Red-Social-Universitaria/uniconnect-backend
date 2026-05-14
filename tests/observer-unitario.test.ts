/// <reference types="jest" />

import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { EventoPublicador } from '../src/shared/eventos-observer/EventoPublicador';
import { IEventoObserver } from '../src/shared/eventos-observer/IEventoObserver';
import { EventRecord, CategoriaEvento } from '../src/domain/contracts';

/**
 * ============================================================================
 * SUITE DE PRUEBAS UNITARIAS - PATRÓN OBSERVER (EventoPublicador)
 * ============================================================================
 * 
 * Este archivo contiene pruebas exhaustivas del patrón Observer implementado
 * en EventoPublicador, cubriendo:
 * 
 * ✅ Criterio 1: Notificación a múltiples observers
 * ✅ Criterio 2: Desuscripción y aislamiento
 * ✅ Criterio 3: Aislamiento de errores entre observers
 * ✅ Criterio 4: Uso de mocks (sin WebSocket/BD real)
 * ✅ Criterio 5: Responsabilidad única y composición
 * 
 * Patrón usado: Mocks con Jest para observadores
 * Framework: Jest
 * ============================================================================
 */

// ──────────────────────────────────────────────────────────────────────────
// FACTORIES Y HELPERS PARA LAS PRUEBAS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Crea un evento mock para pruebas
 * @param categoria Categoría del evento
 * @param titulo Título del evento
 * @returns EventRecord mock
 */
function crearEventoMock(
  categoria: CategoriaEvento = 'academico',
  titulo: string = 'Evento de prueba'
): EventRecord {
  return {
    id: `evento-${Date.now()}`,
    titulo,
    descripcion: 'Descripción de prueba',
    lugar: 'Auditorio Principal',
    fechaEvento: new Date('2027-01-15T10:00:00Z'),
    categoria,
    creadorId: 'usuario-profesor-001',
    createdAt: new Date(),
  };
}

/**
 * Crea un observer mock con Jest
 * @param usuarioId ID del usuario (opcional)
 * @returns Observer mock con métodos para verificar llamadas
 */
function crearObserverMock(usuarioId: string = `observer-${Math.random()}`) {
  const mockFn = jest.fn();
  
  return {
    usuarioId,
    eventoRecibido: mockFn,
    
    // Implementa IEventoObserver
    onNuevoEvento(evento: EventRecord) {
      mockFn(evento);
    },
    
    getUsuarioId(): string {
      return usuarioId;
    },
    
    // Helpers para testing
    getCallCount(): number {
      return mockFn.mock.calls.length;
    },
    
    getLastEvent(): EventRecord | undefined {
      if (mockFn.mock.calls.length === 0) return undefined;
      return mockFn.mock.calls[mockFn.mock.calls.length - 1][0];
    },
    
    getAllEvents(): EventRecord[] {
      return mockFn.mock.calls.map(call => call[0]);
    },
    
    limpiar(): void {
      mockFn.mockClear();
    },
  } as IEventoObserver & {
    eventoRecibido: jest.Mock;
    getCallCount(): number;
    getLastEvent(): EventRecord | undefined;
    getAllEvents(): EventRecord[];
    limpiar(): void;
  };
}

/**
 * Crea un observer que lanza un error
 * Usado para pruebas de aislamiento de errores
 */
function crearObserverConError(usuarioId: string = `observer-error-${Math.random()}`) {
  return {
    usuarioId,
    
    onNuevoEvento(): void {
      throw new Error('Error simulado en observer');
    },
    
    getUsuarioId(): string {
      return usuarioId;
    },
  } as IEventoObserver;
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE PRINCIPAL - EventoPublicador (Singleton Pattern)
// ──────────────────────────────────────────────────────────────────────────

describe('🔍 EventoPublicador - Patrón Observer Completo', () => {
  let publicador: EventoPublicador;

  beforeEach(() => {
    // Reiniciar singleton entre tests
    (EventoPublicador as unknown as { instance: undefined }).instance = undefined;
    publicador = EventoPublicador.getInstance();
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 1: NOTIFICACIÓN A MÚLTIPLES OBSERVERS
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 1: Notificación a múltiples observers', () => {
    it('debería notificar a 2 observers suscritos cuando se llama notify()', () => {
      // ARRANGE
      const obs1 = crearObserverMock('user-001');
      const obs2 = crearObserverMock('user-002');
      const evento = crearEventoMock('academico', 'Seminario de IA');

      publicador.suscribir('academico', obs1);
      publicador.suscribir('academico', obs2);

      // ACT
      publicador.notificar('academico', evento);

      // ASSERT - Ambos observers reciben el evento
      expect((obs1 as any).getCallCount()).toBe(1);
      expect((obs2 as any).getCallCount()).toBe(1);
      expect((obs1 as any).getLastEvent()).toEqual(evento);
      expect((obs2 as any).getLastEvent()).toEqual(evento);
    });

    it('debería notificar a N observers (testing con 5 observers)', () => {
      // ARRANGE
      const observers = Array.from({ length: 5 }, (_, i) =>
        crearObserverMock(`user-00${i}`)
      );
      const evento = crearEventoMock('deportivo', 'Campeonato de futsal');

      observers.forEach(obs => publicador.suscribir('deportivo', obs));

      // ACT
      publicador.notificar('deportivo', evento);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
      });
    });

    it('debería notificar a observers múltiples veces (3 eventos consecutivos)', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const evento1 = crearEventoMock('cultural', 'Festival de cine');
      const evento2 = crearEventoMock('cultural', 'Muestra artística');
      const evento3 = crearEventoMock('cultural', 'Concierto');

      publicador.suscribir('cultural', obs);

      // ACT
      publicador.notificar('cultural', evento1);
      publicador.notificar('cultural', evento2);
      publicador.notificar('cultural', evento3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(3);
      expect((obs as any).getAllEvents()).toHaveLength(3);
      expect((obs as any).getAllEvents()[0].titulo).toBe('Festival de cine');
      expect((obs as any).getAllEvents()[1].titulo).toBe('Muestra artística');
      expect((obs as any).getAllEvents()[2].titulo).toBe('Concierto');
    });

    it('debería mantener observadores de diferentes categorías de forma independiente', () => {
      // ARRANGE
      const obsAcademico = crearObserverMock('user-acad');
      const obsCultural = crearObserverMock('user-cult');
      const obsDeportivo = crearObserverMock('user-depo');

      publicador.suscribir('academico', obsAcademico);
      publicador.suscribir('cultural', obsCultural);
      publicador.suscribir('deportivo', obsDeportivo);

      // ACT
      publicador.notificar('academico', crearEventoMock('academico'));
      publicador.notificar('cultural', crearEventoMock('cultural'));
      publicador.notificar('deportivo', crearEventoMock('deportivo'));

      // ASSERT
      expect((obsAcademico as any).getCallCount()).toBe(1);
      expect((obsCultural as any).getCallCount()).toBe(1);
      expect((obsDeportivo as any).getCallCount()).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 2: DESUSCRIPCIÓN Y AISLAMIENTO
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 2: Desuscripción y aislamiento', () => {
    it('debería evitar que observer desuscrito reciba notificaciones', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const evento1 = crearEventoMock('academico');
      const evento2 = crearEventoMock('academico');

      publicador.suscribir('academico', obs);
      publicador.notificar('academico', evento1);

      // ACT
      publicador.desuscribir('academico', obs);
      publicador.notificar('academico', evento2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(1); // Solo recibe el primer evento
      expect((obs as any).getAllEvents()[0]).toEqual(evento1);
    });

    it('debería permitir resuscripción después de desuscripción', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const evento1 = crearEventoMock('academico');
      const evento2 = crearEventoMock('academico');
      const evento3 = crearEventoMock('academico');

      // ACT - Suscripción 1
      publicador.suscribir('academico', obs);
      publicador.notificar('academico', evento1);
      
      // Desuscripción
      publicador.desuscribir('academico', obs);
      publicador.notificar('academico', evento2);
      
      // Resuscripción
      publicador.suscribir('academico', obs);
      publicador.notificar('academico', evento3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(2); // evento1 y evento3
      expect((obs as any).getAllEvents()[0]).toEqual(evento1);
      expect((obs as any).getAllEvents()[1]).toEqual(evento3);
    });

    it('debería desuscribir solo de la categoría especificada', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const evento1 = crearEventoMock('academico');
      const evento2 = crearEventoMock('cultural');

      publicador.suscribir('academico', obs);
      publicador.suscribir('cultural', obs);

      // ACT
      publicador.desuscribir('academico', obs);
      publicador.notificar('academico', evento1);
      publicador.notificar('cultural', evento2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(1); // Solo evento2
      expect((obs as any).getLastEvent()?.categoria).toBe('cultural');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 3: AISLAMIENTO DE ERRORES
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 3: Aislamiento de errores entre observers', () => {
    it('debería continuar notificando si un observer lanza excepción', () => {
      // ARRANGE
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const obsFalla = crearObserverConError('user-falla');
      const obsExitoso1 = crearObserverMock('user-exito-1');
      const obsExitoso2 = crearObserverMock('user-exito-2');

      publicador.suscribir('academico', obsExitoso1);
      publicador.suscribir('academico', obsFalla);
      publicador.suscribir('academico', obsExitoso2);

      const evento = crearEventoMock('academico');

      // ACT
      expect(() => {
        publicador.notificar('academico', evento);
      }).not.toThrow();

      // ASSERT
      expect((obsExitoso1 as any).getCallCount()).toBe(1);
      expect((obsExitoso2 as any).getCallCount()).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('debería notificar a observers posteriores aunque los anteriores fallen', () => {
      // ARRANGE
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const obsFalla1 = crearObserverConError();
      const obsExitoso = crearObserverMock();
      const obsFalla2 = crearObserverConError();

      publicador.suscribir('academico', obsFalla1);
      publicador.suscribir('academico', obsExitoso);
      publicador.suscribir('academico', obsFalla2);

      const evento = crearEventoMock('academico');

      // ACT
      publicador.notificar('academico', evento);

      // ASSERT
      expect((obsExitoso as any).getCallCount()).toBe(1);
      expect((obsExitoso as any).getLastEvent()).toEqual(evento);

      consoleErrorSpy.mockRestore();
    });

    it('debería registrar el error en consola pero no afectar el flujo', () => {
      // ARRANGE
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const obsFalla = crearObserverConError();
      publicador.suscribir('academico', obsFalla);

      const evento = crearEventoMock('academico');

      // ACT
      publicador.notificar('academico', evento);

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al notificar al observer:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 4: MOCKS/STUBS (Sin WebSocket/BD real)
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 4: Uso de mocks y stubs (sin dependencias externas)', () => {
    it('debería usar mocks para observers sin WebSocket real', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const mockFn = (obs as any).eventoRecibido;

      const evento = crearEventoMock('academico');

      publicador.suscribir('academico', obs);

      // ACT
      publicador.notificar('academico', evento);

      // ASSERT - Verificar que el mock fue llamado
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(evento);
    });

    it('debería no depender de base de datos (todo en memoria)', () => {
      // ARRANGE
      const obs = crearObserverMock('user-001');
      const evento = crearEventoMock('academico');

      // ACT
      publicador.suscribir('academico', obs); // En memoria
      publicador.notificar('academico', evento); // En memoria

      // ASSERT - Verificar que todo ocurrió sin I/O
      expect((obs as any).getCallCount()).toBe(1);
      expect((obs as any).getLastEvent()).toEqual(evento);
    });

    it('debería manejar eventos sin persistencia en BD', () => {
      // ARRANGE
      const eventos = [
        crearEventoMock('academico', 'Evento 1'),
        crearEventoMock('academico', 'Evento 2'),
        crearEventoMock('academico', 'Evento 3'),
      ];
      const obs = crearObserverMock('user-001');

      publicador.suscribir('academico', obs);

      // ACT
      eventos.forEach(evento => publicador.notificar('academico', evento));

      // ASSERT
      expect((obs as any).getCallCount()).toBe(3);
      expect((obs as any).getAllEvents()).toEqual(eventos);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 5: RESPONSABILIDAD ÚNICA Y COMPOSICIÓN
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 5: Responsabilidad única y composición', () => {
    it('EventoPublicador (Subject) solo gestiona suscriptores y notificaciones', () => {
      // El Subject NO debería conocer detalles del Observer
      const obs = crearObserverMock();
      const evento = crearEventoMock('academico');

      publicador.suscribir('academico', obs);
      publicador.notificar('academico', evento);

      // ASSERT - Solo verifica que se notificó, sin asumir detalles del observer
      expect((obs as any).getCallCount()).toBe(1);
    });

    it('debería soportar múltiples tipos de observers diferentes', () => {
      // ARRANGE
      const observerMock = crearObserverMock('user-001');
      const observerConError = crearObserverConError('user-002');

      publicador.suscribir('academico', observerMock);
      publicador.suscribir('academico', observerConError);

      const evento = crearEventoMock('academico');

      // ACT
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      publicador.notificar('academico', evento);
      consoleErrorSpy.mockRestore();

      // ASSERT
      expect((observerMock as any).getCallCount()).toBe(1);
    });

    it('debería permitir composición de suscriptores por categoría', () => {
      // ARRANGE
      const observersAcademico = [
        crearObserverMock('user-acad-1'),
        crearObserverMock('user-acad-2'),
      ];
      const observersCultural = [
        crearObserverMock('user-cult-1'),
        crearObserverMock('user-cult-2'),
      ];

      observersAcademico.forEach(obs => publicador.suscribir('academico', obs));
      observersCultural.forEach(obs => publicador.suscribir('cultural', obs));

      const eventoAcad = crearEventoMock('academico');
      const eventoCult = crearEventoMock('cultural');

      // ACT
      publicador.notificar('academico', eventoAcad);
      publicador.notificar('cultural', eventoCult);

      // ASSERT
      observersAcademico.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
        expect((obs as any).getLastEvent()?.categoria).toBe('academico');
      });

      observersCultural.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
        expect((obs as any).getLastEvent()?.categoria).toBe('cultural');
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // PRUEBAS ADICIONALES - CASOS ESPECIALES Y ROBUSTEZ
  // ────────────────────────────────────────────────────────────────────────

  describe('🔒 Robustez y casos especiales', () => {
    it('debería devolver siempre la misma instancia (Singleton)', () => {
      const inst1 = EventoPublicador.getInstance();
      const inst2 = EventoPublicador.getInstance();
      const inst3 = EventoPublicador.getInstance();

      expect(inst1).toBe(inst2);
      expect(inst2).toBe(inst3);
    });

    it('debería contar suscriptores correctamente', () => {
      const obs1 = crearObserverMock('user-1');
      const obs2 = crearObserverMock('user-2');
      const obs3 = crearObserverMock('user-3');

      expect(publicador.contarSuscriptores('academico')).toBe(0);

      publicador.suscribir('academico', obs1);
      expect(publicador.contarSuscriptores('academico')).toBe(1);

      publicador.suscribir('academico', obs2);
      expect(publicador.contarSuscriptores('academico')).toBe(2);

      publicador.suscribir('academico', obs3);
      expect(publicador.contarSuscriptores('academico')).toBe(3);

      publicador.desuscribir('academico', obs1);
      expect(publicador.contarSuscriptores('academico')).toBe(2);
    });

    it('debería listar categorías suscritas por usuario', () => {
      const obs1 = crearObserverMock('user-001');
      const obs2 = crearObserverMock('user-002');

      publicador.suscribir('academico', obs1);
      publicador.suscribir('cultural', obs1);
      publicador.suscribir('deportivo', obs1);
      publicador.suscribir('academico', obs2);

      const categoriasUser1 = publicador.listarCategoriasSuscritas('user-001');
      const categoriasUser2 = publicador.listarCategoriasSuscritas('user-002');

      expect(categoriasUser1).toContain('academico');
      expect(categoriasUser1).toContain('cultural');
      expect(categoriasUser1).toContain('deportivo');
      expect(categoriasUser2).toContain('academico');
      expect(categoriasUser2).not.toContain('cultural');
    });

    it('debería notificar sin errores si no hay suscriptores', () => {
      const evento = crearEventoMock('academico');

      expect(() => {
        publicador.notificar('academico', evento);
      }).not.toThrow();
    });

    it('debería manejar desuscripción de usuario inexistente sin error', () => {
      const obsNoExiste = crearObserverMock('user-noexiste');

      expect(() => {
        publicador.desuscribir('academico', obsNoExiste);
      }).not.toThrow();
    });

    it('debería validar que el evento recibido sea exacto', () => {
      const obs = crearObserverMock('user-001');
      const evento = crearEventoMock('academico', 'Test especifico');

      publicador.suscribir('academico', obs);
      publicador.notificar('academico', evento);

      const eventoRecibido = (obs as any).getLastEvent();

      expect(eventoRecibido?.id).toBe(evento.id);
      expect(eventoRecibido?.titulo).toBe('Test especifico');
      expect(eventoRecibido?.categoria).toBe('academico');
      expect(eventoRecibido?.creadorId).toBe(evento.creadorId);
      expect(eventoRecibido?.fechaEvento).toEqual(evento.fechaEvento);
    });
  });
});
