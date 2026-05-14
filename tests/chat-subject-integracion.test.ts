/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { ChatSubject } from '../src/modules/messages/domain/chat-subject';
import { IChatObserver } from '../src/modules/messages/domain/contracts';
import { GroupMessageRecord } from '../src/domain/contracts';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE INTEGRACIÓN - ChatSubject (Patrón Observer)
 * ============================================================================
 * 
 * Pruebas de integración para el Subject de Chat que gestiona:
 * - Suscripción de observadores a grupos
 * - Notificación de nuevos mensajes
 * - Desuscripción y limpieza de memoria
 * 
 * ✅ Criterio 1: Notificación a múltiples observers de un grupo
 * ✅ Criterio 2: Desuscripción de observers específicos
 * ✅ Criterio 3: Aislamiento de errores en observers
 * ✅ Criterio 4: Mocks sin WebSocket real
 * ✅ Criterio 5: Tests de integración con Subject concreto
 * 
 * ============================================================================
 */

// ──────────────────────────────────────────────────────────────────────────
// FACTORIES PARA MOCKS Y TEST DATA
// ──────────────────────────────────────────────────────────────────────────

/**
 * Crea un mensaje de grupo mock
 */
function crearMensajeMock(
  grupoId: string = 'grupo-001',
  emisorId: string = 'usuario-001',
  contenido: string = 'Mensaje de prueba'
): GroupMessageRecord {
  return {
    id: `msg-${Date.now()}`,
    contenido,
    grupoId,
    emisorId,
    createdAt: new Date(),
    grupo: {
      nombre: 'Grupo de Estudio',
    },
    emisor: {
      id: emisorId,
      nombre: 'Usuario Test',
      apellido: 'Prueba',
    },
  };
}

/**
 * Crea un observer mock que implementa IChatObserver
 */
function crearChatObserverMock(
  identificador: string = `observer-${Math.random()}`
) {
  const mockFn = jest.fn();

  return {
    identificador,
    mensajesRecibidos: mockFn,

    // Implementa IChatObserver
    onNuevoMensajeGrupo(payload: GroupMessageRecord) {
      mockFn(payload);
    },

    // Helpers para testing
    getCallCount(): number {
      return mockFn.mock.calls.length;
    },

    getLastMessage(): GroupMessageRecord | undefined {
      if (mockFn.mock.calls.length === 0) return undefined;
      return mockFn.mock.calls[mockFn.mock.calls.length - 1][0];
    },

    getAllMessages(): GroupMessageRecord[] {
      return mockFn.mock.calls.map(call => call[0]);
    },

    limpiar(): void {
      mockFn.mockClear();
    },
  } as IChatObserver & {
    identificador: string;
    mensajesRecibidos: jest.Mock;
    getCallCount(): number;
    getLastMessage(): GroupMessageRecord | undefined;
    getAllMessages(): GroupMessageRecord[];
    limpiar(): void;
  };
}

/**
 * Crea un observer que lanza error
 */
