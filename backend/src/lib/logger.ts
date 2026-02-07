/**
 * CloudWatch Logger
 *
 * Structured logging for Lambda functions with request context.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
    requestId?: string;
    [key: string]: unknown;
}

export class Logger {
    private context: string;
    private requestId: string | undefined;
    private logLevel: LogLevel;

    constructor(context: string) {
        this.context = context;
        this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';
    }

    setRequestId(requestId: string): void {
        this.requestId = requestId;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    private formatMessage(level: LogLevel, message: string, data?: LogContext): string {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            context: this.context,
            requestId: this.requestId,
            message,
            ...data,
        };

        return JSON.stringify(logEntry);
    }

    debug(message: string, data?: LogContext): void {
        if (this.shouldLog('DEBUG')) {
            console.log(this.formatMessage('DEBUG', message, data));
        }
    }

    info(message: string, data?: LogContext): void {
        if (this.shouldLog('INFO')) {
            console.log(this.formatMessage('INFO', message, data));
        }
    }

    warn(message: string, data?: LogContext): void {
        if (this.shouldLog('WARN')) {
            console.warn(this.formatMessage('WARN', message, data));
        }
    }

    error(message: string, data?: LogContext): void {
        if (this.shouldLog('ERROR')) {
            console.error(this.formatMessage('ERROR', message, data));
        }
    }
}
