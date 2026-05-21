/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { WebChatObserver } from '../src/modules/messages/infrastructure/web-chat-observer';
import { GroupMessageRecord, ReaccionMensajeGrupoRecord, MencionMensajeGrupoRecord } from '../src/domain/contracts';

function crearMockSocket() {
  return { id: 'socket-web-1', emit: jest.fn() } as any;
}

function crearMensajeMock(overrides = {}): GroupMessageRecord {
  return {
    id: 'msg-1',
    grupoId: 'grupo-1',
    emisorId: 'user-1',
    emisorNombre: 'Juan',
    contenido: 'Hola',
    tipo: 'TEXTO',
    adjuntos: [],
    createdAt: new Date(),
    ...overrides,
  } as any;
}

function crearReaccionMock(): ReaccionMensajeGrupoRecord {
  return {
    mensajeId: 'msg-1',
    emoji: '👍',
    usuarioId: 'user-2',
    usuario: { id: 'user-2', nombre: 'Ana', apellido: 'Lopez' },
    createdAt: new Date(),
  } as any;
}

describe('WebChatObserver', () => {
  let socket: ReturnType<typeof crearMockSocket>;
  let observer: WebChatObserver;

  beforeEach(() => {
    socket = crearMockSocket();
    observer = new WebChatObserver(socket, 'grupo-1');
  });

  describe('onNuevoMensajeGrupo', () => {
    it('emite evento grupo:mensaje:nuevo con el payload', () => {
      const mensaje = crearMensajeMock();
      observer.onNuevoMensajeGrupo(mensaje);

      expect(socket.emit).toHaveBeenCalledWith('grupo:mensaje:nuevo', mensaje);
    });
  });

  describe('onReaccionAgregada', () => {
    it('emite evento grupo:reaccion:agregada con datos correctos', () => {
      const reaccion = crearReaccionMock();
      observer.onReaccionAgregada(reaccion);

      expect(socket.emit).toHaveBeenCalledWith('grupo:reaccion:agregada', {
        mensajeId: reaccion.mensajeId,
        emoji: reaccion.emoji,
        usuarioId: reaccion.usuarioId,
        usuario: reaccion.usuario,
        createdAt: reaccion.createdAt,
      });
    });
  });

  describe('onReaccionRemovida', () => {
    it('emite evento grupo:reaccion:removida con los datos', () => {
      const data = { mensajeId: 'msg-1', usuarioId: 'user-2', emoji: '👍' };
      observer.onReaccionRemovida(data);

      expect(socket.emit).toHaveBeenCalledWith('grupo:reaccion:removida', data);
    });
  });

  describe('onMencionar', () => {
    it('emite evento grupo:mention con datos correctos', () => {
      const mencion: MencionMensajeGrupoRecord = {
        mensajeId: 'msg-1',
        usuarioMencionadoId: 'user-3',
        usuarioMencionado: { id: 'user-3', nombre: 'Carlos', apellido: 'Ruiz' },
        createdAt: new Date(),
      } as any;

      observer.onMencionar(mencion);

      expect(socket.emit).toHaveBeenCalledWith('grupo:mention', {
        mensajeId: mencion.mensajeId,
        usuarioMencionadoId: mencion.usuarioMencionadoId,
        usuarioMencionado: mencion.usuarioMencionado,
        createdAt: mencion.createdAt,
      });
    });
  });

  describe('socket.emit lanza error', () => {
    it('catch en todos los metodos no propaga errores', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      socket.emit.mockImplementation(() => { throw new Error('Socket error'); });

      expect(() => observer.onNuevoMensajeGrupo(crearMensajeMock())).not.toThrow();
      expect(() => observer.onReaccionAgregada(crearReaccionMock())).not.toThrow();
      expect(() => observer.onReaccionRemovida({ mensajeId: 'm1', usuarioId: 'u1', emoji: '👍' })).not.toThrow();
      expect(() => observer.onMencionar({ mensajeId: 'm1', usuarioMencionadoId: 'u2', usuarioMencionado: { id: 'u2' } as any, createdAt: new Date() })).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSocketId', () => {
    it('retorna el id del socket', () => {
      expect(observer.getSocketId()).toBe('socket-web-1');
    });
  });

  describe('getGrupoId', () => {
    it('retorna el id del grupo', () => {
      expect(observer.getGrupoId()).toBe('grupo-1');
    });
  });
});
