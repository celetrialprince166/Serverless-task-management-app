/**
 * Cognito Pre-Signup Trigger
 *
 * Validates email domains before allowing user signup.
 * Only users with approved email domains can create accounts.
 */

import { Context } from 'aws-lambda';
import { Logger } from '../../lib';

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
 * Allowed email domains for signup
 */
const ALLOWED_DOMAINS: string[] = (process.env.ALLOWED_DOMAINS || 'amalitech.com,amalitechtraining.org').split(',');

const logger = new Logger('auth/preSignup');

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
    const parts = email.toLowerCase().split('@');
    return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if email domain is allowed
 */
function isAllowedDomain(email: string): boolean {
    const domain = extractDomain(email);
    return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Pre-Signup Lambda Handler
 */
export const handler = async (
    event: CognitoPreSignupEvent,
    context: Context
): Promise<CognitoPreSignupEvent> => {
    logger.setRequestId(context.awsRequestId);
    logger.info('Pre-signup trigger invoked', {
        userName: event.userName,
        triggerSource: event.triggerSource,
    });

    const email = event.request.userAttributes.email;

    if (!email) {
        logger.error('Email not provided in signup request');
        throw new Error('Email is required');
    }

    if (!isAllowedDomain(email)) {
        const domain = extractDomain(email);
        logger.warn('Signup blocked - unauthorized email domain', {
            email,
            domain,
            allowedDomains: ALLOWED_DOMAINS,
        });
        throw new Error(
            `Email domain '${domain}' is not authorized. Please use an @amalitech.com or @amalitechtraining.org email.`
        );
    }

    logger.info('Email domain validated', { email });

    // Return the event (required by Cognito)
    return event;
};
