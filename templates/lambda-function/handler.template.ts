/**
 * Lambda Handler Template
 * 
 * Replace <RESOURCE> and <ACTION> with actual resource and action names.
 * Example: createTask, listUsers, getTask
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '../lib/logger';
import { successResponse, errorResponse } from '../lib/response';
import { AppError, ValidationError, NotFoundError } from '../lib/errors';

const logger = new Logger('<resource>/<action>');

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Initialize logger with request context
  logger.setRequestId(context.awsRequestId);
  logger.info('Handler invoked', {
    path: event.path,
    method: event.httpMethod,
    queryParams: event.queryStringParameters,
  });

  try {
    // 1. Parse and validate input
    // const body = JSON.parse(event.body || '{}');
    // const validatedInput = validateInput(body);

    // 2. Get user context from Cognito authorizer
    // const userId = event.requestContext.authorizer?.claims?.sub;
    // const userRole = event.requestContext.authorizer?.claims?.['cognito:groups']?.[0];

    // 3. Business logic
    // const result = await doBusinessLogic(validatedInput);

    // 4. Return success response
    const result = { message: 'Handler template - replace with actual logic' };
    
    logger.info('Handler completed successfully');
    return successResponse(200, result);

  } catch (error) {
    logger.error('Handler error', { error });

    if (error instanceof ValidationError) {
      return errorResponse(400, 'BadRequest', error.message, error.details);
    }

    if (error instanceof NotFoundError) {
      return errorResponse(404, 'NotFound', error.message);
    }

    if (error instanceof AppError) {
      return errorResponse(error.statusCode, error.code, error.message);
    }

    // Unexpected error
    return errorResponse(500, 'InternalServerError', 'An unexpected error occurred');
  }
};
