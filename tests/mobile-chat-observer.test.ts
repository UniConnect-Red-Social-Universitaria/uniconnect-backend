/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { MobileChatObserver } from '../src/modules/messages/infrastructure/mobile-chat-observer';
import { GroupMessageRecord, ReaccionMensajeGrupoRecord, MencionMensajeGrupoRecord } from '../src/domain/contracts';

function crearMockSocket() {
  return { id: 'socket-mobile-1', emit: jest.fn() } as any;
}

function crearMensajeMock(): GroupMessageRecord {
  return {
    id: 'msg-2',
    grupoId: 'grupo-1',
    emisorId: 'user-1',
    emisorNombre: 'Maria',
    contenido: 'Hola desde mobile',
    tipo: 'TEXTO',
    adjuntos: [],
    createdAt: new Date(),
  } as any;
}

function crearReaccionMock(): ReaccionMensajeGrupoRecord {
  return {
    mensajeId: 'msg-2',
    emoji: '❤️',
    usuarioId: 'user-3',
    usuario: { id: 'user-3', nombre: 'Luis', apellido: 'Perez' },
    createdAt: new Date(),
  } as any;
}

describe('MobileChatObserver', () => {
  let socket: ReturnType<typeof crearMockSocket>;
  let observer: MobileChatObserver;

  beforeEach(() => {
    socket = crearMockSocket();
    observer = new MobileChatObserver(socket, 'grupo-1');
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
      const data = { mensajeId: 'msg-2', usuarioId: 'user-3', emoji: '❤️' };
      observer.onReaccionRemovida(data);

      expect(socket.emit).toHaveBeenCalledWith('grupo:reaccion:removida', data);
    });
  });

  describe('onMencionar', () => {
    it('emite evento grupo:mention con datos correctos', () => {
      const mencion: MencionMensajeGrupoRecord = {
        mensajeId: 'msg-2',
        usuarioMencionadoId: 'user-4',
        usuarioMencionado: { id: 'user-4', nombre: 'Sofia', apellido: 'Diaz' },
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
      expect(() => observer.onReaccionRemovida({ mensajeId: 'm2', usuarioId: 'u3', emoji: '❤️' })).not.toThrow();
      expect(() => observer.onMencionar({ mensajeId: 'm2', usuarioMencionadoId: 'u4', usuarioMencionado: { id: 'u4' } as any, createdAt: new Date() })).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSocketId', () => {
    it('retorna el id del socket', () => {
      expect(observer.getSocketId()).toBe('socket-mobile-1');
    });
  });

  describe('getGrupoId', () => {
    it('retorna el id del grupo', () => {
      expect(observer.getGrupoId()).toBe('grupo-1');
    });
  });
});
