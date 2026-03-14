import { Response } from 'express';

class Handler {
    private static instance: Handler;

    private constructor() {}

    static getInstance(): Handler {
        if (!Handler.instance) {
            Handler.instance = new Handler();
        }

        return Handler.instance;
    }

    failure(res: Response, statusCode: number, message: string, extra?: Record<string, unknown>) {
        return res.status(statusCode).json({
            success: false,
            message,
            ...(extra ?? {})
        });
    }

    standardError(res: Response, statusCode: number, message: string) {
        return res.status(statusCode).json({
            ok: false,
            error: {
                message,
                statusCode
            }
        });
    }
}

export const handler = Handler.getInstance();
