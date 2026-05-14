/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { GrupoEstudioSubject, GrupoEstudioEvent } from '../src/modules/groups/domain/grupo-estudio-subject';
import { IGrupoEstudioObserver } from '../src/modules/groups/domain/contracts-grupo-estudio';

/**
 * ============================================================================
 * SUITE DE INTEGRACIÓN - GrupoEstudioSubject (Patrón Observer)
 * ============================================================================
 * 
 * Subject concreto para eventos de ciclo de vida de grupos de estudio
 * 
 * ✅ Criterio 5: Integración con Subject concreto (GrupoEstudio)
 * 
 * Pruebas de:
 * - Suscripción a eventos de grupo
 * - Notificación de eventos (creado, modificado, miembro agregado, etc.)
 * - Desuscripción de observadores
 * - Aislamiento de errores entre observadores
 * - Manejo de múltiples grupos
 * 
 * ============================================================================
 */

// ──────────────────────────────────────────────────────────────────────────
// FACTORIES PARA MOCKS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Crea un evento de grupo mock
 */
function crearEventoGrupoMock(
  grupoId: string = 'grupo-001',
  tipo: 'creado' | 'modificado' | 'finalizado' | 'miembro-agregado' | 'miembro-removido' = 'creado',
  nombre: string = 'Grupo de Estudio'
): GrupoEstudioEvent {
  return {
    tipo,
    grupoId,
    nombre,
    descripcion: 'Grupo de estudio para matemáticas',
    miembrosActuales: 5,
    timestamp: new Date(),
  };
}

/**
 * Crea un observador mock que implementa IGrupoEstudioObserver
 */
function crearObservadorGrupoMock(
  identificador: string = `obs-${Math.random()}`
) {
  const mockFn = jest.fn();

  return {
    identificador,
    eventosRecibidos: mockFn,

    // Implementa IGrupoEstudioObserver
    onEventoGrupo(evento: GrupoEstudioEvent) {
      mockFn(evento);
    },

    // Helpers para testing
    getCallCount(): number {
      return mockFn.mock.calls.length;
    },

    getLastEvent(): GrupoEstudioEvent | undefined {
      if (mockFn.mock.calls.length === 0) return undefined;
      return mockFn.mock.calls[mockFn.mock.calls.length - 1][0];
    },

    getAllEvents(): GrupoEstudioEvent[] {
      return mockFn.mock.calls.map(call => call[0]);
    },

    limpiar(): void {
      mockFn.mockClear();
    },
  } as IGrupoEstudioObserver & {
    identificador: string;
    eventosRecibidos: jest.Mock;
    getCallCount(): number;
    getLastEvent(): GrupoEstudioEvent | undefined;
    getAllEvents(): GrupoEstudioEvent[];
    limpiar(): void;
  };
}

/**
 * Crea un observador que lanza error
 */
