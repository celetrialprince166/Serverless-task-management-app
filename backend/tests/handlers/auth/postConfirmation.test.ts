/**
 * Post-Confirmation Handler Tests
 *
 * Tests the Cognito post-confirmation trigger that creates user records in DynamoDB.
 */

import { handler, CognitoPostConfirmationEvent } from '@handlers/auth/postConfirmation';
import { TABLES, putItem } from '@lib';
import { Context } from 'aws-lambda';

// Mock the lib module
jest.mock('@lib', () => ({
    ...jest.requireActual('@lib'),
    putItem: jest.fn(),
    TABLES: {
        USERS: 'test-users',
        TASKS: 'test-tasks',
    },
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

describe('Post-Confirmation Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const createMockEvent = (
        overrides: Partial<CognitoPostConfirmationEvent> = {}
    ): CognitoPostConfirmationEvent => ({
        version: '1',
        triggerSource: 'PostConfirmation_ConfirmSignUp',
        region: 'eu-west-1',
        userPoolId: 'eu-west-1_testpool',
        userName: 'test-user-123',
        callerContext: {
            awsSdkVersion: '3.0.0',
            clientId: 'test-client-id',
        },
        request: {
            userAttributes: {
                sub: 'user-sub-123',
                email: 'test@amalitech.com',
                name: 'Test User',
                email_verified: 'true',
            },
            clientMetadata: {},
        },
        response: {},
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Successful User Creation', () => {
        it('should create a user record in DynamoDB on signup confirmation', async () => {
            const event = createMockEvent();
            (putItem as jest.Mock).mockResolvedValue({});

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
            expect(putItem).toHaveBeenCalledTimes(1);
            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: TABLES.USERS,
                    Item: expect.objectContaining({
                        PK: 'USER#user-sub-123',
                        SK: 'PROFILE',
                        GSI1PK: 'EMAIL#test@amalitech.com',
                        id: 'user-sub-123',
                        email: 'test@amalitech.com',
                        name: 'Test User',
                        role: 'MEMBER',
                        status: 'ACTIVE',
                    }),
                    ConditionExpression: 'attribute_not_exists(PK)',
                })
            );
        });

        it('should assign ADMIN role when custom:role is ADMIN', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: 'admin-user-123',
                        email: 'admin@amalitech.com',
                        name: 'Admin User',
                        'custom:role': 'ADMIN',
                    },
                },
            });
            (putItem as jest.Mock).mockResolvedValue({});

            await handler(event, mockContext);

            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Item: expect.objectContaining({
                        role: 'ADMIN',
                    }),
                })
            );
        });

        it('should assign ADMIN role when custom:role is admin (lowercase)', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: 'admin-user-456',
                        email: 'admin2@amalitech.com',
                        name: 'Admin User 2',
                        'custom:role': 'admin',
                    },
                },
            });
            (putItem as jest.Mock).mockResolvedValue({});

            await handler(event, mockContext);

            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Item: expect.objectContaining({
                        role: 'ADMIN',
                    }),
                })
            );
        });

        it('should default to MEMBER role when no custom:role is provided', async () => {
            const event = createMockEvent();
            (putItem as jest.Mock).mockResolvedValue({});

            await handler(event, mockContext);

            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Item: expect.objectContaining({
                        role: 'MEMBER',
                    }),
                })
            );
        });

        it('should use email prefix as name when name is not provided', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: 'user-no-name-123',
                        email: 'noname@amalitech.com',
                    },
                },
            });
            (putItem as jest.Mock).mockResolvedValue({});

            await handler(event, mockContext);

            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Item: expect.objectContaining({
                        name: 'noname',
                    }),
                })
            );
        });

        it('should lowercase email in GSI1PK and email field', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: 'user-uppercase-123',
                        email: 'TEST@AMALITECH.COM',
                        name: 'Test User',
                    },
                },
            });
            (putItem as jest.Mock).mockResolvedValue({});

            await handler(event, mockContext);

            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Item: expect.objectContaining({
                        GSI1PK: 'EMAIL#test@amalitech.com',
                        email: 'test@amalitech.com',
                    }),
                })
            );
        });

        it('should create user record on sign-in (PostAuthentication)', async () => {
            const event = createMockEvent({
                triggerSource: 'PostAuthentication_Authentication',
                request: {
                    userAttributes: {
                        sub: 'signin-user-456',
                        email: 'signin@amalitech.com',
                        name: 'Sign-in User',
                    },
                },
            });
            (putItem as jest.Mock).mockResolvedValue({});

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
            expect(putItem).toHaveBeenCalledTimes(1);
            expect(putItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: TABLES.USERS,
                    Item: expect.objectContaining({
                        PK: 'USER#signin-user-456',
                        id: 'signin-user-456',
                        email: 'signin@amalitech.com',
                        name: 'Sign-in User',
                    }),
                })
            );
        });
    });

    describe('Skip Non-Signup Triggers', () => {
        it('should skip processing for password reset confirmations', async () => {
            const event = createMockEvent({
                triggerSource: 'PostConfirmation_ConfirmForgotPassword',
            });

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
            expect(putItem).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should throw error when sub is missing', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: '',
                        email: 'test@amalitech.com',
                    },
                },
            });

            await expect(handler(event, mockContext)).rejects.toThrow(
                'Missing required user attributes (sub or email)'
            );
            expect(putItem).not.toHaveBeenCalled();
        });

        it('should throw error when email is missing', async () => {
            const event = createMockEvent({
                request: {
                    userAttributes: {
                        sub: 'user-123',
                    },
                },
            });

            await expect(handler(event, mockContext)).rejects.toThrow(
                'Missing required user attributes (sub or email)'
            );
            expect(putItem).not.toHaveBeenCalled();
        });

        it('should handle user already exists gracefully', async () => {
            const event = createMockEvent();
            const conditionalError = new Error('ConditionalCheckFailedException');
            conditionalError.name = 'ConditionalCheckFailedException';
            (putItem as jest.Mock).mockRejectedValue(conditionalError);

            // Should not throw - user already exists is acceptable
            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });

        it('should rethrow other DynamoDB errors', async () => {
            const event = createMockEvent();
            const dbError = new Error('Internal Server Error');
            dbError.name = 'InternalServerError';
            (putItem as jest.Mock).mockRejectedValue(dbError);

            await expect(handler(event, mockContext)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('Timestamp Fields', () => {
        it('should set createdAt and updatedAt to current ISO timestamp', async () => {
            const event = createMockEvent();
            (putItem as jest.Mock).mockResolvedValue({});

            const beforeTime = new Date().toISOString();
            await handler(event, mockContext);
            const afterTime = new Date().toISOString();

            const callArgs = (putItem as jest.Mock).mock.calls[0][0];
            const createdAt = callArgs.Item.createdAt;
            const updatedAt = callArgs.Item.updatedAt;

            // Timestamps should be valid ISO strings
            expect(new Date(createdAt).toISOString()).toBe(createdAt);
            expect(new Date(updatedAt).toISOString()).toBe(updatedAt);

            // Timestamps should be within the test execution window
            expect(createdAt >= beforeTime).toBe(true);
            expect(createdAt <= afterTime).toBe(true);
            expect(createdAt).toBe(updatedAt);
        });
    });
});
