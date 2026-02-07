import { useState, useCallback } from 'react';

interface Use {{ HookName }}Result {
    isLoading: boolean;
    error: Error | null;
    execute: () => Promise<void>;
}

export const use{{ HookName }} = (): Use{ { HookName } }Result => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Async operation here
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isLoading, error, execute };
};
