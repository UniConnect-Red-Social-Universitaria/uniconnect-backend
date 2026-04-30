import { Response } from 'express';

import { ApplicationError } from './application-error';

export function handleControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  includeError = true,
) {
  if (error instanceof ApplicationError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  const payload: Record<string, unknown> = {
    success: false,
    message: fallbackMessage,
  };

  if (includeError) {
    payload.error = error instanceof Error ? error.message : 'Error desconocido';
    if (!(error instanceof ApplicationError)) {
        console.error("DEBUG 500 ERROR:", error);
        try {
            require('fs').appendFileSync('error_500.log', new Date().toISOString() + ' ' + (error instanceof Error ? error.stack : String(error)) + '\n');
        } catch (e) {}
    }
  }

  return res.status(500).json(payload);
}