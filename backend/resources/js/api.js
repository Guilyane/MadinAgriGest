import {
    cacheApiResponseWithPendingChanges,
    getCachedApiResponse,
    offlineState,
    queueOfflineChange,
    resolveMappedPath,
    saveCachedUser,
    updateCachedResponses,
} from './offline';
import { t, translateError } from './i18n';

export class ApiError extends Error {
    constructor(message, status, errors = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = Object.fromEntries(
            Object.entries(errors).map(([field, messages]) => [
                field,
                (Array.isArray(messages) ? messages : [messages]).map(translateError),
            ]),
        );
    }
}

function connectionError() {
    return new ApiError(
        t('Impossible de contacter le serveur. Vérifiez votre connexion et que le serveur de l’application est démarré, puis réessayez.'),
        0,
    );
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
            throw new ApiError(t('Une connexion est nécessaire pour se déconnecter en toute sécurité.'), 0);
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
        if (['/auth/login', '/auth/register'].includes(path)) {
            throw connectionError();
        }

        offlineState.isOnline = false;
        if (method === 'GET') {
            const cached = await getCachedApiResponse(userId, path);
            if (cached !== null) return cached;
        } else if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            if (path === '/auth/logout') {
                throw new ApiError(t('Une connexion est nécessaire pour se déconnecter en toute sécurité.'), 0);
            }
            return queueOfflineChange(userId, path, method, body);
        }

        throw connectionError();
    }

    if (!response.ok && response.status >= 500) {
        throw new ApiError(
            t('Une erreur technique est survenue sur le serveur. Réessayez ou contactez l’administrateur.'),
            response.status,
        );
    }

    let payload = null;
    if (response.status !== 204) {
        try {
            payload = await response.json();
        } catch {
            if (!response.ok) {
                throw new ApiError(
                    t('Le serveur a rencontré une erreur. Réessayez plus tard ou contactez l’administrateur.'),
                    response.status,
                );
            }
            throw new ApiError(t('Le serveur a envoyé une réponse invalide.'), response.status);
        }
    }

    if (!response.ok) {
        throw new ApiError(
            translateError(payload?.message ?? t('Une erreur est survenue. Réessaie plus tard.')),
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
    let response;
    try {
        response = await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        });
    } catch {
        throw connectionError();
    }

    if (!response.ok) {
        throw new ApiError(
            t('Impossible de préparer la session sécurisée. Vérifiez que le serveur de l’application est démarré, puis réessayez.'),
            response.status,
        );
    }
}
