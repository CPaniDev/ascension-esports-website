/**
 * Security Utilities Module
 * Provides input validation, sanitization, and security helper functions
 * for the Ascension Esports website.
 */

const SecurityUtils = {
    // Input length limits
    LIMITS: {
        USERNAME_MAX: 100,
        PASSWORD_MAX: 128,
        TEXT_MAX: 1000,
        CHAMPION_NAME_MAX: 50,
        NUMBER_MAX: 999999,
        QUERY_MAX: 2048,
    },

    /**
     * XSS Protection: Sanitize text input for display
     * Uses textContent assignment to neutralize HTML
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        if (text.length > this.LIMITS.TEXT_MAX) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.textContent;
    },

    /**
     * XSS Protection: Escape HTML special characters for attribute contexts
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        if (text.length > this.LIMITS.TEXT_MAX) return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return text.replace(/[&<>"'`=\/]/g, (m) => map[m]);
    },

    /**
     * Validate and sanitize a username
     * Only allows alphanumeric characters, hyphens, and underscores
     */
    validateUsername(username) {
        if (typeof username !== 'string') return null;
        if (username.length === 0 || username.length > this.LIMITS.USERNAME_MAX) return null;

        // Only allow alphanumeric, hyphens, underscores
        const sanitized = username.replace(/[^a-zA-Z0-9_-]/g, '');
        return sanitized.length > 0 ? sanitized : null;
    },

    /**
     * Validate password (basic length check - server does real validation)
     */
    validatePassword(password) {
        if (typeof password !== 'string') return null;
        if (password.length === 0 || password.length > this.LIMITS.PASSWORD_MAX) return null;
        return password;
    },

    /**
     * Validate and sanitize champion name
     * Allows alphanumeric, spaces, and apostrophes (for names like Kai'Sa)
     */
    validateChampionName(name) {
        if (typeof name !== 'string') return null;
        if (name.length === 0 || name.length > this.LIMITS.CHAMPION_NAME_MAX) return null;

        // Allow alphanumeric, spaces, and apostrophes (for names like Kai'Sa)
        const sanitized = name.replace(/[^a-zA-Z0-9\s']/g, '');
        return sanitized.trim();
    },

    /**
     * Validate and sanitize number input
     */
    sanitizeNumber(value, defaultValue = 0, min = 0, max = 999) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return defaultValue;
        if (num < min) return min;
        if (num > max) return max;
        return num;
    },

    /**
     * Validate match result (only 'win' or 'loss' allowed)
     */
    validateMatchResult(result) {
        const valid = ['win', 'loss'];
        return valid.includes(result) ? result : 'loss';
    },

    /**
     * Validate date string (ISO format)
     */
    validateDate(dateString) {
        if (typeof dateString !== 'string') return null;

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;

        // Reject dates in the future (prevents data pollution)
        const now = new Date();
        if (date > now) return null;

        // Reject dates older than 5 years (prevents garbage data)
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        if (date < fiveYearsAgo) return null;

        return date.toISOString();
    },

    /**
     * Check for common XSS patterns in input
     * Returns true if suspicious content detected
     */
    containsXssPatterns(input) {
        if (typeof input !== 'string') return false;

        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<)[^<]*<\/script>/gi,
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<form/gi,
            /<input/gi,
            /<textarea/gi,
            /<svg[^>]*on/gi,
            /<img[^>]*on\w+=/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
            /url\s*\(\s*['"]*javascript/gi,
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    },

    /**
     * Check for SQL injection patterns
     * Returns true if suspicious content detected
     */
    containsSqlInjection(input) {
        if (typeof input !== 'string') return false;

        const sqlPatterns = [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
            /((\%27)|(\'))union/gi,
            /exec(\s|\+)+(s|x)p/gi,
            /UNION\s+SELECT/gi,
            /INSERT\s+INTO/gi,
            /DELETE\s+FROM/gi,
            /DROP\s+TABLE/gi,
            /ALTER\s+TABLE/gi,
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    },

    /**
     * Validate player ID
     * Only allows lowercase alphanumeric and underscores
     */
    validatePlayerId(id) {
        if (typeof id !== 'string') return null;
        if (!/^[a-z0-9_]+$/.test(id)) return null;
        if (id.length === 0 || id.length > 50) return null;
        return id;
    },

    /**
     * Generate a cryptographically secure random token
     */
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            // Fallback for older browsers (less secure)
            for (let i = 0; i < length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Hash a password using SHA-256
     * Note: This is for client-side comparison only. Real auth uses server-side bcrypt/Argon2.
     */
    async hashPassword(password) {
        if (typeof password !== 'string') return '';
        if (password.length > this.LIMITS.PASSWORD_MAX) return '';

        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate email address
     */
    validateEmail(email) {
        if (typeof email !== 'string') return null;
        if (email.length > 254) return null;

        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return null;

        return this.sanitizeText(email);
    },

    /**
     * Sanitize URL for safe use
     */
    sanitizeUrl(url) {
        if (typeof url !== 'string') return null;
        if (url.length > 2048) return null;

        // Only allow http and https protocols
        const allowedProtocols = ['http:', 'https:'];
        try {
            const parsed = new URL(url);
            if (!allowedProtocols.includes(parsed.protocol)) {
                return null;
            }
            return url;
        } catch {
            // Try with base URL
            try {
                const parsed = new URL(url, window.location.origin);
                if (!allowedProtocols.includes(parsed.protocol)) {
                    return null;
                }
                return parsed.href;
            } catch {
                return null;
            }
        }
    },

    /**
     * Rate limiting check
     * Uses sessionStorage to track attempts
     */
    isRateLimited(storageKey, maxAttempts = 5, windowMinutes = 15) {
        const attempts = parseInt(sessionStorage.getItem(`${storageKey}_attempts`) || '0', 10);
        const lastAttempt = parseInt(sessionStorage.getItem(`${storageKey}_timestamp`) || '0', 10);
        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;

        if (now - lastAttempt > windowMs) {
            sessionStorage.removeItem(`${storageKey}_attempts`);
            sessionStorage.removeItem(`${storageKey}_timestamp`);
            return false;
        }

        return attempts >= maxAttempts;
    },

    /**
     * Record a rate limit attempt
     */
    recordRateLimitAttempt(storageKey) {
        const attempts = parseInt(sessionStorage.getItem(`${storageKey}_attempts`) || '0', 10);
        sessionStorage.setItem(`${storageKey}_attempts`, (attempts + 1).toString());
        sessionStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
    },

    /**
     * Clear rate limit for a given key
     */
    clearRateLimit(storageKey) {
        sessionStorage.removeItem(`${storageKey}_attempts`);
        sessionStorage.removeItem(`${storageKey}_timestamp`);
    },

    /**
     * Comprehensive input validator for match data
     * Returns validated data or null if invalid
     */
    validateMatchData(data) {
        if (!data || typeof data !== 'object') return null;

        const validated = {};

        // Player ID
        const playerId = this.validatePlayerId(data.playerId);
        if (!playerId) return null;
        validated.playerId = playerId;

        // Champion name
        const champion = this.validateChampionName(data.champion);
        if (!champion) return null;
        validated.champion = champion;

        // Result
        validated.result = this.validateMatchResult(data.result);

        // Stats
        validated.kills = this.sanitizeNumber(data.kills, 0, 0, 999);
        validated.deaths = this.sanitizeNumber(data.deaths, 0, 0, 999);
        validated.assists = this.sanitizeNumber(data.assists, 0, 0, 999);

        // Date
        const date = this.validateDate(data.date);
        if (!date) return null;
        validated.date = date;

        // Check for any malicious content
        const allFields = `${data.playerId}${data.champion}${data.result}${data.date}`;
        if (this.containsXssPatterns(allFields) || this.containsSqlInjection(allFields)) {
            console.warn('SecurityUtils: Potentially malicious content detected');
            return null;
        }

        return validated;
    },

    /**
     * Set secure cookie (wrapper for document.cookie)
     * Note: HttpOnly can only be set server-side
     */
    setSecureCookie(name, value, options = {}) {
        const defaults = {
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 3600 // 1 hour
        };
        const opts = { ...defaults, ...options };

        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        if (opts.secure) cookieString += '; Secure';
        if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
        if (opts.path) cookieString += `; Path=${opts.path}`;
        if (opts.maxAge) cookieString += `; Max-Age=${opts.maxAge}`;

        document.cookie = cookieString;
    },

    /**
     * Clear a cookie
     */
    clearCookie(name) {
        document.cookie = `${encodeURIComponent(name)}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=strict`;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.SecurityUtils = SecurityUtils;
}
