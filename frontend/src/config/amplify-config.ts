/**
 * AWS Amplify Configuration
 * Connects frontend to Cognito for authentication
 *
 * Uses environment variables (VITE_*) for deployment flexibility.
 * Set these in Amplify Console or via .env for local development.
 */
import type { ResourcesConfig } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION ?? 'eu-west-1';

if (!userPoolId || !userPoolClientId) {
    console.warn(
        'Amplify Auth config missing. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in .env or Amplify environment variables.'
    );
}

const amplifyConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolId: userPoolId ?? '',
            userPoolClientId: userPoolClientId ?? '',
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
            },
            passwordFormat: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true,
            },
        },
    },
};

// API configuration - uses env var for deployment flexibility
export const apiConfig = {
    baseUrl:
        import.meta.env.VITE_API_BASE_URL ??
        '',
    region: region,
};

export default amplifyConfig;
