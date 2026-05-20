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
import { CanalNotificacion, TipoNotificacion } from '../src/modules/notifications/domain/contracts';
import type { Transporter, SentMessageInfo } from 'nodemailer';

jest.mock('../src/lib/socket', () => ({
  emitirNotificacion: jest.fn(),
}));

jest.mock('../src/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const NOTIFICACION: NotificacionDTO = {
  mensaje: 'Nuevo evento académico disponible',
  destinatario: 'usuario-abc',
  timestamp: new Date('2024-06-01T10:00:00Z'),
};

const TIPO_ACADEMICO: TipoNotificacion  = 'evento-academico';
const TIPO_CULTURAL: TipoNotificacion   = 'evento-cultural';
const TIPO_DEPORTIVO: TipoNotificacion  = 'evento-deportivo';
const TIPO_OTRO: TipoNotificacion       = 'evento-otro';

// ── Interfaz local para el repositorio de usuario ──
interface IUsuarioRepository {
  obtenerEmailPorId(usuarioId: string): Promise<string | null>;
}

// ── Mock del transporter: se castea como Transporter pero solo implementa sendMail ──
const sendMailMock = jest.fn<() => Promise<SentMessageInfo>>()
  .mockResolvedValue({ messageId: 'test-id-123' } as SentMessageInfo);

const mockTransporter = {
  sendMail: sendMailMock,
} as unknown as Transporter;

// ── Mock del repositorio de usuario con tipo explícito ──
const obtenerEmailMock = jest.fn<() => Promise<string | null>>()
  .mockResolvedValue('test@ucaldas.edu.co');

const mockUsuarioRepository: IUsuarioRepository = {
  obtenerEmailPorId: obtenerEmailMock,
};

const makeEmailStrategy = () =>
  new EmailInstitucionalStrategy(mockTransporter, mockUsuarioRepository);

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
    const s = makeEmailStrategy();
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
  beforeEach(() => {
    jest.clearAllMocks();
    sendMailMock.mockResolvedValue({ messageId: 'test-id-123' } as SentMessageInfo);
    obtenerEmailMock.mockResolvedValue('test@ucaldas.edu.co');
  });

  it('InAppWebSocketStrategy retorna exito: true', async () => {
    const resultado = await new InAppWebSocketStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'in-app', exito: true });
  });

  it('EmailInstitucionalStrategy retorna exito: true', async () => {
    const resultado = await makeEmailStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'email', exito: true });
  });

  it('EmailInstitucionalStrategy retorna exito: false si el usuario no tiene email', async () => {
    obtenerEmailMock.mockResolvedValue(null);
    const resultado = await makeEmailStrategy().enviar(NOTIFICACION);
    expect(resultado.exito).toBe(false);
    expect(resultado.canal).toBe('email');
  });

  it('EmailInstitucionalStrategy retorna exito: false si el transporter falla', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP caído') as never);
    const resultado = await makeEmailStrategy().enviar(NOTIFICACION);
    expect(resultado).toEqual({ canal: 'email', exito: false, error: 'SMTP caído' });
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
// 3. NotificacionService — inyección de dependencias
// ──────────────────────────────────────────────────────────────────
describe('NotificacionService — inyección de dependencias', () => {
  it('no instancia estrategias internamente; las recibe como parámetro', () => {
    const estrategiaMock: INotificacionStrategy = {
      canal: 'mock',
      enviar: jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
        .mockResolvedValue({ canal: 'mock', exito: true }),
    };
    const repo = new InMemoryPreferenciaRepository();
    const service = new NotificacionService([estrategiaMock], repo);
    expect(service).toBeInstanceOf(NotificacionService);
  });

  it('ejecuta todas las estrategias cuyos canales están activos', async () => {
    const enviarA = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'in-app', exito: true });
    const enviarB = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'email', exito: true });

    const estrategiaA: INotificacionStrategy = { canal: 'in-app', enviar: enviarA };
    const estrategiaB: INotificacionStrategy = { canal: 'email',  enviar: enviarB };

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u1', TIPO_ACADEMICO, ['in-app', 'email']);

    const service = new NotificacionService([estrategiaA, estrategiaB], repo);
    await service.notificar(NOTIFICACION, 'u1', TIPO_ACADEMICO);

    expect(enviarA).toHaveBeenCalledTimes(1);
    expect(enviarB).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// 4. Preferencias de canal por tipo de evento
// ──────────────────────────────────────────────────────────────────
describe('Preferencias de canal por tipo de evento', () => {
  it('solo ejecuta los canales activos para ese tipo de evento', async () => {
    const enviarInApp = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'in-app', exito: true });
    const enviarEmail = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'email', exito: true });

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: enviarInApp },
      { canal: 'email',  enviar: enviarEmail },
    ];

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u2', TIPO_CULTURAL, ['in-app'] as CanalNotificacion[]);

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u2', TIPO_CULTURAL);

    expect(resultados).toHaveLength(1);
    expect(resultados[0].canal).toBe('in-app');
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it('sin canales activos no ejecuta ninguna estrategia', async () => {
    const enviar = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'push', exito: true });
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u3', TIPO_DEPORTIVO, [] as CanalNotificacion[]);

    const service = new NotificacionService([{ canal: 'push', enviar }], repo);
    const resultados = await service.notificar(NOTIFICACION, 'u3', TIPO_DEPORTIVO);

    expect(resultados).toHaveLength(0);
    expect(enviar).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────
