import { ErrorRequestHandler, RequestHandler } from 'express';
import { handler } from '../lib/handler';
import { logger } from '../lib/logger';

export class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HttpError';
    }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
    next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const statusCode =
        err instanceof HttpError
            ? err.statusCode
            : typeof (err as { status?: unknown }).status === 'number'
              ? ((err as { status: number }).status)
              : 500;

    const message =
        err instanceof Error && err.message
            ? err.message
            : 'Error interno del servidor';

    if (statusCode >= 500) {
        logger.critical('Error no controlado', {
            requestId: req.requestId,
            error: err
        });
    } else {
        logger.warning('Error controlado', {
            requestId: req.requestId,
            statusCode,
            message
        });
    }

    return handler.standardError(res, statusCode, message);
};
