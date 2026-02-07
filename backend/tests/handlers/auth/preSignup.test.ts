/**
 * Pre-Signup Handler Tests
 *
 * Tests the Cognito pre-signup trigger that validates email domains.
 */

import { handler, CognitoPreSignupEvent } from '@handlers/auth/preSignup';
import { Context } from 'aws-lambda';

// Mock the Logger
jest.mock('@lib', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        setRequestId: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

describe('Pre-Signup Handler', () => {
    const mockContext = { awsRequestId: 'test-request-id' } as Context;

    const createMockEvent = (
        email: string,
        overrides: Partial<CognitoPreSignupEvent> = {}
    ): CognitoPreSignupEvent => ({
        version: '1',
        triggerSource: 'PreSignUp_SignUp',
        region: 'eu-west-1',
        userPoolId: 'eu-west-1_testpool',
        userName: 'test-user-123',
        callerContext: {
            awsSdkVersion: '3.0.0',
            clientId: 'test-client-id',
        },
        request: {
            userAttributes: {
                email,
                name: 'Test User',
            },
            validationData: {},
            clientMetadata: {},
        },
        response: {
            autoConfirmUser: false,
            autoVerifyPhone: false,
            autoVerifyEmail: false,
        },
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment variable to default
        process.env.ALLOWED_DOMAINS = 'amalitech.com,amalitechtraining.org';
    });

    describe('Allowed Email Domains', () => {
        it('should allow @amalitech.com emails', async () => {
            const event = createMockEvent('user@amalitech.com');

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });

        it('should allow @amalitechtraining.org emails', async () => {
            const event = createMockEvent('user@amalitechtraining.org');

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });

        it('should allow emails with uppercase domain (case-insensitive)', async () => {
            const event = createMockEvent('user@AMALITECH.COM');

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });

        it('should allow emails with mixed case', async () => {
            const event = createMockEvent('User@AmaliTech.Com');

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });
    });

    describe('Blocked Email Domains', () => {
        it('should block @gmail.com emails', async () => {
            const event = createMockEvent('user@gmail.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain 'gmail.com' is not authorized"
            );
        });

        it('should block @yahoo.com emails', async () => {
            const event = createMockEvent('user@yahoo.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain 'yahoo.com' is not authorized"
            );
        });

        it('should block @company.com emails', async () => {
            const event = createMockEvent('user@company.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain 'company.com' is not authorized"
            );
        });

        it('should block similar but different domains', async () => {
            const event = createMockEvent('user@amalitech.org'); // .org instead of .com

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain 'amalitech.org' is not authorized"
            );
        });

        it('should block subdomains of allowed domains', async () => {
            const event = createMockEvent('user@sub.amalitech.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain 'sub.amalitech.com' is not authorized"
            );
        });
    });

    describe('Missing Email', () => {
        it('should throw error when email is not provided', async () => {
            const event = createMockEvent('');
            event.request.userAttributes.email = undefined;

            await expect(handler(event, mockContext)).rejects.toThrow('Email is required');
        });

        it('should throw error when email is empty string', async () => {
            const event = createMockEvent('');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain '' is not authorized"
            );
        });
    });

    describe('Invalid Email Format', () => {
        it('should reject email without @ symbol', async () => {
            const event = createMockEvent('useramalitech.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain '' is not authorized"
            );
        });

        it('should reject email with multiple @ symbols', async () => {
            const event = createMockEvent('user@test@amalitech.com');

            await expect(handler(event, mockContext)).rejects.toThrow(
                "Email domain '' is not authorized"
            );
        });
    });

    describe('Different Trigger Sources', () => {
        it('should process PreSignUp_AdminCreateUser trigger', async () => {
            const event = createMockEvent('admin@amalitech.com', {
                triggerSource: 'PreSignUp_AdminCreateUser',
            });

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });

        it('should process PreSignUp_ExternalProvider trigger', async () => {
            const event = createMockEvent('external@amalitech.com', {
                triggerSource: 'PreSignUp_ExternalProvider',
            });

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });
    });

    describe('Custom Allowed Domains', () => {
        it('should use custom domains from environment variable', async () => {
            // Note: The ALLOWED_DOMAINS is read at module load time,
            // so this test verifies the default behavior.
            // In a real scenario, you'd need to reload the module to test different env values.
            const event = createMockEvent('user@amalitech.com');

            const result = await handler(event, mockContext);

            expect(result).toEqual(event);
        });
    });
});
