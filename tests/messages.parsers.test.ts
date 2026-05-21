import {
  isValidReactionEmoji,
  getEmojiDescription,
  ALLOWED_EMOJIS,
} from '../src/modules/messages/application/parsers/emoji-validator';

import {
  extractMentions,
  getMentionedUsernames,
  isValidMention,
  formatMentions,
} from '../src/modules/messages/application/parsers/mention-parser';

// ─── emoji-validator ──────────────────────────────────────────────────────────

describe('isValidReactionEmoji', () => {
  it('retorna true para todos los emojis permitidos', () => {
    for (const emoji of ALLOWED_EMOJIS) {
      expect(isValidReactionEmoji(emoji)).toBe(true);
    }
  });

  it('retorna false para un emoji no permitido', () => {
    expect(isValidReactionEmoji('🍕')).toBe(false);
  });

  it('retorna false para texto normal', () => {
    expect(isValidReactionEmoji('a')).toBe(false);
    expect(isValidReactionEmoji('like')).toBe(false);
  });

  it('retorna false para string vacío', () => {
    expect(isValidReactionEmoji('')).toBe(false);
  });

  it('retorna true para 👍', () => {
    expect(isValidReactionEmoji('👍')).toBe(true);
  });

  it('retorna true para ❤️', () => {
    expect(isValidReactionEmoji('❤️')).toBe(true);
  });
});

describe('getEmojiDescription', () => {
  it('retorna la descripción de 👍', () => {
    expect(getEmojiDescription('👍')).toBe('Pulgar arriba');
  });

  it('retorna la descripción de ❤️', () => {
    expect(getEmojiDescription('❤️')).toBe('Corazón');
  });

  it('retorna la descripción de 🔥', () => {
    expect(getEmojiDescription('🔥')).toBe('Fuego');
  });

  it('retorna descripción para todos los emojis permitidos', () => {
    for (const emoji of ALLOWED_EMOJIS) {
      const desc = getEmojiDescription(emoji);
      expect(typeof desc).toBe('string');
      expect((desc as string).length).toBeGreaterThan(0);
    }
  });
});

// ─── mention-parser ───────────────────────────────────────────────────────────

describe('extractMentions', () => {
  it('extrae una mención simple', () => {
    const result = extractMentions('Hola @juan, ¿cómo estás?');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('juan');
  });

  it('extrae múltiples menciones', () => {
    const result = extractMentions('Hola @juan y @maria');
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('juan');
    expect(result[1].username).toBe('maria');
  });

  it('extrae mención con guión bajo', () => {
    const result = extractMentions('Hola @juan_perez');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('juan_perez');
  });

  it('extrae mención con guión', () => {
    const result = extractMentions('cc @juan-123');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('juan-123');
  });

  it('retorna lista vacía si no hay menciones', () => {
    const result = extractMentions('Hola a todos, ¿cómo están?');
    expect(result).toHaveLength(0);
  });

  it('retorna lista vacía para string vacío', () => {
    expect(extractMentions('')).toHaveLength(0);
  });

  it('no extrae @ sola', () => {
    const result = extractMentions('usa el símbolo @');
    expect(result).toHaveLength(0);
  });

  it('no extrae mención que empieza con número', () => {
    const result = extractMentions('ref @123abc');
    expect(result).toHaveLength(0);
  });

  it('incluye los índices correctos de la mención', () => {
    const result = extractMentions('@juan hola');
    expect(result[0].indices.start).toBe(0);
    expect(result[0].indices.end).toBe(5); // @juan = 5 chars
  });

  it('extrae mención al inicio del mensaje', () => {
    const result = extractMentions('@admin revisa esto');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('admin');
  });
});

describe('getMentionedUsernames', () => {
  it('retorna usernames únicos', () => {
    const result = getMentionedUsernames('@juan hizo algo y @juan lo repitió');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('juan');
  });

  it('retorna múltiples usernames únicos', () => {
    const result = getMentionedUsernames('@juan y @maria y @pedro');
    expect(result).toHaveLength(3);
    expect(result).toContain('juan');
    expect(result).toContain('maria');
    expect(result).toContain('pedro');
  });

  it('retorna lista vacía si no hay menciones', () => {
    expect(getMentionedUsernames('sin menciones')).toHaveLength(0);
  });

  it('retorna lista vacía para string vacío', () => {
    expect(getMentionedUsernames('')).toHaveLength(0);
  });
});

describe('isValidMention', () => {
  it('retorna true para @juan', () => {
    expect(isValidMention('@juan')).toBe(true);
  });

  it('retorna true para @juan_perez', () => {
    expect(isValidMention('@juan_perez')).toBe(true);
  });

  it('retorna true para @juan-123', () => {
    expect(isValidMention('@juan-123')).toBe(true);
  });

  it('retorna true para @_underscore', () => {
    expect(isValidMention('@_inicio')).toBe(true);
  });

  it('retorna false para @ solo', () => {
    expect(isValidMention('@')).toBe(false);
  });

  it('retorna false si no empieza con @', () => {
    expect(isValidMention('juan')).toBe(false);
  });

  it('retorna false para @123 (empieza con número)', () => {
    expect(isValidMention('@123abc')).toBe(false);
  });

  it('retorna false para string vacío', () => {
    expect(isValidMention('')).toBe(false);
  });
});

describe('formatMentions', () => {
  it('reemplaza mención con span HTML cuando el usuario existe', () => {
    const mentionsData = new Map([['juan', { id: 'u-1', nombre: 'Juan', apellido: 'Pérez' }]]);
    const result = formatMentions('@juan hola', mentionsData);
    expect(result).toContain('data-user-id="u-1"');
    expect(result).toContain('@Juan Pérez');
    expect(result).toContain('mention');
  });

  it('no reemplaza mención si el usuario no está en el map', () => {
    const mentionsData = new Map<string, { id: string; nombre: string; apellido: string }>();
    const result = formatMentions('@desconocido hola', mentionsData);
    expect(result).toContain('@desconocido');
    expect(result).not.toContain('data-user-id');
  });

  it('retorna el contenido sin cambios si no hay menciones', () => {
    const mentionsData = new Map([['juan', { id: 'u-1', nombre: 'Juan', apellido: 'Pérez' }]]);
    const result = formatMentions('Hola a todos', mentionsData);
    expect(result).toBe('Hola a todos');
  });

  it('reemplaza múltiples menciones correctamente', () => {
    const mentionsData = new Map([
      ['juan', { id: 'u-1', nombre: 'Juan', apellido: 'Pérez' }],
      ['maria', { id: 'u-2', nombre: 'María', apellido: 'García' }],
    ]);
    const result = formatMentions('@juan y @maria', mentionsData);
    expect(result).toContain('data-user-id="u-1"');
    expect(result).toContain('data-user-id="u-2"');
  });

  it('reemplaza mención duplicada solo donde aplica el map', () => {
    const mentionsData = new Map([['juan', { id: 'u-1', nombre: 'Juan', apellido: 'Pérez' }]]);
    const result = formatMentions('@juan hola @juan', mentionsData);
    expect(result).toContain('data-user-id="u-1"');
  });
});
