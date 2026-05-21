/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { SocketGroupObserver } from '../src/modules/groups/infrastructure/socket-group.observer';

jest.mock('../src/lib/socket', () => ({
  emitirSolicitudGrupoNueva: jest.fn(),
  emitirSolicitudGrupoResuelta: jest.fn(),
  emitirTransferenciaAdmin: jest.fn(),
  emitirTransferenciaPendiente: jest.fn(),
  emitirTransferenciaAceptada: jest.fn(),
  emitirTransferenciaRechazada: jest.fn(),
  emitirTransferenciaCancelada: jest.fn(),
}));

const mockSocket = jest.requireMock('../src/lib/socket') as jest.Mocked<typeof import('../src/lib/socket')>;

describe('SocketGroupObserver', () => {
  let observer: SocketGroupObserver;

  beforeEach(() => {
    observer = new SocketGroupObserver();
    Object.values(mockSocket).forEach((fn) => fn.mockClear());
  });

  it('onSolicitudNueva llama a emitirSolicitudGrupoNueva', () => {
    const payload = {
      solicitudId: 'sol-1',
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      administradorId: 'admin-1',
      solicitanteId: 'user-1',
      tipo: 'INGRESO' as const,
      solicitanteNombre: 'Juan',
      solicitanteApellido: 'Perez',
    };

    observer.onSolicitudNueva(payload);
    expect(mockSocket.emitirSolicitudGrupoNueva).toHaveBeenCalledWith(payload);
  });

  it('onSolicitudResuelta llama a emitirSolicitudGrupoResuelta', () => {
    const payload = {
      solicitudId: 'sol-1',
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      solicitanteId: 'user-1',
      estado: 'APROBADA' as const,
    };

    observer.onSolicitudResuelta(payload);
    expect(mockSocket.emitirSolicitudGrupoResuelta).toHaveBeenCalledWith(payload);
  });

  it('onAdminTransferido llama a emitirTransferenciaAdmin', () => {
    const payload = {
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      anteriorAdminId: 'admin-1',
      anteriorAdminNombre: 'Admin Anterior',
      nuevoAdminId: 'admin-2',
      nuevoAdminNombre: 'Nuevo Admin',
    };

    observer.onAdminTransferido(payload);
    expect(mockSocket.emitirTransferenciaAdmin).toHaveBeenCalledWith(payload);
  });

  it('onTransferenciaPendiente llama a emitirTransferenciaPendiente', () => {
    const payload = {
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      adminId: 'admin-1',
      candidatoId: 'cand-1',
      candidatoNombre: 'Candidato',
      nuevoEstado: 'PENDING_TRANSFER',
    };

    observer.onTransferenciaPendiente(payload);
    expect(mockSocket.emitirTransferenciaPendiente).toHaveBeenCalledWith(payload);
  });

  it('onTransferenciaAceptada llama a emitirTransferenciaAceptada', () => {
    const payload = {
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      anteriorAdminId: 'admin-1',
      nuevoAdminId: 'admin-2',
      nuevoAdminNombre: 'Nuevo Admin',
      nuevoEstado: 'TRANSFER_ACCEPTED',
    };

    observer.onTransferenciaAceptada(payload);
    expect(mockSocket.emitirTransferenciaAceptada).toHaveBeenCalledWith(payload);
  });

  it('onTransferenciaRechazada llama a emitirTransferenciaRechazada', () => {
    const payload = {
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      adminId: 'admin-1',
      candidatoId: 'cand-1',
      candidatoNombre: 'Candidato',
      nuevoEstado: 'TRANSFER_REJECTED',
    };

    observer.onTransferenciaRechazada(payload);
    expect(mockSocket.emitirTransferenciaRechazada).toHaveBeenCalledWith(payload);
  });

  it('onTransferenciaCancelada llama a emitirTransferenciaCancelada', () => {
    const payload = {
      grupoId: 'grupo-1',
      grupoNombre: 'Grupo Test',
      adminId: 'admin-1',
      candidatoId: 'cand-1',
      nuevoEstado: 'CANCELLED',
    };

    observer.onTransferenciaCancelada(payload);
    expect(mockSocket.emitirTransferenciaCancelada).toHaveBeenCalledWith(payload);
  });
});
