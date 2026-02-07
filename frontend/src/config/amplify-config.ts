/**
 * AWS Amplify Configuration
 * Connects frontend to Cognito for authentication
 *
 * Uses environment variables (VITE_*) for deployment flexibility.
 * Set these in Amplify Console or via .env for local development.
 */
import type { ResourcesConfig } from 'aws-amplify';

// Fallbacks for local dev when .env is not configured
const userPoolId =
    import.meta.env.VITE_COGNITO_USER_POOL_ID ?? 'eu-west-1_FYTRu8tiS';
const userPoolClientId =
    import.meta.env.VITE_COGNITO_CLIENT_ID ?? '7hcomukkp5j7i36elpggbnld94';
const region = import.meta.env.VITE_AWS_REGION ?? 'eu-west-1';

const amplifyConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolId,
            userPoolClientId,
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
        'https://a9206bd8od.execute-api.eu-west-1.amazonaws.com/dev/api/v1',
    region: region,
};

export default amplifyConfig;
