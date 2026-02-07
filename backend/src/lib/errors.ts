/**
 * Custom Error Classes
 *
 * Application-specific errors with HTTP status codes.
 */

export interface ErrorDetails {
    field?: string;
    constraint?: string;
    [key: string]: unknown;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: ErrorDetails;

    constructor(message: string, statusCode: number, code: string, details?: ErrorDetails) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: ErrorDetails) {
        super(message, 400, 'ValidationError', details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NotFound');
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Missing or invalid authentication token') {
        super(message, 401, 'Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, 'Forbidden');
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'Conflict');
        this.name = 'ConflictError';
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, details?: ErrorDetails) {
        super(message, 400, 'BadRequest', details);
        this.name = 'BadRequestError';
    }
}
