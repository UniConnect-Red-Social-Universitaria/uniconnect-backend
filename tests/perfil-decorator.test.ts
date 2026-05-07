/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { PerfilBase } from '../src/modules/users/application/perfil/PerfilBase';
import { PerfilConEstadisticas } from '../src/modules/users/application/perfil/PerfilConEstadisticas';
import { PerfilConInsignias } from '../src/modules/users/application/perfil/PerfilConInsignias';
import { PerfilDecorator } from '../src/modules/users/application/perfil/PerfilDecorator';
import {
  calcularInsignias,
  EstadisticasPerfil,
  PerfilBaseDTO,
} from '../src/modules/users/domain/IPerfilEstudiante';

const BASE: PerfilBaseDTO = {
  id: 'usuario-001',
  nombre: 'Laura',
  apellido: 'Gómez',
  carrera: 'Ingeniería de Sistemas',
  semestre: 6,
  asignaturasActivas: ['Bases de Datos', 'Algoritmos'],
};

const STATS: EstadisticasPerfil = {
  gruposCreados: 2,
  gruposParticipa: 4,
  mensajesEnviados: 15,
};

// ──────────────────────────────────────────────────────────────────
// 1. PerfilBase
// ──────────────────────────────────────────────────────────────────
describe('PerfilBase', () => {
  it('render() retorna nombre, carrera, semestre y asignaturas activas', () => {
    const perfil = new PerfilBase(BASE);
    expect(perfil.render()).toEqual(BASE);
  });

  it('render() retorna una copia inmutable (no la misma referencia)', () => {
    const perfil = new PerfilBase(BASE);
    expect(perfil.render()).not.toBe(BASE);
  });

  it('implementa IPerfilEstudiante', () => {
    const perfil = new PerfilBase(BASE);
    expect(typeof perfil.render).toBe('function');
  });
});

// ──────────────────────────────────────────────────────────────────
// 2. PerfilConEstadisticas
// ──────────────────────────────────────────────────────────────────
describe('PerfilConEstadisticas', () => {
  it('añade gruposCreados, gruposParticipa y mensajesEnviados al render', () => {
    const perfil = new PerfilConEstadisticas(new PerfilBase(BASE), STATS);
    const resultado = perfil.render();

    expect(resultado).toMatchObject({
      ...BASE,
      estadisticas: STATS,
    });
  });

  it('mantiene todos los campos del PerfilBase intactos', () => {
    const perfil = new PerfilConEstadisticas(new PerfilBase(BASE), STATS);
    const resultado = perfil.render();

    expect(resultado.nombre).toBe(BASE.nombre);
    expect(resultado.carrera).toBe(BASE.carrera);
    expect(resultado.semestre).toBe(BASE.semestre);
    expect(resultado.asignaturasActivas).toEqual(BASE.asignaturasActivas);
  });

  it('extiende PerfilDecorator', () => {
    const perfil = new PerfilConEstadisticas(new PerfilBase(BASE), STATS);
    expect(perfil).toBeInstanceOf(PerfilDecorator);
  });
});

// ──────────────────────────────────────────────────────────────────
// 3. PerfilConInsignias
// ──────────────────────────────────────────────────────────────────
describe('PerfilConInsignias', () => {
  it('añade el array de insignias al render', () => {
    const insignias = calcularInsignias(STATS);
    const perfil = new PerfilConInsignias(new PerfilBase(BASE), insignias);
    const resultado = perfil.render();

    expect(resultado).toHaveProperty('insignias');
    expect(Array.isArray(resultado.insignias)).toBe(true);
  });

  it('mantiene todos los campos del PerfilBase intactos', () => {
    const perfil = new PerfilConInsignias(new PerfilBase(BASE), ['fundador']);
    const resultado = perfil.render();

    expect(resultado.nombre).toBe(BASE.nombre);
    expect(resultado.carrera).toBe(BASE.carrera);
  });

  it('extiende PerfilDecorator', () => {
    const perfil = new PerfilConInsignias(new PerfilBase(BASE), []);
    expect(perfil).toBeInstanceOf(PerfilDecorator);
  });
});

// ──────────────────────────────────────────────────────────────────
// 4. Composición de decoradores
// ──────────────────────────────────────────────────────────────────
describe('Composición PerfilConEstadisticas + PerfilConInsignias', () => {
  it('render() incluye estadisticas e insignias a la vez', () => {
    const insignias = calcularInsignias(STATS);
    const perfil = new PerfilConInsignias(
      new PerfilConEstadisticas(new PerfilBase(BASE), STATS),
      insignias,
    );
    const resultado = perfil.render();

    expect(resultado).toMatchObject({ ...BASE });
    expect(resultado).toHaveProperty('estadisticas');
    expect(resultado).toHaveProperty('insignias');
  });

  it('PerfilBase solo retorna campos base sin estadisticas ni insignias', () => {
    const resultado = new PerfilBase(BASE).render();

    expect(resultado).not.toHaveProperty('estadisticas');
    expect(resultado).not.toHaveProperty('insignias');
  });
});

// ──────────────────────────────────────────────────────────────────
// 5. calcularInsignias — hitos del sistema
// ──────────────────────────────────────────────────────────────────
describe('calcularInsignias', () => {
  it('otorga "fundador" con al menos 1 grupo creado', () => {
    expect(calcularInsignias({ gruposCreados: 1, gruposParticipa: 0, mensajesEnviados: 0 }))
      .toContain('fundador');
  });

  it('NO otorga "fundador" si no ha creado grupos', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 5, mensajesEnviados: 20 }))
      .not.toContain('fundador');
  });

  it('otorga "participante-activo" con 3 o más grupos en que participa', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 3, mensajesEnviados: 0 }))
      .toContain('participante-activo');
  });

  it('NO otorga "participante-activo" con menos de 3 grupos', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 2, mensajesEnviados: 0 }))
      .not.toContain('participante-activo');
  });

  it('otorga "comunicador" con 10 o más mensajes enviados', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 0, mensajesEnviados: 10 }))
      .toContain('comunicador');
  });

  it('NO otorga "comunicador" con menos de 10 mensajes', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 0, mensajesEnviados: 9 }))
      .not.toContain('comunicador');
  });

  it('otorga "colaborador" si tiene grupos creados, participa y ha enviado mensajes', () => {
    expect(calcularInsignias({ gruposCreados: 1, gruposParticipa: 1, mensajesEnviados: 1 }))
      .toContain('colaborador');
  });

  it('estudiante sin actividad no recibe ninguna insignia', () => {
    expect(calcularInsignias({ gruposCreados: 0, gruposParticipa: 0, mensajesEnviados: 0 }))
      .toHaveLength(0);
  });

  it('estudiante con todos los hitos recibe todas las insignias', () => {
    const insignias = calcularInsignias(STATS);
    expect(insignias).toContain('fundador');
    expect(insignias).toContain('participante-activo');
    expect(insignias).toContain('comunicador');
    expect(insignias).toContain('colaborador');
  });
});
