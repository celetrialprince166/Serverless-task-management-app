/**
 * Cognito Post-Confirmation & Post-Authentication Trigger
 *
 * Creates or ensures a user record in DynamoDB:
 * - After successful signup confirmation (PostConfirmation_ConfirmSignUp)
 * - After every successful sign-in (PostAuthentication_Authentication)
 *
 * This ensures all authenticated users have a corresponding database entry,
 * including users who signed up before the trigger was deployed.
 */

import { Context } from 'aws-lambda';
import {
    CognitoIdentityProviderClient,
    AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger, TABLES, putItem, updateItem, buildUpdateExpression } from '../../lib';
import { UserItem, UserRole } from '../../models';

type TriggerSource =
    | 'PostConfirmation_ConfirmSignUp'
    | 'PostConfirmation_ConfirmForgotPassword'
    | 'PostAuthentication_Authentication';

/**
 * Cognito trigger event (Post-Confirmation or Post-Authentication)
 */
export interface CognitoPostConfirmationEvent {
    version: string;
    triggerSource: TriggerSource;
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
            name?: string;
            email_verified?: string;
            'cognito:user_status'?: string;
            'custom:role'?: string;
            [key: string]: string | undefined;
        };
        clientMetadata?: Record<string, string>;
    };
    response: Record<string, unknown>;
}

const logger = new Logger('auth/postConfirmation');

/**
 * Extract user role from attributes or default to MEMBER
 */
function determineUserRole(userAttributes: CognitoPostConfirmationEvent['request']['userAttributes']): UserRole {
    const customRole = userAttributes['custom:role'];
    if (customRole && (customRole === 'ADMIN' || customRole === 'admin')) {
        return 'ADMIN';
    }
    return 'MEMBER';
}

/**
 * Whether this trigger should ensure user exists in DynamoDB
 */
function shouldEnsureUserInDb(triggerSource: TriggerSource): boolean {
    // Run on sign-up confirmation or on every sign-in
    return (
        triggerSource === 'PostConfirmation_ConfirmSignUp' ||
        triggerSource === 'PostAuthentication_Authentication'
    );
}

const COGNITO_GROUP_ADMIN = 'Admin';

/**
 * Get user's role from Cognito groups (so DynamoDB stays in sync when user is in Admin group).
 */
async function getRoleFromCognitoGroups(userPoolId: string, username: string): Promise<UserRole> {
    const client = new CognitoIdentityProviderClient({});
    const result = await client.send(
        new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: username,
        })
    );
    const groups = result.Groups ?? [];
    const isAdmin = groups.some((g) => g.GroupName === COGNITO_GROUP_ADMIN);
    return isAdmin ? 'ADMIN' : 'MEMBER';
}

/**
 * Post-Confirmation / Post-Authentication Lambda Handler
 * Creates user record in DynamoDB after signup confirmation or sign-in
 */
export const handler = async (
    event: CognitoPostConfirmationEvent,
    context: Context
): Promise<CognitoPostConfirmationEvent> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Cognito trigger invoked', {
        userName: event.userName,
        triggerSource: event.triggerSource,
    });

    // Skip only password-reset confirmation; process sign-up and sign-in
    if (!shouldEnsureUserInDb(event.triggerSource)) {
        logger.info('Skipping trigger (no user sync needed)', {
            triggerSource: event.triggerSource,
        });
        return event;
    }

    const { userAttributes } = event.request;
    const userId = userAttributes.sub; // Cognito user ID
    const email = userAttributes.email;
    const name = userAttributes.name || email?.split('@')[0] || 'User';
    const now = new Date().toISOString();

    if (!userId || !email) {
        logger.error('Missing required user attributes', { userId, email });
        throw new Error('Missing required user attributes (sub or email)');
    }

    // Determine user role
    const role = determineUserRole(userAttributes);

    // Create user item for DynamoDB
    const userItem: UserItem = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        GSI1PK: `EMAIL#${email.toLowerCase()}`,
        id: userId,
        email: email.toLowerCase(),
        name,
        role,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
    };

    try {
        await putItem({
            TableName: TABLES.USERS,
            Item: userItem,
            ConditionExpression: 'attribute_not_exists(PK)', // Don't overwrite existing users
        });

        logger.info('User record created successfully', {
            userId,
            email,
            role,
        });
    } catch (error: unknown) {
        // If user already exists, sync role from Cognito groups so DynamoDB matches (e.g. admin added via console)
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ConditionalCheckFailedException') {
            logger.info('User already exists in database; syncing role from Cognito', { userId, email });
            try {
                const roleFromCognito = await getRoleFromCognitoGroups(event.userPoolId, event.userName);
                const now = new Date().toISOString();
                const updates: Record<string, unknown> = { role: roleFromCognito, updatedAt: now };
                const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
                    buildUpdateExpression(updates);
                await updateItem<UserItem>({
                    TableName: TABLES.USERS,
                    Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
                    UpdateExpression,
                    ExpressionAttributeNames,
                    ExpressionAttributeValues,
                });
                logger.info('Synced user role from Cognito to DynamoDB', { userId, role: roleFromCognito });
            } catch (syncErr) {
                logger.warn('Could not sync role from Cognito (non-fatal)', { err: syncErr, userId });
            }
        } else {
            logger.error('Failed to create user record', { error, userId, email });
            throw error;
        }
    }

    // Return the event (required by Cognito)
    return event;
};
