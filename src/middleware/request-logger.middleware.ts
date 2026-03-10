import { RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

function generarRequestId(): string {
    try {
        return randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
}

export const requestLogger: RequestHandler = (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = generarRequestId();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const message = `${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsedMs.toFixed(2)} ms)`;
        const meta = { requestId };

        if (res.statusCode >= 500) {
            logger.error(message, meta);
            return;
        }

        if (res.statusCode >= 400) {
            logger.warning(message, meta);
            return;
        }

        logger.info(message, meta);
    });

    next();
};
