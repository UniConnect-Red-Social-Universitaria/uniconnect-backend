/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { NotificacionBase } from '../src/shared/notificacion/INotificacion';
import { NotificacionConPrioridad } from '../src/shared/notificacion/NotificacionConPrioridad';
import { NotificacionConAccion } from '../src/shared/notificacion/NotificacionConAccion';

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
