/**
 * User Validators
 *
 * Joi schemas for user input validation.
 */

import Joi from 'joi';
import { UpdateUserInput } from '../models/User';

export const updateUserSchema = Joi.object<UpdateUserInput>({
    name: Joi.string().min(1).max(100).required().messages({
        'string.empty': 'Name is required',
        'string.max': 'Name cannot exceed 100 characters',
    }),
});

/**
 * Validate user input against schema
 */
export const validateUserInput = <T>(
    schema: Joi.Schema<T>,
    data: unknown
): { value: T; error?: string; details?: Record<string, string> } => {
    const { value, error } = schema.validate(data, { abortEarly: false });

    if (error) {
        const details: Record<string, string> = {};
        error.details.forEach((detail) => {
            const key = detail.path.join('.');
            details[key] = detail.message;
        });

        return {
            value: value as T,
            error: error.details[0].message,
            details,
        };
    }

    return { value };
};
