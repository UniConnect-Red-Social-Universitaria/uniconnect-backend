export type LogLevel = 'warning' | 'error' | 'info' | 'debug' | 'critical';

class Logger {
    private static instance: Logger;

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }

    private write(level: LogLevel, message: string, meta?: unknown) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        const payload = meta !== undefined ? [prefix, message, meta] : [prefix, message];

        if (level === 'error' || level === 'critical') {
            console.error(...payload);
            return;
        }

        if (level === 'warning') {
            console.warn(...payload);
            return;
        }

        if (level === 'debug') {
            console.debug(...payload);
            return;
        }

        console.info(...payload);
    }

    warning(message: string, meta?: unknown) {
        this.write('warning', message, meta);
    }

    error(message: string, meta?: unknown) {
        this.write('error', message, meta);
    }

    info(message: string, meta?: unknown) {
        this.write('info', message, meta);
    }

    debug(message: string, meta?: unknown) {
        this.write('debug', message, meta);
    }

    critical(message: string, meta?: unknown) {
        this.write('critical', message, meta);
    }
}

export const logger = Logger.getInstance();
