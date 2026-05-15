/**
 * Validador de emojis para reacciones en mensajes
 */

/**
 * Lista de emojis permitidos para reacciones
 * Incluye los emojis más comunes en aplicaciones de mensajería
 */
export const ALLOWED_EMOJIS = [
  '👍', // Pulgar arriba
  '❤️', // Corazón
  '😂', // Riendo
  '😮', // Sorpresa
  '😢', // Triste
  '🔥', // Fuego
  '🎉', // Celebración
  '✨', // Brillo
  '😍', // Amor
  '🤔', // Pensativo
  '👏', // Aplausos
  '🙏', // Manos juntas
  '😡', // Enojado
  '🤮', // Asco
  '😱', // Miedo
  '🎯', // Objetivo
  '💯', // Cien por ciento
  '👀', // Ojos
  '🚀', // Cohete
  '⭐', // Estrella
] as const;

export type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number];

/**
 * Valida si un emoji está permitido para reacciones
 * 
 * @param emoji El emoji a validar
 * @returns true si el emoji está permitido
 * 
 * @example
 * isValidReactionEmoji('👍') // true
 * isValidReactionEmoji('🍕') // false
 * isValidReactionEmoji('a') // false
 */
export function isValidReactionEmoji(emoji: string): emoji is AllowedEmoji {
  return ALLOWED_EMOJIS.includes(emoji as AllowedEmoji);
}

/**
 * Obtiene la descripción de un emoji
 * 
 * @param emoji El emoji
 * @returns La descripción del emoji o null si no existe
 * 
 * @example
 * getEmojiDescription('👍') // "Pulgar arriba"
 */
const EMOJI_DESCRIPTIONS: Record<AllowedEmoji, string> = {
  '👍': 'Pulgar arriba',
  '❤️': 'Corazón',
  '😂': 'Riendo',
  '😮': 'Sorpresa',
  '😢': 'Triste',
  '🔥': 'Fuego',
  '🎉': 'Celebración',
  '✨': 'Brillo',
  '😍': 'Amor',
  '🤔': 'Pensativo',
  '👏': 'Aplausos',
  '🙏': 'Manos juntas',
  '😡': 'Enojado',
  '🤮': 'Asco',
  '😱': 'Miedo',
  '🎯': 'Objetivo',
  '💯': 'Cien por ciento',
  '👀': 'Ojos',
  '🚀': 'Cohete',
  '⭐': 'Estrella',
};

export function getEmojiDescription(emoji: AllowedEmoji): string | null {
  return EMOJI_DESCRIPTIONS[emoji] || null;
}
