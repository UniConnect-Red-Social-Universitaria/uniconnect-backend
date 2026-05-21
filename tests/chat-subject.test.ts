/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { ChatSubject } from '../src/modules/messages/domain/chat-subject';
import { IChatObserver } from '../src/modules/messages/domain/contracts';

function crearMockObserver(nombre = 'obs1'): jest.Mocked<IChatObserver> {
  return {
    onNuevoMensajeGrupo: jest.fn(),
    onReaccionAgregada: jest.fn(),
    onReaccionRemovida: jest.fn(),
    onMencionar: jest.fn(),
  };
}

describe('ChatSubject', () => {
  let subject: ChatSubject;

  beforeEach(() => {
    subject = ChatSubject.getInstance();
    subject.limpiar();
  });

  describe('Singleton', () => {
    it('getInstance devuelve siempre la misma instancia', () => {
      const a = ChatSubject.getInstance();
      const b = ChatSubject.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('suscribir', () => {
    it('agrega un observer a un grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);

      expect(subject.contarSuscriptores('grupo-1')).toBe(1);
    });

    it('permite multiples observers en el mismo grupo', () => {
      const obs1 = crearMockObserver();
      const obs2 = crearMockObserver();

      subject.suscribir('grupo-1', obs1);
      subject.suscribir('grupo-1', obs2);

      expect(subject.contarSuscriptores('grupo-1')).toBe(2);
    });

    it('no duplica el mismo observer en el mismo grupo (Set)', () => {
      const obs = crearMockObserver();

      subject.suscribir('grupo-1', obs);
      subject.suscribir('grupo-1', obs);

      expect(subject.contarSuscriptores('grupo-1')).toBe(1);
    });

    it('grupos distintos son independientes', () => {
      const obs1 = crearMockObserver();
      const obs2 = crearMockObserver();

      subject.suscribir('grupo-1', obs1);
      subject.suscribir('grupo-2', obs2);

      expect(subject.contarSuscriptores('grupo-1')).toBe(1);
      expect(subject.contarSuscriptores('grupo-2')).toBe(1);
    });
  });

  describe('desuscribir', () => {
    it('remueve un observer del grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);
      subject.desuscribir('grupo-1', obs);

      expect(subject.contarSuscriptores('grupo-1')).toBe(0);
    });

    it('elimina la entrada del Map si era el ultimo observer', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);
      subject.desuscribir('grupo-1', obs);

      expect(subject.contarGruposActivos()).toBe(0);
    });

    it('no falla si el grupo no existe', () => {
      const obs = crearMockObserver();
      expect(() => subject.desuscribir('grupo-inexistente', obs)).not.toThrow();
    });

    it('no falla si el observer no esta en el grupo', () => {
      const obs1 = crearMockObserver();
      const obs2 = crearMockObserver();
      subject.suscribir('grupo-1', obs1);

      expect(() => subject.desuscribir('grupo-1', obs2)).not.toThrow();
    });
  });

  describe('desuscribirDeTodos', () => {
    it('remueve al observer de todos los grupos', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);
      subject.suscribir('grupo-2', obs);

      subject.desuscribirDeTodos(obs);

      expect(subject.contarSuscriptores('grupo-1')).toBe(0);
      expect(subject.contarSuscriptores('grupo-2')).toBe(0);
    });

    it('no afecta a otros observers', () => {
      const obsRemover = crearMockObserver('remover');
      const obsMantener = crearMockObserver('mantener');

      subject.suscribir('grupo-1', obsRemover);
      subject.suscribir('grupo-1', obsMantener);

      subject.desuscribirDeTodos(obsRemover);

      expect(subject.contarSuscriptores('grupo-1')).toBe(1);
    });

    it('no falla si el observer no esta en ningun grupo', () => {
      const obs = crearMockObserver();
      expect(() => subject.desuscribirDeTodos(obs)).not.toThrow();
    });

    it('no afecta a grupos donde el observer no esta suscrito', () => {
      const obs = crearMockObserver();
      const otroObs = crearMockObserver();

      subject.suscribir('grupo-1', obs);
      subject.suscribir('grupo-2', otroObs);

      subject.desuscribirDeTodos(obs);

      expect(subject.contarSuscriptores('grupo-2')).toBe(1);
      expect(otroObs.onNuevoMensajeGrupo).not.toHaveBeenCalled();
    });
  });

  describe('emitirNuevoMensaje', () => {
    it('notifica a todos los observers del grupo', () => {
      const obs1 = crearMockObserver();
      const obs2 = crearMockObserver();
      subject.suscribir('grupo-1', obs1);
      subject.suscribir('grupo-1', obs2);

      const mensaje = { id: 'msg-1' } as any;
      subject.emitirNuevoMensaje('grupo-1', mensaje);

      expect(obs1.onNuevoMensajeGrupo).toHaveBeenCalledWith(mensaje);
      expect(obs2.onNuevoMensajeGrupo).toHaveBeenCalledWith(mensaje);
    });

    it('no falla si no hay suscriptores en el grupo', () => {
      expect(() => subject.emitirNuevoMensaje('grupo-vacio', {} as any)).not.toThrow();
    });
  });

  describe('emitirReaccionAgregada', () => {
    it('notifica a todos los observers del grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);

      const reaccion = { mensajeId: 'msg-1', emoji: '👍' } as any;
      subject.emitirReaccionAgregada('grupo-1', reaccion);

      expect(obs.onReaccionAgregada).toHaveBeenCalledWith(reaccion);
    });

    it('no falla si no hay suscriptores', () => {
      expect(() => subject.emitirReaccionAgregada('grupo-vacio', {} as any)).not.toThrow();
    });
  });

  describe('emitirReaccionRemovida', () => {
    it('notifica a todos los observers del grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);

      const data = { mensajeId: 'msg-1', usuarioId: 'user-1', emoji: '👍' };
      subject.emitirReaccionRemovida('grupo-1', data);

      expect(obs.onReaccionRemovida).toHaveBeenCalledWith(data);
    });

    it('no falla si no hay suscriptores', () => {
      expect(() => subject.emitirReaccionRemovida('grupo-vacio', {} as any)).not.toThrow();
    });
  });

  describe('emitirMencionar', () => {
    it('notifica a todos los observers del grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);

      const mencion = { mensajeId: 'msg-1', usuarioMencionadoId: 'user-2' } as any;
      subject.emitirMencionar('grupo-1', mencion);

      expect(obs.onMencionar).toHaveBeenCalledWith(mencion);
    });

    it('no falla si no hay suscriptores', () => {
      expect(() => subject.emitirMencionar('grupo-vacio', {} as any)).not.toThrow();
    });
  });

  describe('Manejo de errores en observers', () => {
    it('error en un observer no interrumpe a los demas (emitirNuevoMensaje)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obsFalla = crearMockObserver();
      obsFalla.onNuevoMensajeGrupo.mockImplementation(() => { throw new Error('Fallo'); });
      const obsExitoso = crearMockObserver();

      subject.suscribir('grupo-1', obsFalla);
      subject.suscribir('grupo-1', obsExitoso);

      expect(() => subject.emitirNuevoMensaje('grupo-1', {} as any)).not.toThrow();
      expect(obsExitoso.onNuevoMensajeGrupo).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('error en observer de reaccion agregada no interrumpe a los demas', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obsFalla = crearMockObserver();
      obsFalla.onReaccionAgregada.mockImplementation(() => { throw new Error('Fallo'); });
      const obsExitoso = crearMockObserver();

      subject.suscribir('grupo-1', obsFalla);
      subject.suscribir('grupo-1', obsExitoso);

      expect(() => subject.emitirReaccionAgregada('grupo-1', {} as any)).not.toThrow();
      expect(obsExitoso.onReaccionAgregada).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('error en observer de reaccion removida no interrumpe a los demas', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obsFalla = crearMockObserver();
      obsFalla.onReaccionRemovida.mockImplementation(() => { throw new Error('Fallo'); });
      const obsExitoso = crearMockObserver();

      subject.suscribir('grupo-1', obsFalla);
      subject.suscribir('grupo-1', obsExitoso);

      expect(() => subject.emitirReaccionRemovida('grupo-1', {} as any)).not.toThrow();
      expect(obsExitoso.onReaccionRemovida).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('error en observer de mencion no interrumpe a los demas', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const obsFalla = crearMockObserver();
      obsFalla.onMencionar.mockImplementation(() => { throw new Error('Fallo'); });
      const obsExitoso = crearMockObserver();

      subject.suscribir('grupo-1', obsFalla);
      subject.suscribir('grupo-1', obsExitoso);

      expect(() => subject.emitirMencionar('grupo-1', {} as any)).not.toThrow();
      expect(obsExitoso.onMencionar).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('contarSuscriptores', () => {
    it('retorna 0 para grupo sin suscriptores', () => {
      expect(subject.contarSuscriptores('grupo-vacio')).toBe(0);
    });

    it('refleja cambios tras suscribir y desuscribir', () => {
      const obs = crearMockObserver();
      expect(subject.contarSuscriptores('grupo-1')).toBe(0);

      subject.suscribir('grupo-1', obs);
      expect(subject.contarSuscriptores('grupo-1')).toBe(1);

      subject.desuscribir('grupo-1', obs);
      expect(subject.contarSuscriptores('grupo-1')).toBe(0);
    });
  });

  describe('contarGruposActivos', () => {
    it('retorna 0 cuando no hay grupos', () => {
      expect(subject.contarGruposActivos()).toBe(0);
    });

    it('retorna cantidad de grupos con al menos un observer', () => {
      subject.suscribir('grupo-1', crearMockObserver());
      subject.suscribir('grupo-2', crearMockObserver());

      expect(subject.contarGruposActivos()).toBe(2);
    });

    it('decrementa al desuscribir el ultimo observer de un grupo', () => {
      const obs = crearMockObserver();
      subject.suscribir('grupo-1', obs);
      expect(subject.contarGruposActivos()).toBe(1);

      subject.desuscribir('grupo-1', obs);
      expect(subject.contarGruposActivos()).toBe(0);
    });
  });

  describe('limpiar', () => {
    it('limpia todos los suscriptores', () => {
      subject.suscribir('grupo-1', crearMockObserver());
      subject.suscribir('grupo-2', crearMockObserver());

      subject.limpiar();

      expect(subject.contarGruposActivos()).toBe(0);
      expect(subject.contarSuscriptores('grupo-1')).toBe(0);
    });
  });
});
