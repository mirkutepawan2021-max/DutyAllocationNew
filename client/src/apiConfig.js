/**
 * Helper to get the API URL.
 * Automatically ignores 'localhost' in environment variables if running in production.
 */
export const getApiUrl = () => {
    let apiUrl = import.meta.env.VITE_API_URL || '';

    // FORCE OVERRIDE: If we are in Production mode (Vercel Build), ALWAYS return empty string
    // This safeguards against accidental baked-in localhost variables
    if (import.meta.env.PROD) {
        return '';
    }

    // If we are NOT on localhost (meaning we are on Vercel/Production)
    // AND the configured URL includes 'localhost'
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && apiUrl.includes('localhost')) {
        console.warn('CRITICAL: Detected localhost API URL in production. Overriding to relative path.');
        return ''; // Force relative path
    }

    return apiUrl;
};
