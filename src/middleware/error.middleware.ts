import { ErrorRequestHandler, RequestHandler } from 'express';

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

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
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
        console.error('[Error no controlado]', err);
    }

    res.status(statusCode).json({
        ok: false,
        error: {
            message,
            statusCode
        }
    });
};
