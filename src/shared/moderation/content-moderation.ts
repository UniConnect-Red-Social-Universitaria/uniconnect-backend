const PALABRAS_PROHIBIDAS = ['spam', 'phishing', 'scam'];

export function normalizeModerationText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

export function findModerationViolation(value: string): string | null {
    const normalizado = normalizeModerationText(value).toLowerCase();

    if (!normalizado) {
        return 'El contenido no puede estar vacío';
    }

    const palabraProhibida = PALABRAS_PROHIBIDAS.find((palabra) => normalizado.includes(palabra));

    if (palabraProhibida) {
        return `El contenido contiene contenido no permitido: "${palabraProhibida}"`;
    }

    return null;
}