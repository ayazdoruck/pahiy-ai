/**
 * Configuration for different environments
 */

// Otomatik environment detection
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

// Backend URL
const BACKEND_URL = isLocalhost 
    ? 'http://localhost:5000'  // Development
    : window.location.origin;   // Production (same origin)

// Export
window.CONFIG = {
    BACKEND_URL: BACKEND_URL,
    IS_DEVELOPMENT: isLocalhost,
    IS_PRODUCTION: !isLocalhost
};

console.log('🔧 Environment:', window.CONFIG.IS_DEVELOPMENT ? 'Development' : 'Production');
console.log('🔗 Backend URL:', window.CONFIG.BACKEND_URL);

