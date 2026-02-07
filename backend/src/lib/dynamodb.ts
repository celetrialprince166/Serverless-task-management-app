/**
 * DynamoDB Client and Utilities
 *
 * Provides DocumentClient and common operations.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
    ScanCommand,
    BatchGetCommand,
    GetCommandInput,
    PutCommandInput,
    UpdateCommandInput,
    DeleteCommandInput,
    QueryCommandInput,
    ScanCommandInput,
    BatchGetCommandInput,
} from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-1',
    ...(process.env.IS_OFFLINE && {
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    }),
});

// Create DocumentClient with marshalling options
export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
    },
    unmarshallOptions: {
        wrapNumbers: false,
    },
});

// Table names from environment
export const TABLES = {
    TASKS: process.env.TASKS_TABLE || 'taskmanager-dev-tasks',
    USERS: process.env.USERS_TABLE || 'taskmanager-dev-users',
};

// Common operations
export const getItem = async <T>(params: GetCommandInput): Promise<T | undefined> => {
    const result = await docClient.send(new GetCommand(params));
    return result.Item as T | undefined;
};

export const putItem = async (params: PutCommandInput): Promise<void> => {
    await docClient.send(new PutCommand(params));
};

export const updateItem = async <T>(params: UpdateCommandInput): Promise<T | undefined> => {
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes as T | undefined;
};

export const deleteItem = async (params: DeleteCommandInput): Promise<void> => {
    await docClient.send(new DeleteCommand(params));
};

export const queryItems = async <T>(params: QueryCommandInput): Promise<T[]> => {
    const result = await docClient.send(new QueryCommand(params));
    return (result.Items || []) as T[];
};

export const scanItems = async <T>(params: ScanCommandInput): Promise<T[]> => {
    const result = await docClient.send(new ScanCommand(params));
    return (result.Items || []) as T[];
};

export const batchGet = async <T>(params: BatchGetCommandInput): Promise<T[]> => {
    const result = await docClient.send(new BatchGetCommand(params));
    const response: T[] = [];
    if (result.Responses) {
        Object.values(result.Responses).forEach((items) => {
            response.push(...(items as T[]));
        });
    }
    return response;
};

/**
 * Build update expression from object
 */
export const buildUpdateExpression = (
    updates: Record<string, unknown>
): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
} => {
    const expressionParts: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, unknown> = {};

    Object.entries(updates).forEach(([key, value], index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;

        expressionParts.push(`${nameKey} = ${valueKey}`);
        attributeNames[nameKey] = key;
        attributeValues[valueKey] = value;
    });

    return {
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
    };
};
