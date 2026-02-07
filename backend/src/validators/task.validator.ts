/**
 * Task Validators
 *
 * Joi schemas for task input validation.
 */

import Joi from 'joi';
import { CreateTaskInput, UpdateTaskInput, UpdateStatusInput } from '../models/Task';

const taskStatusValues = ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CLOSED'] as const;
const taskPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const createTaskSchema = Joi.object<CreateTaskInput>({
    title: Joi.string().min(1).max(200).required().messages({
        'string.empty': 'Task title is required',
        'string.max': 'Task title cannot exceed 200 characters',
    }),
    description: Joi.string().max(2000).optional().messages({
        'string.max': 'Description cannot exceed 2000 characters',
    }),
    priority: Joi.string()
        .valid(...taskPriorityValues)
        .default('MEDIUM')
        .messages({
            'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
        }),
    dueDate: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Due date must be a valid ISO 8601 date',
    }),
    assignedTo: Joi.array().items(Joi.string().uuid()).optional().messages({
        'array.includes': 'Assigned users must be valid UUIDs',
    }),
});

export const updateTaskSchema = Joi.object<UpdateTaskInput>({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(2000).allow('').optional(),
    priority: Joi.string()
        .valid(...taskPriorityValues)
        .optional(),
    status: Joi.string()
        .valid(...taskStatusValues)
        .optional(),
    dueDate: Joi.string().isoDate().allow(null).optional(),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update',
});

export const updateStatusSchema = Joi.object<UpdateStatusInput>({
    status: Joi.string()
        .valid(...taskStatusValues)
        .required()
        .messages({
            'any.required': 'Status is required',
            'any.only': 'Status must be one of: OPEN, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CLOSED',
        }),
});

export const assignTaskSchema = Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
        'array.min': 'At least one user ID is required',
        'any.required': 'User IDs array is required',
    }),
});

/**
 * Validate input against schema
 */
export const validateTaskInput = <T>(
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
