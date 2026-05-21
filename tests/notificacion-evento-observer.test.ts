/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { NotificacionService } from '../src/modules/notifications/application/NotificacionService';
import { NotificacionEventoObserver } from '../src/modules/notifications/infrastructure/NotificacionEventoObserver';
import { EventRecord, CategoriaEvento } from '../src/domain/contracts';

const mockNotificar = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/modules/notifications/application/NotificacionService', () => ({
  NotificacionService: jest.fn().mockImplementation(() => ({
    notificar: mockNotificar,
  })),
}));

function crearEventoMock(categoria: CategoriaEvento, titulo = 'Evento test'): EventRecord {
  return {
    id: 'evento-1',
    titulo,
    descripcion: 'Descripcion',
    lugar: 'Aula',
    fechaEvento: new Date('2026-06-01T10:00:00Z'),
    categoria,
    creadorId: 'user-1',
    createdAt: new Date(),
  };
}

describe('NotificacionEventoObserver', () => {
  let notificacionService: NotificacionService;
  let observer: NotificacionEventoObserver;

  beforeEach(() => {
    mockNotificar.mockClear();
    notificacionService = new NotificacionService();
    observer = new NotificacionEventoObserver('usuario-abc', notificacionService);
  });

  it('getUsuarioId retorna el id del usuario', () => {
    expect(observer.getUsuarioId()).toBe('usuario-abc');
  });

  it('onNuevoEvento llama a notificar con los datos correctos para categoria academico', () => {
    const evento = crearEventoMock('academico', 'Charla de IA');

    observer.onNuevoEvento(evento);

    expect(mockNotificar).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Nuevo evento: Charla de IA' }),
      'usuario-abc',
      'evento-academico',
    );
  });

  it('onNuevoEvento mapea categoria cultural a evento-cultural', () => {
    const evento = crearEventoMock('cultural', 'Concierto');

    observer.onNuevoEvento(evento);

    expect(mockNotificar).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'evento-cultural',
    );
  });

  it('onNuevoEvento mapea categoria deportivo a evento-deportivo', () => {
    const evento = crearEventoMock('deportivo', 'Partido');

    observer.onNuevoEvento(evento);

    expect(mockNotificar).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'evento-deportivo',
    );
  });

  it('onNuevoEvento usa evento-otro para categoria desconocida', () => {
    const evento = crearEventoMock('otro', 'Otro evento');

    observer.onNuevoEvento(evento);

    expect(mockNotificar).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'evento-otro',
    );
  });

  it('onNuevoEvento usa evento-otro como fallback para categoria no mapeada', () => {
    const evento = crearEventoMock('sin-mapeo' as CategoriaEvento, 'Evento raro');

    observer.onNuevoEvento(evento);

    expect(mockNotificar).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'evento-otro',
    );
  });

  it('error en notificar no propaga al caller', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockNotificar.mockRejectedValueOnce(new Error('Fallo en BD'));

    const evento = crearEventoMock('academico');
    expect(() => observer.onNuevoEvento(evento)).not.toThrow();

    consoleErrorSpy.mockRestore();
  });
});
