/// <reference types="jest" />

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotificacionService } from '../src/modules/notifications/application/NotificacionService';
import { INotificacionStrategy, ResultadoEnvio } from '../src/modules/notifications/domain/INotificacionStrategy';
import { InMemoryPreferenciaRepository } from '../src/modules/notifications/infrastructure/InMemoryPreferenciaRepository';
import { InAppWebSocketStrategy } from '../src/modules/notifications/infrastructure/strategies/InAppWebSocketStrategy';
import { EmailInstitucionalStrategy } from '../src/modules/notifications/infrastructure/strategies/EmailInstitucionalStrategy';
import { PushMovilStrategy } from '../src/modules/notifications/infrastructure/strategies/PushMovilStrategy';
import { ResumenDiarioStrategy } from '../src/modules/notifications/infrastructure/strategies/ResumenDiarioStrategy';
import { NotificacionDTO } from '../src/shared/notificacion/INotificacion';
import { CanalNotificacion } from '../src/modules/notifications/domain/contracts';

// ── Stub para evitar la dependencia de socket.io en tests ──
jest.mock('../src/lib/socket', () => ({
  emitirNotificacion: jest.fn(),
}));

// ── Stub para evitar la dependencia del logger ──
jest.mock('../src/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const NOTIFICACION: NotificacionDTO = {
  mensaje: 'Nuevo evento académico disponible',
  destinatario: 'usuario-abc',
  timestamp: new Date('2024-06-01T10:00:00Z'),
};

// ──────────────────────────────────────────────────────────────────
// 1. Interfaz INotificacionStrategy
// ──────────────────────────────────────────────────────────────────
describe('INotificacionStrategy — contrato de interfaz', () => {
  it('InAppWebSocketStrategy expone el campo canal y el método enviar', () => {
    const s = new InAppWebSocketStrategy();
    expect(s.canal).toBe('in-app');
    expect(typeof s.enviar).toBe('function');
  });

  it('EmailInstitucionalStrategy expone canal "email"', () => {
    const s = new EmailInstitucionalStrategy();
    expect(s.canal).toBe('email');
    expect(typeof s.enviar).toBe('function');
  });

  it('PushMovilStrategy expone canal "push"', () => {
    const s = new PushMovilStrategy();
    expect(s.canal).toBe('push');
    expect(typeof s.enviar).toBe('function');
  });

  it('ResumenDiarioStrategy expone canal "resumen-diario"', () => {
    const s = new ResumenDiarioStrategy();
    expect(s.canal).toBe('resumen-diario');
    expect(typeof s.enviar).toBe('function');
  });
});

// ──────────────────────────────────────────────────────────────────
// 2. Estrategias concretas — retornan ResultadoEnvio correcto
// ──────────────────────────────────────────────────────────────────
describe('Estrategias concretas — enviar()', () => {
  it('InAppWebSocketStrategy retorna exito: true', async () => {
    const resultado = await new InAppWebSocketStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'in-app', exito: true });
  });

  it('EmailInstitucionalStrategy retorna exito: true', async () => {
    const resultado = await new EmailInstitucionalStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'email', exito: true });
  });

  it('PushMovilStrategy retorna exito: true', async () => {
    const resultado = await new PushMovilStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'push', exito: true });
  });

  it('ResumenDiarioStrategy retorna exito: true', async () => {
    const resultado = await new ResumenDiarioStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'resumen-diario', exito: true });
  });
});

