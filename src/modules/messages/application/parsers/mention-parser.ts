/**
 * Parser de menciones en mensajes
 * Extrae menciones con formato @usuario del contenido de un mensaje
 */

/**
 * Interfaz para representar una mención extraída
 */
export interface ExtractedMention {
  username: string; // El nombre de usuario mencionado (sin @)
  indices: {
    start: number; // Índice donde comienza @usuario
    end: number;   // Índice donde termina @usuario
  };
}

/**
 * Patrón regex para detectar menciones en formato @usuario
 * Detecta:
 * - @ seguido de uno o más caracteres alfanuméricos, guiones o guiones bajos
 * - Solo cuando está rodeado de límites de palabra o espacios
 * 
 * Ejemplos válidos: @juan, @juan_perez, @juan-123
 * Ejemplos inválidos: @, @123sdfsd (empieza con número)
 */
const MENTION_PATTERN = /(?:^|\s)@([a-zA-Z_][a-zA-Z0-9_-]*)/g;

/**
 * Extrae todas las menciones de un mensaje
 * 
 * @param contenido El contenido del mensaje a parsear
 * @returns Array de menciones extraídas con sus posiciones
 * 
 * @example
 * const menciones = extractMentions("Hola @juan y @maria, ¿cómo están?");
 * // Retorna: [
 * //   { username: 'juan', indices: { start: 5, end: 10 } },
 * //   { username: 'maria', indices: { start: 15, end: 21 } }
 * // ]
 */
export function extractMentions(contenido: string): ExtractedMention[] {
  const menciones: ExtractedMention[] = [];
  let match: RegExpExecArray | null;

  // Necesitamos recrear el regex con el flag global para usar exec repetidamente
  const regex = new RegExp(MENTION_PATTERN.source, 'g');

  while ((match = regex.exec(contenido)) !== null) {
    const username = match[1]; // El grupo capturado sin @
    const fullMatch = match[0]; // Incluye el espacio o inicio
    
    // Determinar si el match inicia con espacio
    const startsWithSpace = fullMatch[0] === ' ';
    const startIndex = match.index + (startsWithSpace ? 1 : 0);
    
    menciones.push({
      username,
      indices: {
        start: startIndex,
        end: startIndex + username.length + 1, // +1 por el @
      },
    });
  }

  return menciones;
}

/**
 * Obtiene nombres de usuario únicos mencionados en un mensaje
 * 
 * @param contenido El contenido del mensaje
 * @returns Array de nombres de usuario únicos (sin @)
 * 
 * @example
 * const usernames = getMentionedUsernames("@juan hizo un comentario genial @juan");
 * // Retorna: ['juan']
 */
export function getMentionedUsernames(contenido: string): string[] {
  const menciones = extractMentions(contenido);
  const uniqueUsernames = new Set(menciones.map((m) => m.username));
  return Array.from(uniqueUsernames);
}

/**
 * Valida si una mención es válida
 * 
 * @param mention La mención a validar (incluye @)
 * @returns true si es válida, false en caso contrario
 * 
 * @example
 * isValidMention("@juan") // true
 * isValidMention("@juan_perez-123") // true
 * isValidMention("@123") // false (comienza con número)
 * isValidMention("@") // false (solo @)
 */
export function isValidMention(mention: string): boolean {
  if (!mention.startsWith('@')) return false;
  const username = mention.substring(1);
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(username) && username.length > 0;
}

/**
 * Reemplaza las menciones en el contenido con una versión formateada
 * Útil para procesar menciones antes de enviarlas al frontend
 * 
 * @param contenido El contenido con menciones
 * @param mentionsData Map de username -> datos del usuario
 * @returns Contenido con menciones procesadas (formato HTML)
 * 
 * @example
 * const formatted = formatMentions(
 *   "@juan hola",
 *   new Map([['juan', { id: '123', nombre: 'Juan Pérez' }]])
 * );
 * // Retorna: "<span class='mention' data-user-id='123'>@Juan Pérez</span> hola"
 */
export function formatMentions(
  contenido: string,
  mentionsData: Map<string, { id: string; nombre: string; apellido: string }>,
): string {
  let formatted = contenido;
  const menciones = extractMentions(contenido);

  // Iterar de atrás hacia adelante para no afectar los índices
  for (let i = menciones.length - 1; i >= 0; i--) {
    const mention = menciones[i];
    const userData = mentionsData.get(mention.username);

    if (userData) {
      const { start, end } = mention.indices;
      const replacement = `<span class="mention" data-user-id="${userData.id}">@${userData.nombre} ${userData.apellido}</span>`;
      formatted = formatted.substring(0, start) + replacement + formatted.substring(end);
    }
  }

  return formatted;
}
