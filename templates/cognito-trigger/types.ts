/**
 * Cognito Trigger Types
 *
 * TypeScript interfaces for Cognito Lambda triggers.
 */

/**
 * Cognito Pre-Signup Trigger Event
 */
export interface CognitoPreSignupEvent {
    version: string;
    triggerSource: 'PreSignUp_SignUp' | 'PreSignUp_AdminCreateUser' | 'PreSignUp_ExternalProvider';
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    request: {
        userAttributes: {
            email?: string;
            name?: string;
            [key: string]: string | undefined;
        };
        validationData?: Record<string, string>;
        clientMetadata?: Record<string, string>;
    };
    response: {
        autoConfirmUser: boolean;
        autoVerifyPhone: boolean;
        autoVerifyEmail: boolean;
    };
}

/**
 * Cognito Post-Confirmation Trigger Event
 */
export interface CognitoPostConfirmationEvent {
    version: string;
    triggerSource: 'PostConfirmation_ConfirmSignUp' | 'PostConfirmation_ConfirmForgotPassword';
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    request: {
        userAttributes: {
            sub: string;
            email?: string;
            email_verified?: string;
            name?: string;
            [key: string]: string | undefined;
        };
        clientMetadata?: Record<string, string>;
    };
    response: Record<string, never>;
}

/**
 * Cognito Pre-Token Generation Event
 */
export interface CognitoPreTokenGenerationEvent {
    version: string;
    triggerSource: 'TokenGeneration_HostedAuth' | 'TokenGeneration_Authentication' | 'TokenGeneration_NewPasswordChallenge' | 'TokenGeneration_AuthenticateDevice' | 'TokenGeneration_RefreshTokens';
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    request: {
        userAttributes: Record<string, string>;
        groupConfiguration?: {
            groupsToOverride?: string[];
            iamRolesToOverride?: string[];
            preferredRole?: string;
        };
        clientMetadata?: Record<string, string>;
    };
    response: {
        claimsOverrideDetails?: {
            claimsToAddOrOverride?: Record<string, string>;
            claimsToSuppress?: string[];
            groupOverrideDetails?: {
                groupsToOverride?: string[];
                iamRolesToOverride?: string[];
                preferredRole?: string;
            };
        };
    };
}

/**
 * Generic Cognito trigger context
 */
export interface CognitoContext {
    callbackWaitsForEmptyEventLoop: boolean;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}