// ──────────────────────────────────────────────────────────────────
// 3. NotificacionService recibe estrategias por inyección de dependencias
// ──────────────────────────────────────────────────────────────────
describe('NotificacionService — inyección de dependencias', () => {
  it('no instancia estrategias internamente; las recibe como parámetro', () => {
    const estrategiaMock: INotificacionStrategy = {
      canal: 'mock',
      enviar: jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'mock', exito: true }),
    };
    const repo = new InMemoryPreferenciaRepository();
    const service = new NotificacionService([estrategiaMock], repo);

    expect(service).toBeInstanceOf(NotificacionService);
  });

  it('ejecuta todas las estrategias cuyos canales están activos', async () => {
    const enviarA = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'a', exito: true });
    const enviarB = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'b', exito: true });

    const estrategiaA: INotificacionStrategy = { canal: 'in-app', enviar: enviarA };
    const estrategiaB: INotificacionStrategy = { canal: 'email', enviar: enviarB };

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u1', 'academico', ['in-app', 'email']);

    const service = new NotificacionService([estrategiaA, estrategiaB], repo);
    await service.notificar(NOTIFICACION, 'u1', 'academico');

    expect(enviarA).toHaveBeenCalledTimes(1);
    expect(enviarB).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// 4. Preferencias de canal por tipo de evento
// ──────────────────────────────────────────────────────────────────
describe('Preferencias de canal por tipo de evento', () => {
  it('solo ejecuta los canales activos para ese tipo de evento', async () => {
    const enviarInApp = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'in-app', exito: true });
    const enviarEmail = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'email', exito: true });

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: enviarInApp },
      { canal: 'email', enviar: enviarEmail },
    ];

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u2', 'cultural', ['in-app'] as CanalNotificacion[]);

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u2', 'cultural');

    expect(resultados).toHaveLength(1);
    expect(resultados[0].canal).toBe('in-app');
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it('sin canales activos no ejecuta ninguna estrategia', async () => {
    const enviar = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'push', exito: true });
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u3', 'deportivo', [] as CanalNotificacion[]);

    const service = new NotificacionService(
      [{ canal: 'push', enviar }],
      repo,
    );
    const resultados = await service.notificar(NOTIFICACION, 'u3', 'deportivo');

    expect(resultados).toHaveLength(0);
    expect(enviar).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────
// 5. Aislamiento de errores — una estrategia falla, las demás siguen
// ──────────────────────────────────────────────────────────────────
describe('Aislamiento de errores entre estrategias', () => {
  it('si una estrategia lanza, el error queda aislado y las demás continúan', async () => {
    const enviarOk = jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'email', exito: true });
    const enviarFalla = jest.fn<() => Promise<ResultadoEnvio>>().mockRejectedValue(new Error('Fallo de red'));

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: enviarFalla },
      { canal: 'email', enviar: enviarOk },
    ];

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u4', 'academico', ['in-app', 'email']);

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u4', 'academico');

    expect(resultados).toHaveLength(2);

    const fallido = resultados.find((r) => r.canal === 'in-app');
    expect(fallido).toEqual({ canal: 'in-app', exito: false, error: 'Fallo de red' });

    const exitoso = resultados.find((r) => r.canal === 'email');
    expect(exitoso).toEqual({ canal: 'email', exito: true });
  });

  it('múltiples estrategias fallidas quedan todas aisladas', async () => {
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u5', 'otro', ['in-app', 'email', 'push']);

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: jest.fn<() => Promise<ResultadoEnvio>>().mockRejectedValue(new Error('E1')) },
      { canal: 'email', enviar: jest.fn<() => Promise<ResultadoEnvio>>().mockRejectedValue(new Error('E2')) },
      { canal: 'push', enviar: jest.fn<() => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'push', exito: true }) },
    ];

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u5', 'otro');

    expect(resultados).toHaveLength(3);
    expect(resultados.filter((r) => !r.exito)).toHaveLength(2);
    expect(resultados.find((r) => r.canal === 'push')?.exito).toBe(true);
  });

  it('maneja correctamente excepciones que no son instancias de Error', async () => {
    const enviarRaro = jest.fn<() => Promise<ResultadoEnvio>>().mockRejectedValue('Un string de error arrojado directamente');

    const repo = new InMemoryPreferenciaRepository();
    // Cambiamos 'sistema' por 'otro' (o cualquier CategoriaEvento válida)
    await repo.actualizarPreferencias('u99', 'otro', ['in-app']);

    const service = new NotificacionService([{ canal: 'in-app', enviar: enviarRaro }], repo);
    const resultados = await service.notificar(NOTIFICACION, 'u99', 'otro');

    expect(resultados[0].exito).toBe(false);
    expect(resultados[0].error).toBe('Error desconocido');
  });
});