// 5. Aislamiento de errores
// ──────────────────────────────────────────────────────────────────
describe('Aislamiento de errores entre estrategias', () => {
  it('si una estrategia lanza, el error queda aislado y las demás continúan', async () => {
    const enviarOk = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockResolvedValue({ canal: 'email', exito: true });
    const enviarFalla = jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>()
      .mockRejectedValue(new Error('Fallo de red') as never);

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: enviarFalla },
      { canal: 'email',  enviar: enviarOk },
    ];

    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u4', TIPO_ACADEMICO, ['in-app', 'email']);

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u4', TIPO_ACADEMICO);

    expect(resultados).toHaveLength(2);
    expect(resultados.find((r) => r.canal === 'in-app')).toEqual({ canal: 'in-app', exito: false, error: 'Fallo de red' });
    expect(resultados.find((r) => r.canal === 'email')).toEqual({ canal: 'email', exito: true });
  });

  it('múltiples estrategias fallidas quedan todas aisladas', async () => {
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u5', TIPO_OTRO, ['in-app', 'email', 'push']);

    const estrategias: INotificacionStrategy[] = [
      { canal: 'in-app', enviar: jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>().mockRejectedValue(new Error('E1') as never) },
      { canal: 'email',  enviar: jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>().mockRejectedValue(new Error('E2') as never) },
      { canal: 'push',   enviar: jest.fn<(n: NotificacionDTO) => Promise<ResultadoEnvio>>().mockResolvedValue({ canal: 'push', exito: true }) },
    ];

    const service = new NotificacionService(estrategias, repo);
    const resultados = await service.notificar(NOTIFICACION, 'u5', TIPO_OTRO);

    expect(resultados).toHaveLength(3);
    expect(resultados.filter((r) => !r.exito)).toHaveLength(2);
    expect(resultados.find((r) => r.canal === 'push')?.exito).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────
// 6. Open/Closed — ResumenDiarioStrategy
// ──────────────────────────────────────────────────────────────────
describe('Open/Closed — agregar ResumenDiarioStrategy sin modificar el servicio', () => {
  it('NotificacionService acepta ResumenDiarioStrategy como canal adicional', async () => {
    const resumen = new ResumenDiarioStrategy();
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u6', TIPO_CULTURAL, ['resumen-diario'] as CanalNotificacion[]);

    const service = new NotificacionService([resumen], repo);
    const resultados = await service.notificar(NOTIFICACION, 'u6', TIPO_CULTURAL);

    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toEqual({ canal: 'resumen-diario', exito: true });
  });

  it('mezcla de canales existentes + ResumenDiarioStrategy funciona sin cambios en el servicio', async () => {
    const repo = new InMemoryPreferenciaRepository();
    await repo.actualizarPreferencias('u7', TIPO_ACADEMICO, ['in-app', 'resumen-diario'] as CanalNotificacion[]);

    const service = new NotificacionService(
      [
        new InAppWebSocketStrategy(),
        makeEmailStrategy(),
        new ResumenDiarioStrategy(),
      ],
      repo,
    );
    const resultados = await service.notificar(NOTIFICACION, 'u7', TIPO_ACADEMICO);

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
    const prefs = await repo.obtenerPreferencias('nuevo-usuario', TIPO_ACADEMICO);
    expect(prefs.canalesActivos).toContain('in-app');
    expect(prefs.canalesActivos).toContain('email');
    expect(prefs.canalesActivos).toContain('push');
  });

  it('persiste y retorna preferencias actualizadas', async () => {
    await repo.actualizarPreferencias('u8', TIPO_DEPORTIVO, ['push']);
    const prefs = await repo.obtenerPreferencias('u8', TIPO_DEPORTIVO);
    expect(prefs.canalesActivos).toEqual(['push']);
  });

  it('cada usuario y tipo de evento tiene preferencias independientes', async () => {
    await repo.actualizarPreferencias('u9', TIPO_CULTURAL,  ['email']);
    await repo.actualizarPreferencias('u9', TIPO_DEPORTIVO, ['push']);

    const cultural  = await repo.obtenerPreferencias('u9', TIPO_CULTURAL);
    const deportivo = await repo.obtenerPreferencias('u9', TIPO_DEPORTIVO);

    expect(cultural.canalesActivos).toEqual(['email']);
    expect(deportivo.canalesActivos).toEqual(['push']);
  });
});