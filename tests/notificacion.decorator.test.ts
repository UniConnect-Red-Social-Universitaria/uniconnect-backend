/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { NotificacionBase } from '../src/shared/notificacion/INotificacion';
import { NotificacionConPrioridad } from '../src/shared/notificacion/NotificacionConPrioridad';
import { NotificacionConAccion } from '../src/shared/notificacion/NotificacionConAccion';
import { NotificacionConEncuesta } from '../src/shared/notificacion/NotificacionConEncuesta';
import { NotificacionDecorator } from '../src/shared/notificacion/NotificacionDecorator';

const TIMESTAMP = new Date('2024-01-15T10:00:00Z');

describe('NotificacionBase', () => {
  it('render() retorna mensaje, destinatario y timestamp', () => {
    const notificacion = new NotificacionBase('Hola', 'usuario-123', TIMESTAMP);

    expect(notificacion.render()).toEqual({
      mensaje: 'Hola',
      destinatario: 'usuario-123',
      timestamp: TIMESTAMP,
    });
  });

  it('getters devuelven los valores correctos', () => {
    const notificacion = new NotificacionBase('Mensaje', 'dest-456', TIMESTAMP);

    expect(notificacion.getMensaje()).toBe('Mensaje');
    expect(notificacion.getDestinatario()).toBe('dest-456');
    expect(notificacion.getTimestamp()).toBe(TIMESTAMP);
  });

  it('timestamp usa fecha actual cuando no se proporciona', () => {
    const antes = new Date();
    const notificacion = new NotificacionBase('Test', 'dest');
    const despues = new Date();

    const ts = notificacion.getTimestamp();
    expect(ts.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(despues.getTime());
  });
});

describe('NotificacionConPrioridad', () => {
  it('agrega nivel al resultado de render()', () => {
    const base = new NotificacionBase('Alerta', 'usuario-123', TIMESTAMP);
    const conPrioridad = new NotificacionConPrioridad(base, 'urgente');

    expect(conPrioridad.render()).toEqual({
      mensaje: 'Alerta',
      destinatario: 'usuario-123',
      timestamp: TIMESTAMP,
      nivel: 'urgente',
    });
  });

  it('delega getMensaje, getDestinatario y getTimestamp a la base', () => {
    const base = new NotificacionBase('Test', 'dest', TIMESTAMP);
    const conPrioridad = new NotificacionConPrioridad(base, 'critica');

    expect(conPrioridad.getMensaje()).toBe('Test');
    expect(conPrioridad.getDestinatario()).toBe('dest');
    expect(conPrioridad.getTimestamp()).toBe(TIMESTAMP);
  });

  it('soporta nivel critica', () => {
    const notificacion = new NotificacionConPrioridad(
      new NotificacionBase('Sistema caído', 'admin', TIMESTAMP),
      'critica',
    );

    expect(notificacion.render().nivel).toBe('critica');
  });

  it('soporta nivel normal', () => {
    const notificacion = new NotificacionConPrioridad(
      new NotificacionBase('Nuevo mensaje', 'usuario', TIMESTAMP),
      'normal',
    );

    expect(notificacion.render().nivel).toBe('normal');
  });
});

describe('NotificacionConAccion', () => {
  const accion = { label: 'Ver mensaje', endpoint: '/api/mensajes/conversacion/abc' };

  it('agrega accion al resultado de render()', () => {
    const base = new NotificacionBase('Tienes un mensaje', 'usuario-123', TIMESTAMP);
    const conAccion = new NotificacionConAccion(base, accion);

    expect(conAccion.render()).toEqual({
      mensaje: 'Tienes un mensaje',
      destinatario: 'usuario-123',
      timestamp: TIMESTAMP,
      accion,
    });
  });

  it('expone label y endpoint en accion', () => {
    const base = new NotificacionBase('Msg', 'dest', TIMESTAMP);
    const conAccion = new NotificacionConAccion(base, accion);
    const resultado = conAccion.render();

    expect(resultado.accion.label).toBe('Ver mensaje');
    expect(resultado.accion.endpoint).toBe('/api/mensajes/conversacion/abc');
  });
});

describe('NotificacionConEncuesta', () => {
  const encuesta = {
    encuestaId: 'enc-1',
    grupoId: 'grupo-1',
    pregunta: '¿Preferencia?',
    estado: 'OPEN' as const,
    totalOpciones: 3,
    autoCloseAt: new Date('2024-02-01T12:00:00Z'),
  };

  it('agrega encuesta al resultado de render()', () => {
    const base = new NotificacionBase('Vota ya', 'usuario-1', TIMESTAMP);
    const conEncuesta = new NotificacionConEncuesta(base, encuesta);

    expect(conEncuesta.render()).toEqual({
      mensaje: 'Vota ya',
      destinatario: 'usuario-1',
      timestamp: TIMESTAMP,
      encuesta,
    });
  });

  it('soporta autoCloseAt null', () => {
    const base = new NotificacionBase('Test', 'dest', TIMESTAMP);
    const sinFecha = { ...encuesta, autoCloseAt: null };
    const conEncuesta = new NotificacionConEncuesta(base, sinFecha);

    expect(conEncuesta.render().encuesta.autoCloseAt).toBeNull();
  });

  it('soporta estado CLOSED', () => {
    const base = new NotificacionBase('Cerrada', 'dest', TIMESTAMP);
    const cerrada = { ...encuesta, estado: 'CLOSED' as const };
    const conEncuesta = new NotificacionConEncuesta(base, cerrada);

    expect(conEncuesta.render().encuesta.estado).toBe('CLOSED');
  });

  it('delega getters al componente base', () => {
    const base = new NotificacionBase('Delegado', 'dest-xyz', TIMESTAMP);
    const conEncuesta = new NotificacionConEncuesta(base, encuesta);

    expect(conEncuesta.getMensaje()).toBe('Delegado');
    expect(conEncuesta.getDestinatario()).toBe('dest-xyz');
    expect(conEncuesta.getTimestamp()).toBe(TIMESTAMP);
  });
});

describe('NotificacionDecorator (abstracto)', () => {
  it('render() delega al componente envuelto via super', () => {
    const base = new NotificacionBase('Abstracto', 'dest-abs', TIMESTAMP);
    const decorador = new (class extends NotificacionDecorator {
      render() { return super.render(); }
    })(base);

    expect(decorador.render()).toEqual(base.render());
  });
});

describe('Composicion de decoradores', () => {
  it('NotificacionConPrioridad + NotificacionConAccion incluye nivel y accion', () => {
    const accion = { label: 'Abrir grupo', endpoint: '/api/grupos/xyz/mensajes' };

    const notificacion = new NotificacionConAccion(
      new NotificacionConPrioridad(
        new NotificacionBase('Nuevo mensaje en el grupo', 'grupo-xyz', TIMESTAMP),
        'urgente',
      ),
      accion,
    );

    expect(notificacion.render()).toEqual({
      mensaje: 'Nuevo mensaje en el grupo',
      destinatario: 'grupo-xyz',
      timestamp: TIMESTAMP,
      nivel: 'urgente',
      accion,
    });
  });

  it('el orden de decoradores no afecta los campos finales', () => {
    const base = new NotificacionBase('Test', 'dest', TIMESTAMP);
    const accion = { label: 'Ver', endpoint: '/api/test' };

    const opcion1 = new NotificacionConAccion(
      new NotificacionConPrioridad(base, 'critica'),
      accion,
    );

    const opcion2 = new NotificacionConPrioridad(
      new NotificacionConAccion(base, accion),
      'critica',
    );

    expect(opcion1.render()).toEqual(opcion2.render());
  });
});

describe('Validacion de responsabilidades del Decorator', () => {
  it('NotificacionConPrioridad añade nivel SIN romper comportamiento base', () => {
    const base = new NotificacionBase('Alerta critica', 'admin', TIMESTAMP);
    const conPrioridad = new NotificacionConPrioridad(base, 'critica');

    // Verificar que el comportamiento base se mantiene intacto
    const renderBase = base.render();
    const renderDecorado = conPrioridad.render();

    expect(renderDecorado.mensaje).toBe(renderBase.mensaje);
    expect(renderDecorado.destinatario).toBe(renderBase.destinatario);
    expect(renderDecorado.timestamp).toBe(renderBase.timestamp);

    // Verificar que SOLO se añadió el nivel
    expect(renderDecorado).toHaveProperty('nivel', 'critica');
    expect(Object.keys(renderDecorado)).toContain('nivel');
  });

  it('NotificacionConAccion añade accion SIN romper comportamiento base', () => {
    const base = new NotificacionBase('Tienes un mensaje', 'usuario-456', TIMESTAMP);
    const accion = { label: 'Leer', endpoint: '/api/mensajes/123' };
    const conAccion = new NotificacionConAccion(base, accion);

    // Verificar que el comportamiento base se mantiene intacto
    const renderBase = base.render();
    const renderDecorado = conAccion.render();

    expect(renderDecorado.mensaje).toBe(renderBase.mensaje);
    expect(renderDecorado.destinatario).toBe(renderBase.destinatario);
    expect(renderDecorado.timestamp).toBe(renderBase.timestamp);

    // Verificar que SOLO se añadió la accion
    expect(renderDecorado).toHaveProperty('accion', accion);
    expect(Object.keys(renderDecorado)).toContain('accion');
  });

  it('multiples decoradores en cadena mantienen el comportamiento base intacto', () => {
    const base = new NotificacionBase('Evento importante', 'grupo-789', TIMESTAMP);
    const accion = { label: 'Detalles', endpoint: '/api/eventos/456' };

    const decorada = new NotificacionConAccion(
      new NotificacionConPrioridad(base, 'alta'),
      accion,
    );

    const renderBase = base.render();
    const renderDecorada = decorada.render();

    // Campos base deben ser idénticos
    expect(renderDecorada.mensaje).toBe(renderBase.mensaje);
    expect(renderDecorada.destinatario).toBe(renderBase.destinatario);
    expect(renderDecorada.timestamp).toBe(renderBase.timestamp);

    // Campos añadidos por decoradores
    expect(renderDecorada.nivel).toBe('alta');
    expect(renderDecorada.accion).toEqual(accion);
  });

  it('los getters del decorador delegan correctamente al base sin modificar', () => {
    const base = new NotificacionBase('Test mensaje', 'test-dest', TIMESTAMP);
    const conPrioridad = new NotificacionConPrioridad(base, 'normal');
    const conAccion = new NotificacionConAccion(conPrioridad, { label: 'Go', endpoint: '/test' });

    expect(conAccion.getMensaje()).toBe('Test mensaje');
    expect(conAccion.getDestinatario()).toBe('test-dest');
    expect(conAccion.getTimestamp()).toBe(TIMESTAMP);

    // Verificar que los valores no han sido modificados
    expect(conAccion.getMensaje()).toBe(base.getMensaje());
    expect(conAccion.getDestinatario()).toBe(base.getDestinatario());
  });

  it('cada decorador es independiente y no interfiere con otros', () => {
    const base1 = new NotificacionBase('Msg1', 'dest1', TIMESTAMP);
    const base2 = new NotificacionBase('Msg2', 'dest2', TIMESTAMP);

    const dec1 = new NotificacionConPrioridad(base1, 'urgente');
    const dec2 = new NotificacionConAccion(base2, { label: 'Ver', endpoint: '/api/test' });

    expect(dec1.render()).toHaveProperty('nivel');
    expect(dec1.render()).not.toHaveProperty('accion');

    expect(dec2.render()).toHaveProperty('accion');
    expect(dec2.render()).not.toHaveProperty('nivel');
  });
});