// ──────────────────────────────────────────────────────────────────
// 6. Principio Open/Closed — ResumenDiarioStrategy se agrega sin
//    modificar NotificacionService ni las estrategias existentes
// ──────────────────────────────────────────────────────────────────
describe('Open/Closed — agregar ResumenDiarioStrategy sin modificar el servicio', () => {
  it('NotificacionService acepta ResumenDiarioStrategy como canal adicional', async () => {
    const resumen = new ResumenDiarioStrategy();
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u6', 'cultural', ['resumen-diario'] as CanalNotificacion[]);

    const service = new NotificacionService([resumen], repo);
    const resultados = await service.notificar(NOTIFICACION, 'u6', 'cultural');

    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toEqual({ canal: 'resumen-diario', exito: true });
  });

  it('mezcla de canales existentes + ResumenDiarioStrategy funciona sin cambios en el servicio', async () => {
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u7', 'academico', ['in-app', 'resumen-diario'] as CanalNotificacion[]);

    const service = new NotificacionService(
      [
        new InAppWebSocketStrategy(),
        new EmailInstitucionalStrategy(),
        new ResumenDiarioStrategy(),
      ],
      repo,
    );
    const resultados = await service.notificar(NOTIFICACION, 'u7', 'academico');

    expect(resultados).toHaveLength(2);
    expect(resultados.map((r) => r.canal).sort()).toEqual(['in-app', 'resumen-diario']);
  });
});

// ──────────────────────────────────────────────────────────────────
// 7. InMemoryPreferenciaRepository
// ──────────────────────────────────────────────────────────────────
describe('InMemoryPreferenciaRepository', () => {
  let repo: InMemoryPreferenciaRepository;

  beforeEach(() => {
    repo = new InMemoryPreferenciaRepository();
  });

  it('retorna canales por defecto cuando no hay preferencias guardadas', async () => {
    const prefs = await repo.obtenerPreferencias('nuevo-usuario', 'academico');
    expect(prefs.canalesActivos).toContain('in-app');
    expect(prefs.canalesActivos).toContain('email');
    expect(prefs.canalesActivos).toContain('push');
  });

  it('persiste y retorna preferencias actualizadas', async () => {
    await repo.actualizarPreferencias('u8', 'deportivo', ['push']);
    const prefs = await repo.obtenerPreferencias('u8', 'deportivo');
    expect(prefs.canalesActivos).toEqual(['push']);
  });

  it('cada usuario y tipo de evento tiene preferencias independientes', async () => {
    await repo.actualizarPreferencias('u9', 'cultural', ['email']);
    await repo.actualizarPreferencias('u9', 'deportivo', ['push']);

    const cultural = await repo.obtenerPreferencias('u9', 'cultural');
    const deportivo = await repo.obtenerPreferencias('u9', 'deportivo');

    expect(cultural.canalesActivos).toEqual(['email']);
    expect(deportivo.canalesActivos).toEqual(['push']);
  });
});

// ──────────────────────────────────────────────────────────────────
// Lógica interna de ResumenDiarioStrategy
// ──────────────────────────────────────────────────────────────────
describe('ResumenDiarioStrategy — Lógica de cola', () => {
  it('debe encolar notificaciones y vaciar la cola al llamar a flushResumen', async () => {
    const estrategia = new ResumenDiarioStrategy();

    // Enviamos dos notificaciones
    await estrategia.enviar(NOTIFICACION);
    await estrategia.enviar({ ...NOTIFICACION, mensaje: 'Otro mensaje' });

    // Accedemos a la propiedad privada 'cola' de forma insegura para el test
    // o verificamos el comportamiento indirectamente si no queremos romper el encapsulamiento.
    // En TypeScript/Jest podemos hacer un cast a 'any' para revisar el estado interno:
    expect((estrategia as any).cola).toHaveLength(2);

    estrategia.flushResumen();

    expect((estrategia as any).cola).toHaveLength(0);
  });
});