function crearObservadorGrupoConError(
  identificador: string = `obs-error-${Math.random()}`
) {
  return {
    identificador,

    onEventoGrupo(): void {
      throw new Error('Error simulado en observer de grupo');
    },
  } as IGrupoEstudioObserver;
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE DE INTEGRACIÓN - GrupoEstudioSubject
// ──────────────────────────────────────────────────────────────────────────

describe('🔗 GrupoEstudioSubject - Integración del Patrón Observer en Grupos', () => {
  let subject: GrupoEstudioSubject;

  beforeEach(() => {
    // Reiniciar singleton entre tests
    (GrupoEstudioSubject as unknown as { instance: undefined }).instance = undefined;
    subject = GrupoEstudioSubject.getInstance();
    subject.limpiar();
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 1: NOTIFICACIÓN A MÚLTIPLES OBSERVERS
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 1: Notificación a múltiples observers', () => {
    it('debería notificar a 2 observers cuando se crea un grupo', () => {
      // ARRANGE
      const obs1 = crearObservadorGrupoMock('obs-user-1');
      const obs2 = crearObservadorGrupoMock('obs-user-2');
      const evento = crearEventoGrupoMock('grupo-001', 'creado', 'Matemáticas I');

      subject.suscribir('grupo-001', obs1);
      subject.suscribir('grupo-001', obs2);

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      expect((obs1 as any).getCallCount()).toBe(1);
      expect((obs2 as any).getCallCount()).toBe(1);
      expect((obs1 as any).getLastEvent()).toEqual(evento);
      expect((obs2 as any).getLastEvent()).toEqual(evento);
    });

    it('debería notificar a múltiples observers de diferentes tipos de eventos', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs-user');
      const eventoCreado = crearEventoGrupoMock('grupo-001', 'creado');
      const eventoModificado = crearEventoGrupoMock('grupo-001', 'modificado');
      const miembroAgregado = crearEventoGrupoMock('grupo-001', 'miembro-agregado');

      subject.suscribir('grupo-001', obs);

      // ACT
      subject.emitirEvento('grupo-001', eventoCreado);
      subject.emitirEvento('grupo-001', eventoModificado);
      subject.emitirEvento('grupo-001', miembroAgregado);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(3);
      expect((obs as any).getAllEvents()).toHaveLength(3);
      expect((obs as any).getAllEvents()[0].tipo).toBe('creado');
      expect((obs as any).getAllEvents()[1].tipo).toBe('modificado');
      expect((obs as any).getAllEvents()[2].tipo).toBe('miembro-agregado');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 2: DESUSCRIPCIÓN
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 2: Desuscripción', () => {
    it('debería prevenir que observer desuscrito reciba eventos', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs-user');
      const evento1 = crearEventoGrupoMock('grupo-001', 'creado');
      const evento2 = crearEventoGrupoMock('grupo-001', 'modificado');

      subject.suscribir('grupo-001', obs);
      subject.emitirEvento('grupo-001', evento1);

      // ACT
      subject.desuscribir('grupo-001', obs);
      subject.emitirEvento('grupo-001', evento2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(1);
      expect((obs as any).getLastEvent()).toEqual(evento1);
    });

    it('debería permitir que un observer se resuscriba', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs-user');
      const evento1 = crearEventoGrupoMock('grupo-001', 'creado');
      const evento2 = crearEventoGrupoMock('grupo-001', 'modificado');
      const evento3 = crearEventoGrupoMock('grupo-001', 'miembro-agregado');

      // ACT
      subject.suscribir('grupo-001', obs);
      subject.emitirEvento('grupo-001', evento1);

      subject.desuscribir('grupo-001', obs);
      subject.emitirEvento('grupo-001', evento2);

      subject.suscribir('grupo-001', obs);
      subject.emitirEvento('grupo-001', evento3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(2);
      expect((obs as any).getAllEvents()[0]).toEqual(evento1);
      expect((obs as any).getAllEvents()[1]).toEqual(evento3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 3: AISLAMIENTO DE ERRORES
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 3: Aislamiento de errores', () => {
    it('debería continuar notificando si un observer lanza error', () => {
      // ARRANGE
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const obsFalla = crearObservadorGrupoConError();
      const obsExitoso = crearObservadorGrupoMock('obs-exit');

      subject.suscribir('grupo-001', obsExitoso);
      subject.suscribir('grupo-001', obsFalla);
      subject.suscribir('grupo-001', crearObservadorGrupoMock('obs-exit-2'));

      const evento = crearEventoGrupoMock('grupo-001', 'creado');

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      expect((obsExitoso as any).getCallCount()).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 4: MOCKS (Sin dependencias externas)
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 4: Mocks sin dependencias externas', () => {
    it('debería usar mocks para observers sin persistencia en BD', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs-mock');
      const mockFn = (obs as any).eventosRecibidos;
      const evento = crearEventoGrupoMock('grupo-001', 'creado');

      subject.suscribir('grupo-001', obs);

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(evento);
    });

    it('debería todo ocurrir en memoria (sin I/O)', () => {
      // ARRANGE
      const observers = Array.from({ length: 5 }, (_, i) =>
        crearObservadorGrupoMock(`obs-${i}`)
      );
      const evento = crearEventoGrupoMock('grupo-001', 'creado');

      observers.forEach(obs => subject.suscribir('grupo-001', obs));

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 5: INTEGRACIÓN CON SUBJECT CONCRETO
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 5: Integración con GrupoEstudioSubject concreto', () => {
    it('debería simular ciclo de vida completo de un grupo de estudio', () => {
      // ARRANGE
      const grupoId = 'grupo-estudio-001';
      const coordinador = crearObservadorGrupoMock('coordinador');
      const miembro1 = crearObservadorGrupoMock('miembro-1');
      const miembro2 = crearObservadorGrupoMock('miembro-2');

      // ACT 1: Suscribir observadores
      subject.suscribir(grupoId, coordinador);
      subject.suscribir(grupoId, miembro1);
      subject.suscribir(grupoId, miembro2);

      expect(subject.contarSuscriptores(grupoId)).toBe(3);

      // ACT 2: Crear grupo
      const eventoCreado = crearEventoGrupoMock(grupoId, 'creado', 'Matemáticas Avanzada');
      subject.emitirEvento(grupoId, eventoCreado);

      // ACT 3: Modificar grupo
      const eventoModificado = crearEventoGrupoMock(
        grupoId,
        'modificado',
        'Matemáticas Avanzada - Semestre 2'
      );
      subject.emitirEvento(grupoId, eventoModificado);

      // ACT 4: Agregar miembro
      const eventoMiembroAgregado = crearEventoGrupoMock(
        grupoId,
        'miembro-agregado',
        'Matemáticas Avanzada - Semestre 2'
      );
      subject.emitirEvento(grupoId, eventoMiembroAgregado);

      // ASSERT - Todos recibieron todos los eventos
      expect((coordinador as any).getCallCount()).toBe(3);
      expect((miembro1 as any).getCallCount()).toBe(3);
      expect((miembro2 as any).getCallCount()).toBe(3);

      // Verificar que los tipos de eventos son correctos
      expect((coordinador as any).getAllEvents()[0].tipo).toBe('creado');
      expect((coordinador as any).getAllEvents()[1].tipo).toBe('modificado');
      expect((coordinador as any).getAllEvents()[2].tipo).toBe('miembro-agregado');
    });

    it('debería manejar múltiples grupos independientes en paralelo', () => {
      // ARRANGE
      const grupo1 = 'grupo-matematicas';
      const grupo2 = 'grupo-programacion';

      const obsMatematicas1 = crearObservadorGrupoMock('obs-mat-1');
      const obsMatematicas2 = crearObservadorGrupoMock('obs-mat-2');
      const obsProgramacion1 = crearObservadorGrupoMock('obs-prog-1');
      const obsProgramacion2 = crearObservadorGrupoMock('obs-prog-2');

      subject.suscribir(grupo1, obsMatematicas1);
      subject.suscribir(grupo1, obsMatematicas2);
      subject.suscribir(grupo2, obsProgramacion1);
      subject.suscribir(grupo2, obsProgramacion2);

      // ACT
      const eventoMat = crearEventoGrupoMock(grupo1, 'creado', 'Matemáticas');
      const eventoProg = crearEventoGrupoMock(grupo2, 'creado', 'Programación');

      subject.emitirEvento(grupo1, eventoMat);
      subject.emitirEvento(grupo2, eventoProg);

      // ASSERT
      expect((obsMatematicas1 as any).getCallCount()).toBe(1);
      expect((obsMatematicas2 as any).getCallCount()).toBe(1);
      expect((obsProgramacion1 as any).getCallCount()).toBe(1);
      expect((obsProgramacion2 as any).getCallCount()).toBe(1);

      expect((obsMatematicas1 as any).getLastEvent()?.nombre).toBe('Matemáticas');
      expect((obsProgramacion1 as any).getLastEvent()?.nombre).toBe('Programación');
    });

    it('debería contar suscriptores activos correctamente', () => {
      // ARRANGE
      const obs1 = crearObservadorGrupoMock('obs-1');
      const obs2 = crearObservadorGrupoMock('obs-2');
      const obs3 = crearObservadorGrupoMock('obs-3');

      // ACT
      subject.suscribir('grupo-001', obs1);
      subject.suscribir('grupo-001', obs2);
      subject.suscribir('grupo-002', obs3);

      // ASSERT
      expect(subject.contarSuscriptores('grupo-001')).toBe(2);
      expect(subject.contarSuscriptores('grupo-002')).toBe(1);
      expect(subject.contarGruposActivos()).toBe(2);
    });

    it('debería permitir que observador se susciba a múltiples grupos', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs-multi-grupo');
      const evento1 = crearEventoGrupoMock('grupo-001', 'creado');
      const evento2 = crearEventoGrupoMock('grupo-002', 'creado');

      // ACT
      subject.suscribir('grupo-001', obs);
      subject.suscribir('grupo-002', obs);

      subject.emitirEvento('grupo-001', evento1);
      subject.emitirEvento('grupo-002', evento2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(2);
      expect((obs as any).getAllEvents()[0].grupoId).toBe('grupo-001');
      expect((obs as any).getAllEvents()[1].grupoId).toBe('grupo-002');
    });

    it('debería validar que el evento recibido sea completo', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs');
      const evento = crearEventoGrupoMock('grupo-001', 'creado', 'Test Grupo');

      subject.suscribir('grupo-001', obs);

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      const eventoRecibido = (obs as any).getLastEvent();
      expect(eventoRecibido?.tipo).toBe('creado');
      expect(eventoRecibido?.grupoId).toBe('grupo-001');
      expect(eventoRecibido?.nombre).toBe('Test Grupo');
      expect(eventoRecibido?.miembrosActuales).toBe(5);
      expect(eventoRecibido?.timestamp).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // PRUEBAS ADICIONALES
  // ────────────────────────────────────────────────────────────────────────

  describe('🔒 Robustez y casos edge', () => {
    it('debería devolver la misma instancia (Singleton)', () => {
      const inst1 = GrupoEstudioSubject.getInstance();
      const inst2 = GrupoEstudioSubject.getInstance();

      expect(inst1).toBe(inst2);
    });

    it('debería limpiar grupos sin suscriptores', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs');
      const grupoId = 'grupo-001';

      subject.suscribir(grupoId, obs);
      expect(subject.contarGruposActivos()).toBe(1);

      // ACT
      subject.desuscribir(grupoId, obs);

      // ASSERT
      expect(subject.contarGruposActivos()).toBe(0);
      expect(subject.contarSuscriptores(grupoId)).toBe(0);
    });

    it('debería manejar todos los tipos de eventos', () => {
      // ARRANGE
      const obs = crearObservadorGrupoMock('obs');
      const tipos: Array<
        'creado' | 'modificado' | 'finalizado' | 'miembro-agregado' | 'miembro-removido'
      > = ['creado', 'modificado', 'miembro-agregado', 'miembro-removido', 'finalizado'];

      subject.suscribir('grupo-001', obs);

      // ACT
      tipos.forEach(tipo => {
        const evento = crearEventoGrupoMock('grupo-001', tipo);
        subject.emitirEvento('grupo-001', evento);
      });

      // ASSERT
      expect((obs as any).getCallCount()).toBe(5);
      expect((obs as any).getAllEvents().map((e: any) => e.tipo)).toEqual(tipos);
    });

    it('debería emitir advertencia si no hay suscriptores', () => {
      // ARRANGE
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const evento = crearEventoGrupoMock('grupo-vacio', 'creado');

      // ACT
      subject.emitirEvento('grupo-vacio', evento);

      // ASSERT
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('debería manejar 100 observadores simultáneamente', () => {
      // ARRANGE
      const numObs = 100;
      const observers = Array.from({ length: numObs }, (_, i) =>
        crearObservadorGrupoMock(`obs-${i}`)
      );
      const evento = crearEventoGrupoMock('grupo-001', 'creado');

      observers.forEach(obs => subject.suscribir('grupo-001', obs));

      // ACT
      subject.emitirEvento('grupo-001', evento);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
      });
      expect(subject.contarSuscriptores('grupo-001')).toBe(numObs);
    });
  });
});