function crearChatObserverConError(
  identificador: string = `observer-error-${Math.random()}`
) {
  return {
    identificador,

    onNuevoMensajeGrupo(): void {
      throw new Error('Error simulado en observer de chat');
    },
  } as IChatObserver;
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE DE INTEGRACIÓN - ChatSubject
// ──────────────────────────────────────────────────────────────────────────

describe('🔗 ChatSubject - Integración del Patrón Observer en Chat', () => {
  let chatSubject: ChatSubject;

  beforeEach(() => {
    // Reiniciar singleton entre tests
    (ChatSubject as unknown as { instance: undefined }).instance = undefined;
    chatSubject = ChatSubject.getInstance();
    chatSubject.limpiar(); // Limpiar estado previo
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 1: NOTIFICACIÓN A MÚLTIPLES OBSERVERS
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 1: Notificación a múltiples observers de un grupo', () => {
    it('debería notificar a 2 observers suscritos al mismo grupo', () => {
      // ARRANGE
      const obs1 = crearChatObserverMock('obs-web-1');
      const obs2 = crearChatObserverMock('obs-web-2');
      const mensaje = crearMensajeMock('grupo-001', 'usuario-001', 'Primer mensaje');

      chatSubject.suscribir('grupo-001', obs1);
      chatSubject.suscribir('grupo-001', obs2);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT - Ambos observers reciben el mensaje
      expect((obs1 as any).getCallCount()).toBe(1);
      expect((obs2 as any).getCallCount()).toBe(1);
      expect((obs1 as any).getLastMessage()).toEqual(mensaje);
      expect((obs2 as any).getLastMessage()).toEqual(mensaje);
    });

    it('debería notificar a N observers de un grupo (5 participantes)', () => {
      // ARRANGE
      const observers = Array.from({ length: 5 }, (_, i) =>
        crearChatObserverMock(`obs-${i}`)
      );
      const mensaje = crearMensajeMock('grupo-001');

      observers.forEach(obs => chatSubject.suscribir('grupo-001', obs));

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
        expect((obs as any).getLastMessage()).toEqual(mensaje);
      });
    });

    it('debería notificar correctamente múltiples mensajes en secuencia', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-web');
      const msg1 = crearMensajeMock('grupo-001', 'user-1', 'Primer mensaje');
      const msg2 = crearMensajeMock('grupo-001', 'user-2', 'Segundo mensaje');
      const msg3 = crearMensajeMock('grupo-001', 'user-3', 'Tercer mensaje');

      chatSubject.suscribir('grupo-001', obs);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', msg1);
      chatSubject.emitirNuevoMensaje('grupo-001', msg2);
      chatSubject.emitirNuevoMensaje('grupo-001', msg3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(3);
      expect((obs as any).getAllMessages()).toHaveLength(3);
      expect((obs as any).getAllMessages()[0].contenido).toBe('Primer mensaje');
      expect((obs as any).getAllMessages()[1].contenido).toBe('Segundo mensaje');
      expect((obs as any).getAllMessages()[2].contenido).toBe('Tercer mensaje');
    });

    it('debería mantener separados los observadores de diferentes grupos', () => {
      // ARRANGE
      const obsGrupo1 = crearChatObserverMock('obs-g1');
      const obsGrupo2 = crearChatObserverMock('obs-g2');
      const msgG1 = crearMensajeMock('grupo-001');
      const msgG2 = crearMensajeMock('grupo-002');

      chatSubject.suscribir('grupo-001', obsGrupo1);
      chatSubject.suscribir('grupo-002', obsGrupo2);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', msgG1);
      chatSubject.emitirNuevoMensaje('grupo-002', msgG2);

      // ASSERT
      expect((obsGrupo1 as any).getCallCount()).toBe(1);
      expect((obsGrupo2 as any).getCallCount()).toBe(1);
      expect((obsGrupo1 as any).getLastMessage()?.grupoId).toBe('grupo-001');
      expect((obsGrupo2 as any).getLastMessage()?.grupoId).toBe('grupo-002');
    });

    it('debería notificar solo a observers del grupo específico', () => {
      // ARRANGE
      const obsGrupo1 = crearChatObserverMock('obs-g1');
      const obsGrupo2 = crearChatObserverMock('obs-g2');
      const mensaje = crearMensajeMock('grupo-001');

      chatSubject.suscribir('grupo-001', obsGrupo1);
      chatSubject.suscribir('grupo-002', obsGrupo2);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      expect((obsGrupo1 as any).getCallCount()).toBe(1);
      expect((obsGrupo2 as any).getCallCount()).toBe(0); // No debe recibir
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 2: DESUSCRIPCIÓN Y AISLAMIENTO
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 2: Desuscripción y aislamiento', () => {
    it('debería evitar que observer desuscrito reciba mensajes', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-web');
      const msg1 = crearMensajeMock('grupo-001', 'user-1', 'Primer mensaje');
      const msg2 = crearMensajeMock('grupo-001', 'user-2', 'Segundo mensaje');

      chatSubject.suscribir('grupo-001', obs);
      chatSubject.emitirNuevoMensaje('grupo-001', msg1);

      // ACT - Desuscribir
      chatSubject.desuscribir('grupo-001', obs);
      chatSubject.emitirNuevoMensaje('grupo-001', msg2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(1); // Solo recibe el primer mensaje
      expect((obs as any).getLastMessage()).toEqual(msg1);
    });

    it('debería permitir resuscripción después de desuscripción', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-web');
      const msg1 = crearMensajeMock('grupo-001');
      const msg2 = crearMensajeMock('grupo-001');
      const msg3 = crearMensajeMock('grupo-001');

      // ACT - Suscripción inicial
      chatSubject.suscribir('grupo-001', obs);
      chatSubject.emitirNuevoMensaje('grupo-001', msg1);

      // Desuscripción
      chatSubject.desuscribir('grupo-001', obs);
      chatSubject.emitirNuevoMensaje('grupo-001', msg2);

      // Resuscripción
      chatSubject.suscribir('grupo-001', obs);
      chatSubject.emitirNuevoMensaje('grupo-001', msg3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(2); // msg1 y msg3
      expect((obs as any).getAllMessages()[0]).toEqual(msg1);
      expect((obs as any).getAllMessages()[1]).toEqual(msg3);
    });

    it('debería desuscribir de todos los grupos con desuscribirDeTodos()', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-web');
      const msg1 = crearMensajeMock('grupo-001');
      const msg2 = crearMensajeMock('grupo-002');
      const msg3 = crearMensajeMock('grupo-003');

      chatSubject.suscribir('grupo-001', obs);
      chatSubject.suscribir('grupo-002', obs);
      chatSubject.suscribir('grupo-003', obs);

      chatSubject.emitirNuevoMensaje('grupo-001', msg1);

      // ACT - Desuscribir de todos los grupos
      chatSubject.desuscribirDeTodos(obs);

      chatSubject.emitirNuevoMensaje('grupo-002', msg2);
      chatSubject.emitirNuevoMensaje('grupo-003', msg3);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(1); // Solo recibe msg1
      expect((obs as any).getLastMessage()).toEqual(msg1);
    });

    it('debería permitir suscripción del mismo observer a múltiples grupos', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-web');
      const msg1 = crearMensajeMock('grupo-001');
      const msg2 = crearMensajeMock('grupo-002');

      // ACT
      chatSubject.suscribir('grupo-001', obs);
      chatSubject.suscribir('grupo-002', obs);

      chatSubject.emitirNuevoMensaje('grupo-001', msg1);
      chatSubject.emitirNuevoMensaje('grupo-002', msg2);

      // ASSERT
      expect((obs as any).getCallCount()).toBe(2);
      expect((obs as any).getAllMessages()).toHaveLength(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 3: AISLAMIENTO DE ERRORES
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 3: Aislamiento de errores entre observers', () => {
    it('debería continuar notificando si un observer lanza excepción', () => {
      // ARRANGE
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const obsFalla = crearChatObserverConError('obs-falla');
      const obsExitoso1 = crearChatObserverMock('obs-exit-1');
      const obsExitoso2 = crearChatObserverMock('obs-exit-2');

      chatSubject.suscribir('grupo-001', obsExitoso1);
      chatSubject.suscribir('grupo-001', obsFalla);
      chatSubject.suscribir('grupo-001', obsExitoso2);

      const mensaje = crearMensajeMock('grupo-001');

      // ACT
      expect(() => {
        chatSubject.emitirNuevoMensaje('grupo-001', mensaje);
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

      const obsFalla1 = crearChatObserverConError('obs-falla-1');
      const obsExitoso = crearChatObserverMock('obs-exit');
      const obsFalla2 = crearChatObserverConError('obs-falla-2');

      chatSubject.suscribir('grupo-001', obsFalla1);
      chatSubject.suscribir('grupo-001', obsExitoso);
      chatSubject.suscribir('grupo-001', obsFalla2);

      const mensaje = crearMensajeMock('grupo-001');

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      expect((obsExitoso as any).getCallCount()).toBe(1);
      expect((obsExitoso as any).getLastMessage()).toEqual(mensaje);

      consoleErrorSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 4: MOCKS Y STUBS (Sin WebSocket real)
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 4: Mocks/stubs sin WebSocket real', () => {
    it('debería usar mocks para observers sin Socket.IO real', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs-mock');
      const mockFn = (obs as any).mensajesRecibidos;
      const mensaje = crearMensajeMock('grupo-001');

      chatSubject.suscribir('grupo-001', obs);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT - Verificar que el mock fue llamado
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(mensaje);
    });

    it('debería no depender de WebSocket (todo en memoria)', () => {
      // ARRANGE
      const observers = [
        crearChatObserverMock('obs-1'),
        crearChatObserverMock('obs-2'),
        crearChatObserverMock('obs-3'),
      ];
      const mensaje = crearMensajeMock('grupo-001');

      observers.forEach(obs => chatSubject.suscribir('grupo-001', obs));

      // ACT - Todo ocurre en memoria sin I/O
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // CRITERIO 5: TESTS DE INTEGRACIÓN CON SUBJECT CONCRETO
  // ────────────────────────────────────────────────────────────────────────

  describe('✅ CRITERIO 5: Integración con ChatSubject concreto', () => {
    it('debería simular flujo completo: crear grupo, suscribir, enviar mensaje, recibir', () => {
      // ARRANGE
      const grupoId = 'grupo-estudio-001';
      const observers = [
        crearChatObserverMock('usuario-web-1'),
        crearChatObserverMock('usuario-web-2'),
      ];

      // ACT 1: Suscribir usuarios al grupo
      observers.forEach(obs => chatSubject.suscribir(grupoId, obs));
      expect(chatSubject.contarSuscriptores(grupoId)).toBe(2);

      // ACT 2: Usuario envía mensaje
      const mensaje = crearMensajeMock(grupoId, 'usuario-001', 'Hola grupo!');
      chatSubject.emitirNuevoMensaje(grupoId, mensaje);

      // ASSERT: Todos reciben el mensaje
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
        expect((obs as any).getLastMessage()?.contenido).toBe('Hola grupo!');
      });
    });

    it('debería manejar múltiples grupos independientes en la misma sesión', () => {
      // ARRANGE
      const grupo1 = 'grupo-backend';
      const grupo2 = 'grupo-frontend';

      const obsBackend1 = crearChatObserverMock('user-backend-1');
      const obsBackend2 = crearChatObserverMock('user-backend-2');
      const obsFrontend1 = crearChatObserverMock('user-frontend-1');
      const obsFrontend2 = crearChatObserverMock('user-frontend-2');

      chatSubject.suscribir(grupo1, obsBackend1);
      chatSubject.suscribir(grupo1, obsBackend2);
      chatSubject.suscribir(grupo2, obsFrontend1);
      chatSubject.suscribir(grupo2, obsFrontend2);

      // ACT
      const msgBackend = crearMensajeMock(grupo1, 'user-1', 'Discutimos sobre APIs');
      const msgFrontend = crearMensajeMock(grupo2, 'user-2', 'Discutimos sobre React');

      chatSubject.emitirNuevoMensaje(grupo1, msgBackend);
      chatSubject.emitirNuevoMensaje(grupo2, msgFrontend);

      // ASSERT
      expect((obsBackend1 as any).getCallCount()).toBe(1);
      expect((obsBackend2 as any).getCallCount()).toBe(1);
      expect((obsFrontend1 as any).getCallCount()).toBe(1);
      expect((obsFrontend2 as any).getCallCount()).toBe(1);

      expect((obsBackend1 as any).getLastMessage()?.contenido).toBe('Discutimos sobre APIs');
      expect((obsFrontend1 as any).getLastMessage()?.contenido).toBe('Discutimos sobre React');
    });

    it('debería contar observadores activos por grupo', () => {
      // ARRANGE
      const observers = Array.from({ length: 5 }, (_, i) =>
        crearChatObserverMock(`obs-${i}`)
      );

      // ACT
      observers.forEach((obs, i) => {
        if (i < 3) {
          chatSubject.suscribir('grupo-001', obs);
        } else {
          chatSubject.suscribir('grupo-002', obs);
        }
      });

      // ASSERT
      expect(chatSubject.contarSuscriptores('grupo-001')).toBe(3);
      expect(chatSubject.contarSuscriptores('grupo-002')).toBe(2);
      expect(chatSubject.contarGruposActivos()).toBe(2);
    });

    it('debería limpiar automaticamente grupos sin suscriptores', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs');
      const grupoId = 'grupo-001';

      chatSubject.suscribir(grupoId, obs);
      expect(chatSubject.contarGruposActivos()).toBe(1);

      // ACT
      chatSubject.desuscribir(grupoId, obs);

      // ASSERT - El grupo debe ser limpiado
      expect(chatSubject.contarSuscriptores(grupoId)).toBe(0);
    });

    it('debería emitir advertencia si no hay suscriptores', () => {
      // ARRANGE
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const mensaje = crearMensajeMock('grupo-vacio');

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-vacio', mensaje);

      // ASSERT
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('debería validar que el mensaje recibido sea completo', () => {
      // ARRANGE
      const obs = crearChatObserverMock('obs');
      const mensaje = crearMensajeMock(
        'grupo-001',
        'usuario-123',
        'Contenido importante'
      );

      chatSubject.suscribir('grupo-001', obs);

      // ACT
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      const mensajeRecibido = (obs as any).getLastMessage();
      expect(mensajeRecibido?.id).toBe(mensaje.id);
      expect(mensajeRecibido?.contenido).toBe('Contenido importante');
      expect(mensajeRecibido?.grupoId).toBe('grupo-001');
      expect(mensajeRecibido?.emisorId).toBe('usuario-123');
      expect(mensajeRecibido?.grupo).toBeDefined();
      expect(mensajeRecibido?.emisor).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // PRUEBAS ADICIONALES - ROBUSTEZ Y CASOS EDGE
  // ────────────────────────────────────────────────────────────────────────

  describe('🔒 Robustez y casos edge', () => {
    it('debería devolver siempre la misma instancia (Singleton)', () => {
      const inst1 = ChatSubject.getInstance();
      const inst2 = ChatSubject.getInstance();
      const inst3 = ChatSubject.getInstance();

      expect(inst1).toBe(inst2);
      expect(inst2).toBe(inst3);
    });

    it('debería permitir múltiples suscriptores simultáneamente', () => {
      // ARRANGE
      const numObservers = 100;
      const observers = Array.from({ length: numObservers }, (_, i) =>
        crearChatObserverMock(`obs-${i}`)
      );

      observers.forEach(obs => chatSubject.suscribir('grupo-001', obs));

      // ACT
      const mensaje = crearMensajeMock('grupo-001');
      chatSubject.emitirNuevoMensaje('grupo-001', mensaje);

      // ASSERT
      observers.forEach(obs => {
        expect((obs as any).getCallCount()).toBe(1);
      });
      expect(chatSubject.contarSuscriptores('grupo-001')).toBe(numObservers);
    });

    it('debería manejar desuscripción de observer inexistente sin error', () => {
      // ARRANGE
      const obsNoExiste = crearChatObserverMock('obs-noexiste');

      // ACT & ASSERT
      expect(() => {
        chatSubject.desuscribir('grupo-001', obsNoExiste);
      }).not.toThrow();
    });
  });
});
