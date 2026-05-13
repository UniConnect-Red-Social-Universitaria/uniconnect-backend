import prisma from '../../../lib/prisma';
import {
    CreatePollData,
    CreatePollOptionData,
    CreatePollVoteData,
    PollOptionRecord,
    PollRecord,
    PollRepository,
    PollTarget,
    PollVoteRecord,
    UpdatePollStatusData,
} from '../../../domain/contracts';

type PollInclude = {
    opciones: Array<{
        id: string;
        encuestaId: string;
        texto: string;
        orden: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
};

function mapTarget(poll: { grupoId?: string | null; chatId?: string | null }): PollTarget {
    if (poll.grupoId) {
        return { type: 'CHANNEL', id: poll.grupoId };
    }

    return { type: 'CHAT', id: poll.chatId ?? '' };
}

function mapOption(option: PollInclude['opciones'][number]): PollOptionRecord {
    return {
        id: option.id,
        pollId: option.encuestaId,
        text: option.texto,
        position: option.orden,
        createdAt: option.createdAt,
        updatedAt: option.updatedAt,
    };
}

function mapPoll(poll: {
    id: string;
    pregunta: string;
    estado: string;
    grupoId?: string | null;
    chatId?: string | null;
    creadorId: string;
    autoCloseAt?: Date | null;
    closedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}): PollRecord {
    return {
        id: poll.id,
        question: poll.pregunta,
        status: poll.estado as PollRecord['status'],
        target: mapTarget(poll),
        createdById: poll.creadorId,
        autoCloseAt: poll.autoCloseAt ?? null,
        closedAt: poll.closedAt ?? null,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
    };
}

export class PrismaPollRepository implements PollRepository {
    async create(data: CreatePollData): Promise<PollRecord> {
        const encuesta = await prisma.encuesta.create({
            data: {
                pregunta: data.question,
                estado: 'OPEN',
                creadorId: data.createdById,
                autoCloseAt: data.autoCloseAt ?? undefined,
                grupoId: data.target.type === 'CHANNEL' ? data.target.id : null,
                chatId: data.target.type === 'CHAT' ? data.target.id : null,
                opciones: {
                    create: data.options.map((option: CreatePollOptionData, index: number) => ({
                        texto: option.text,
                        orden: option.position ?? index + 1,
                    })),
                },
            },
        });

        return mapPoll(encuesta);
    }

    async findById(id: string): Promise<PollRecord | null> {
        const encuesta = await prisma.encuesta.findUnique({ where: { id } });
        return encuesta ? mapPoll(encuesta) : null;
    }

    async findExpiredOpen(now: Date): Promise<PollRecord[]> {
        const encuestas = await prisma.encuesta.findMany({
            where: {
                estado: 'OPEN',
                autoCloseAt: {
                    lte: now,
                },
            },
            orderBy: { autoCloseAt: 'asc' },
        });

        return encuestas.map(mapPoll);
    }

    async listByTarget(target: PollTarget): Promise<PollRecord[]> {
        const where = target.type === 'CHANNEL' ? { grupoId: target.id } : { chatId: target.id };

        const encuestas = await prisma.encuesta.findMany({ where, orderBy: { createdAt: 'desc' } });
        return encuestas.map(mapPoll);
    }

    async listOptionsByPollId(pollId: string): Promise<PollOptionRecord[]> {
        const opciones = await prisma.encuestaOpcion.findMany({
            where: { encuestaId: pollId },
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
        });

        return opciones.map(mapOption);
    }

    async listVotesByPollId(pollId: string): Promise<PollVoteRecord[]> {
        const votos = await prisma.encuestaVoto.findMany({
            where: { encuestaId: pollId },
            orderBy: { createdAt: 'asc' },
        });

        return votos.map((vote) => ({
            id: vote.id,
            pollId: vote.encuestaId,
            optionId: vote.opcionId,
            voterId: vote.usuarioId,
            createdAt: vote.createdAt,
            updatedAt: vote.updatedAt,
        }));
    }

    async addOption(pollId: string, data: CreatePollOptionData): Promise<PollOptionRecord> {
        const opcion = await prisma.encuestaOpcion.create({
            data: {
                encuestaId: pollId,
                texto: data.text,
                orden: data.position ?? 1,
            },
        });

        return mapOption({
            id: opcion.id,
            encuestaId: opcion.encuestaId,
            texto: opcion.texto,
            orden: opcion.orden,
            createdAt: opcion.createdAt,
            updatedAt: opcion.updatedAt,
        });
    }

    async vote(data: CreatePollVoteData): Promise<PollVoteRecord> {
        const voto = await prisma.encuestaVoto.create({
            data: {
                encuestaId: data.pollId,
                opcionId: data.optionId,
                usuarioId: data.voterId,
            },
        });

        return {
            id: voto.id,
            pollId: voto.encuestaId,
            optionId: voto.opcionId,
            voterId: voto.usuarioId,
            createdAt: voto.createdAt,
            updatedAt: voto.updatedAt,
        };
    }

    async updateStatus(pollId: string, data: UpdatePollStatusData): Promise<PollRecord> {
        const encuesta = await prisma.encuesta.update({
            where: { id: pollId },
            data: {
                estado: data.status,
                closedAt: data.closedAt ?? undefined,
            },
        });

        return mapPoll(encuesta);
    }
}
