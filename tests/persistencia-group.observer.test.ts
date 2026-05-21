/// <reference types="jest" />

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { PersistenciaGroupObserver } from '../src/modules/groups/infrastructure/persistencia-group.observer';

describe('PersistenciaGroupObserver', () => {
  let observer: PersistenciaGroupObserver;

  beforeEach(() => {
    observer = new PersistenciaGroupObserver();
  });

  describe('eventos que NO persisten (no-op)', () => {
    it('onSolicitudNueva no lanza error', () => {
      expect(() =>
        observer.onSolicitudNueva({
          solicitudId: 'sol-1',
          grupoId: 'grupo-1',
          grupoNombre: 'Grupo',
          administradorId: 'admin-1',
          solicitanteId: 'user-1',
          tipo: 'INGRESO',
          solicitanteNombre: 'Juan',
        }),
      ).not.toThrow();
    });

    it('onSolicitudResuelta no lanza error', () => {
      expect(() =>
        observer.onSolicitudResuelta({
          solicitudId: 'sol-1',
          grupoId: 'grupo-1',
          grupoNombre: 'Grupo',
          solicitanteId: 'user-1',
          estado: 'APROBADA',
        }),
      ).not.toThrow();
    });

    it('onAdminTransferido no lanza error', () => {
      expect(() =>
        observer.onAdminTransferido({
          grupoId: 'grupo-1',
          grupoNombre: 'Grupo',
          anteriorAdminId: 'admin-1',
          anteriorAdminNombre: 'Admin',
          nuevoAdminId: 'admin-2',
          nuevoAdminNombre: 'Nuevo',
        }),
      ).not.toThrow();
    });
  });

  describe('eventos que persisten (log)', () => {
    it('onTransferenciaPendiente llama a grupoEstadoLog.create', () => {
      const { prismaMock } = require('./setup/jest.setup');

      observer.onTransferenciaPendiente({
        grupoId: 'grupo-1',
        grupoNombre: 'Grupo Test',
        adminId: 'admin-1',
        candidatoId: 'cand-1',
        candidatoNombre: 'Candidato',
        nuevoEstado: 'PENDING_TRANSFER',
        // TODO: The interface expects a specific shape; just testing no-throw
      } as any);

      expect(prismaMock.grupoEstadoLog.create).toHaveBeenCalled();
    });

    it('onTransferenciaAceptada llama a grupoEstadoLog.create', () => {
      const { prismaMock } = require('./setup/jest.setup');

      observer.onTransferenciaAceptada({
        grupoId: 'grupo-1',
        grupoNombre: 'Grupo Test',
        anteriorAdminId: 'admin-1',
        nuevoAdminId: 'admin-2',
        nuevoAdminNombre: 'Nuevo Admin',
        nuevoEstado: 'TRANSFER_ACCEPTED',
      } as any);

      expect(prismaMock.grupoEstadoLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            grupoId: 'grupo-1',
            accion: 'TRANSFERENCIA_ACEPTADA',
          }),
        }),
      );
    });

    it('onTransferenciaRechazada llama a grupoEstadoLog.create', () => {
      const { prismaMock } = require('./setup/jest.setup');

      observer.onTransferenciaRechazada({
        grupoId: 'grupo-1',
        grupoNombre: 'Grupo Test',
        adminId: 'admin-1',
        candidatoId: 'cand-1',
        candidatoNombre: 'Candidato',
        nuevoEstado: 'TRANSFER_REJECTED',
      } as any);

      expect(prismaMock.grupoEstadoLog.create).toHaveBeenCalled();
    });

    it('onTransferenciaCancelada llama a grupoEstadoLog.create', () => {
      const { prismaMock } = require('./setup/jest.setup');

      observer.onTransferenciaCancelada({
        grupoId: 'grupo-1',
        grupoNombre: 'Grupo Test',
        adminId: 'admin-1',
        candidatoId: 'cand-1',
        nuevoEstado: 'CANCELLED',
      } as any);

      expect(prismaMock.grupoEstadoLog.create).toHaveBeenCalled();
    });
  });

  describe('manejo de errores y fallback', () => {
    it('error en prisma.create no propaga (catch silencioso)', () => {
      const { prismaMock } = require('./setup/jest.setup');
      prismaMock.grupoEstadoLog.create.mockRejectedValueOnce(new Error('DB error'));

      expect(() =>
        observer.onTransferenciaPendiente({
          grupoId: 'grupo-1',
          grupoNombre: 'Grupo',
          adminId: 'admin-1',
          candidatoId: 'cand-1',
          candidatoNombre: 'Candi',
          nuevoEstado: 'PENDING_TRANSFER',
        } as any),
      ).not.toThrow();
    });

    it('fallback a console.log cuando grupoEstadoLog no esta disponible', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { prismaMock } = require('./setup/jest.setup');

      const originalCreate = prismaMock.grupoEstadoLog.create;
      delete prismaMock.grupoEstadoLog.create;

      observer.onTransferenciaPendiente({
        grupoId: 'grupo-1',
        grupoNombre: 'Grupo',
        adminId: 'admin-1',
        candidatoId: 'cand-1',
        candidatoNombre: 'Candi',
        nuevoEstado: 'PENDING_TRANSFER',
      } as any);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PersistenciaGroupObserver]'),
      );

      prismaMock.grupoEstadoLog.create = originalCreate;
      consoleLogSpy.mockRestore();
    });
  });
});
