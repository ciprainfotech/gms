/**
 * Production Enterprise Fetch Client with Intelligent In-Memory Caching,
 * Concurrent Request Deduplication, and Global Session Interception.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cipra-gms.onrender.com/api';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// In-Memory Cache Store (URL -> { data: any, timestamp: number, ttl: number })
const requestCache = new Map();

// In-Flight Request Deduplication Map (URL -> Promise)
const inFlightRequests = new Map();

// Endpoints that are safe to cache automatically with their default TTLs (in milliseconds)
const CACHEABLE_ROUTES = [
    { pattern: /^\/meta\/makes/, ttl: 10 * 60 * 1000 },      // 10 minutes for vehicle makes
    { pattern: /^\/meta\/models\//, ttl: 10 * 60 * 1000 },    // 10 minutes for vehicle models
    { pattern: /^\/meta\/colors/, ttl: 30 * 60 * 1000 },      // 30 minutes
    { pattern: /^\/meta\/fuel-types/, ttl: 30 * 60 * 1000 },  // 30 minutes
    { pattern: /^\/profile$/, ttl: 2 * 60 * 1000 },           // 2 minutes for garage profile
];

/**
 * Check if an endpoint matches any cacheable route pattern
 */
const getRouteCacheTTL = (endpoint) => {
    for (const route of CACHEABLE_ROUTES) {
        if (route.pattern.test(endpoint)) {
            return route.ttl;
        }
    }
    return 0;
};

/**
 * Invalidate in-memory cache matching a pattern or string
 */
export const invalidateCache = (pattern) => {
    if (!pattern) {
        requestCache.clear();
        return;
    }
    for (const key of requestCache.keys()) {
        if (typeof pattern === 'string' && key.includes(pattern)) {
            requestCache.delete(key);
        } else if (pattern instanceof RegExp && pattern.test(key)) {
            requestCache.delete(key);
        }
    }
};

/**
 * Centralized Global 401 Session Interceptor
 */
const handleUnauthorized = (endpoint) => {
    // Only handle if not the initial check or login endpoint
    if (!endpoint.includes('/auth/me') && !endpoint.includes('/auth/login')) {
        console.warn(`[API] Session expired or unauthorized for endpoint: ${endpoint}`);
        // Clear cached auth data
        localStorage.removeItem('masterWorkingDate');
        // Dispatch session expired event
        window.dispatchEvent(new CustomEvent('session_expired'));
    }
};

const api = {
    /**
     * Enhanced GET with In-Memory Caching & Request Deduplication
     * @param {string} endpoint - API route (e.g. '/invoices')
     * @param {object} options - Optional parameters { bypassCache: boolean, ttl: number }
     */
    async get(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const ttl = options.ttl || getRouteCacheTTL(endpoint);
        const useCache = !options.bypassCache && ttl > 0;

        // 1. Check in-memory cache
        if (useCache && requestCache.has(url)) {
            const cached = requestCache.get(url);
            if (Date.now() - cached.timestamp < cached.ttl) {
                // Return a fresh cloned Response object from cached JSON
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    statusText: 'OK (Cached)',
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
                });
            } else {
                requestCache.delete(url);
            }
        }

        // 2. Check in-flight request deduplication
        if (inFlightRequests.has(url)) {
            try {
                const pendingData = await inFlightRequests.get(url);
                return new Response(JSON.stringify(pendingData), {
                    status: 200,
                    statusText: 'OK (Deduplicated)',
                    headers: { 'Content-Type': 'application/json', 'X-Deduplicated': 'HIT' }
                });
            } catch (err) {
                // Fallback to fresh request if in-flight failed
            }
        }

        // 3. Perform fresh network request
        const fetchPromise = (async () => {
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
            });

            if (res.status === 401) {
                handleUnauthorized(endpoint);
            }

            if (res.ok && useCache) {
                try {
                    const clonedRes = res.clone();
                    const jsonData = await clonedRes.json();
                    requestCache.set(url, {
                        data: jsonData,
                        timestamp: Date.now(),
                        ttl: ttl
                    });
                } catch (e) {
                    // Ignore non-json responses
                }
            }

            return res;
        })();

        // Track in-flight if cacheable
        if (useCache) {
            inFlightRequests.set(url, fetchPromise.then(r => r.clone().json()).catch(() => null));
            fetchPromise.finally(() => {
                inFlightRequests.delete(url);
            });
        }

        return await fetchPromise;
    },

    async post(endpoint, body) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        // Auto-invalidate matching caches on mutations
        if (endpoint.includes('/profile')) invalidateCache('/profile');
        if (endpoint.includes('/customers')) invalidateCache('/customers');

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (res.status === 401) {
            handleUnauthorized(endpoint);
        }

        return res;
    },

    async put(endpoint, body) {
        const url = `${API_BASE_URL}${endpoint}`;

        // Auto-invalidate matching caches on mutations
        if (endpoint.includes('/profile')) invalidateCache('/profile');
        if (endpoint.includes('/customers')) invalidateCache('/customers');

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (res.status === 401) {
            handleUnauthorized(endpoint);
        }

        return res;
    },

    async patch(endpoint, body) {
        const url = `${API_BASE_URL}${endpoint}`;

        if (endpoint.includes('/profile')) invalidateCache('/profile');
        if (endpoint.includes('/customers')) invalidateCache('/customers');

        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (res.status === 401) {
            handleUnauthorized(endpoint);
        }

        return res;
    },

    async delete(endpoint) {
        const url = `${API_BASE_URL}${endpoint}`;

        if (endpoint.includes('/profile')) invalidateCache('/profile');
        if (endpoint.includes('/customers')) invalidateCache('/customers');

        const res = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (res.status === 401) {
            handleUnauthorized(endpoint);
        }

        return res;
    },

    async upload(endpoint, formData) {
        const url = `${API_BASE_URL}${endpoint}`;
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (res.status === 401) {
            handleUnauthorized(endpoint);
        }

        return res;
    },

    // Utility methods
    clearCache: () => requestCache.clear(),
    invalidateCache: invalidateCache
};

export default api;