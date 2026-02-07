/**
 * Cognito Pre-Signup Trigger
 *
 * Validates email domains before allowing user signup.
 * Only users with approved email domains can create accounts.
 */

import { CognitoPreSignupEvent, CognitoContext } from './types';

/**
 * Allowed email domains for signup
 * Users with emails from other domains will be blocked
 */
const ALLOWED_DOMAINS: string[] = [
    'amalitech.com',
    'amalitechtraining.org',
];

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
 *
 * Called by Cognito before user signup is completed.
 * Throwing an error blocks the signup.
 */
export const handler = async (
    event: CognitoPreSignupEvent,
    _context: CognitoContext
): Promise<CognitoPreSignupEvent> => {
    console.log('Pre-signup trigger invoked', {
        userName: event.userName,
        triggerSource: event.triggerSource,
    });

    const email = event.request.userAttributes.email;

    if (!email) {
        console.error('Email not provided in signup request');
        throw new Error('Email is required');
    }

    if (!isAllowedDomain(email)) {
        const domain = extractDomain(email);
        console.warn('Signup blocked - unauthorized email domain', {
            email,
            domain,
            allowedDomains: ALLOWED_DOMAINS,
        });
        throw new Error(
            `Email domain '${domain}' is not authorized. Please use an @amalitech.com or @amalitechtraining.org email.`
        );
    }

    console.log('Email domain validated', { email });

    // Optional: Auto-confirm user (skip email verification)
    // event.response.autoConfirmUser = true;
    // event.response.autoVerifyEmail = true;

    return event;
};
