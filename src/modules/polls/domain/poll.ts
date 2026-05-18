import {
    CreatePollData,
    CreatePollOptionData,
    CreatePollVoteData,
    PollRecord,
    PollOptionView,
    PollStatus,
    PollTarget,
    POLL_STATUS,
    POLL_TARGET_TYPES,
} from '../../../domain/contracts';

const MIN_POLL_QUESTION_LENGTH = 3;
const MAX_POLL_QUESTION_LENGTH = 240;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 10;
const MAX_POLL_OPTION_LENGTH = 140;

function normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function isPollStatus(value: unknown): value is PollStatus {
    return typeof value === 'string' && POLL_STATUS.includes(value as PollStatus);
}

export function isPollTarget(value: unknown): value is PollTarget {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'type' in value &&
        'id' in value &&
        isNonEmptyString((value as PollTarget).id) &&
        typeof (value as PollTarget).type === 'string' &&
        POLL_TARGET_TYPES.includes((value as PollTarget).type),
    );
}

export function normalizePollQuestion(question: string): string {
    return normalizeText(question);
}

export function normalizePollOptionText(text: string): string {
    return normalizeText(text);
}

export function validatePollQuestion(question: string): void {
    const normalizedQuestion = normalizePollQuestion(question);

    if (normalizedQuestion.length < MIN_POLL_QUESTION_LENGTH) {
        throw new Error('La pregunta de la encuesta no puede estar vacía.');
    }

    if (normalizedQuestion.length > MAX_POLL_QUESTION_LENGTH) {
        throw new Error('La pregunta de la encuesta supera el límite permitido.');
    }
}

export function validatePollTarget(target: PollTarget): void {
    if (!isPollTarget(target)) {
        throw new Error('El contexto de la encuesta debe apuntar a un chat o canal válido.');
    }
}

export function validatePollOptions(options: CreatePollOptionData[]): void {
    if (!Array.isArray(options) || options.length < MIN_POLL_OPTIONS) {
        throw new Error('La encuesta debe tener al menos dos opciones.');
    }

    if (options.length > MAX_POLL_OPTIONS) {
        throw new Error('La encuesta supera el número máximo de opciones permitido.');
    }

    const normalizedOptions = options.map((option) => normalizePollOptionText(option.text));

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
        throw new Error('Las opciones de la encuesta no pueden repetirse.');
    }

    normalizedOptions.forEach((optionText) => {
        if (optionText.length === 0) {
            throw new Error('Las opciones de la encuesta no pueden estar vacías.');
        }

        if (optionText.length > MAX_POLL_OPTION_LENGTH) {
            throw new Error('Una opción de la encuesta supera el límite permitido.');
        }
    });
}

export function validatePollAutoCloseAt(autoCloseAt: Date | null | undefined, now: Date = new Date()): void {
    if (!autoCloseAt) {
        return;
    }

    if (!(autoCloseAt instanceof Date) || Number.isNaN(autoCloseAt.getTime())) {
        throw new Error('La fecha de cierre automático de la encuesta no es válida.');
    }

    if (autoCloseAt.getTime() <= now.getTime()) {
        throw new Error('La fecha de cierre automático debe ser futura.');
    }
}

export function validatePollCreationData(data: CreatePollData, now: Date = new Date()): void {
    validatePollQuestion(data.question);
    validatePollTarget(data.target);
    validatePollOptions(data.options);
    validatePollAutoCloseAt(data.autoCloseAt, now);

    if (!isNonEmptyString(data.createdById)) {
        throw new Error('El creador de la encuesta es obligatorio.');
    }
}

export function validatePollVoteData(data: CreatePollVoteData): void {
    if (!isNonEmptyString(data.pollId)) {
        throw new Error('El identificador de la encuesta es obligatorio.');
    }

    if (!isNonEmptyString(data.optionId)) {
        throw new Error('La opción seleccionada es obligatoria.');
    }

    if (!isNonEmptyString(data.voterId)) {
        throw new Error('El votante es obligatorio.');
    }
}

export function isPollOpen(poll: Pick<PollRecord, 'status' | 'autoCloseAt'>, now: Date = new Date()): boolean {
    if (poll.status !== 'OPEN') {
        return false;
    }

    if (poll.autoCloseAt && poll.autoCloseAt.getTime() <= now.getTime()) {
        return false;
    }

    return true;
}

export function shouldAutoClosePoll(poll: Pick<PollRecord, 'status' | 'autoCloseAt'>, now: Date = new Date()): boolean {
    return poll.status === 'OPEN' && Boolean(poll.autoCloseAt && poll.autoCloseAt.getTime() <= now.getTime());
}

export function calcularResultadosEncuesta(
    options: PollOptionView[],
    votes: Array<{ optionId: string }>,
): PollOptionView[] {
    const totalVotes = votes.length;

    return options.map((option) => {
        const votos = votes.filter((vote) => vote.optionId === option.id).length;
        const porcentaje = totalVotes === 0 ? 0 : Math.round((votos / totalVotes) * 100);

        return {
            ...option,
            votos,
            porcentaje,
        };
    });
}
