import {
    cacheApiResponseWithPendingChanges,
    getCachedApiResponse,
    offlineState,
    queueOfflineChange,
    resolveMappedPath,
    saveCachedUser,
    updateCachedResponses,
} from './offline';

export class ApiError extends Error {
    constructor(message, status, errors = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

function csrfToken() {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
    const userId = offlineState.userId;
    path = await resolveMappedPath(userId, path);

    if (method === 'GET' && !offlineState.isOnline) {
        const cached = await getCachedApiResponse(userId, path);
        if (cached !== null) return cached;
    }
    if (!offlineState.isOnline && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        if (path === '/auth/logout') {
            throw new ApiError('Une connexion est nécessaire pour se déconnecter en toute sécurité.', 0);
        }
        return queueOfflineChange(userId, path, method, body);
    }

    const headers = { Accept: 'application/json' };
    const options = {
        method,
        headers,
        credentials: 'same-origin',
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers['X-XSRF-TOKEN'] = csrfToken();
    }

    let response;
    try {
        response = await fetch(path.startsWith('/sanctum')
            ? path
            : `/api${path}`, options);
    } catch (error) {
        offlineState.isOnline = false;
        if (method === 'GET') {
            const cached = await getCachedApiResponse(userId, path);
            if (cached !== null) return cached;
        } else if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            if (path === '/auth/logout') {
                throw new ApiError('Une connexion est nécessaire pour se déconnecter en toute sécurité.', 0);
            }
            return queueOfflineChange(userId, path, method, body);
        }

        throw error;
    }

    const payload = response.status === 204 ? null : await response.json();

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? 'Une erreur est survenue. Réessaie plus tard.',
            response.status,
            payload?.errors ?? {},
        );
    }

    if (method === 'GET' && userId) {
        await cacheApiResponseWithPendingChanges(userId, path, payload);
    }
    if (userId && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const resource = payload ?? (method === 'DELETE'
            ? { data: { id: path.split('/').filter(Boolean).at(-1) } }
            : null);
        if (resource) await updateCachedResponses(userId, path, method, resource);
    }
    if (path === '/auth/me' && payload?.data) await saveCachedUser(payload.data);

    return payload;
}

export async function ensureCsrfCookie() {
    const response = await fetch('/sanctum/csrf-cookie', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new ApiError('Impossible de préparer la session sécurisée.', response.status);
    }
}
