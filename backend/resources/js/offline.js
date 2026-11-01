import { reactive } from 'vue';

const databaseName = 'madinagrigest-offline';
const storeName = 'records';
const databaseVersion = 1;

export const offlineState = reactive({
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    userId: null,
    pendingCount: 0,
    failedCount: 0,
    syncing: false,
    syncError: '',
});

let databasePromise;

function openDatabase() {
    if (!databasePromise) {
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, databaseVersion);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(storeName, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    return databasePromise;
}

async function getRecord(id) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const request = database.transaction(storeName).objectStore(storeName).get(id);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
    });
}

async function getAllRecords() {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const request = database.transaction(storeName).objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putRecord(record) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

async function deleteRecord(id) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        transaction.objectStore(storeName).delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

function userPrefix(userId) {
    return `cache:${userId}:`;
}

function cacheId(userId, path) {
    return `${userPrefix(userId)}${path}`;
}

export async function cacheApiResponse(userId, path, value) {
    if (userId) await putRecord({ id: cacheId(userId, path), value });
}

export async function getCachedApiResponse(userId, path) {
    if (!userId) return null;
    const cached = await getRecord(cacheId(userId, path));
    if (cached) return cached.value;

    const animalId = getPathId(path, /^\/animals\/([^/]+)$/);
    const exploitationId = getPathId(path, /^\/exploitations\/([^/]+)$/);
    if (animalId || exploitationId) {
        const collection = animalId ? '/animals' : '/exploitations';
        const items = (await getCachedApiResponse(userId, collection))?.data;
        const item = items?.find((entry) => String(entry.id) === (animalId ?? exploitationId));
        if (item) {
            const value = {
                data: animalId ? { ...item, offline_history_unavailable: true } : item,
            };
            await cacheApiResponse(userId, path, value);
            return value;
        }
    }

    return null;
}

export async function resolveMappedPath(userId, path) {
    if (!userId || !path.includes('offline-')) return path;
    const idMap = (await getRecord(`mapping:${userId}`))?.value ?? {};
    return path.split('/').map((part) => idMap[part] ?? part).join('/');
}

export async function saveCachedUser(user) {
    if (!user?.id) return;
    const snapshot = JSON.parse(JSON.stringify(user));
    await putRecord({ id: `profile:${snapshot.id}`, value: snapshot });
    await putRecord({ id: 'profile:last-active', userId: snapshot.id });
}

export async function getLastCachedUser() {
    const pointer = await getRecord('profile:last-active');
    return pointer ? (await getRecord(`profile:${pointer.userId}`))?.value ?? null : null;
}

export async function clearLastCachedUser() {
    await deleteRecord('profile:last-active');
}

export async function setActiveUser(user) {
    offlineState.userId = user?.id ?? null;
    await refreshOfflineState(offlineState.userId);
}

export async function getQueuedChanges(userId = offlineState.userId) {
    if (!userId) return [];
    return (await getAllRecords())
        .filter((record) => record.type === 'queued-change' && record.userId === userId)
        .sort((left, right) => left.createdAt - right.createdAt);
}

async function refreshOfflineState(userId = offlineState.userId) {
    const changes = await getQueuedChanges(userId);
    offlineState.pendingCount = changes.filter((change) => change.status === 'pending').length;
    offlineState.failedCount = changes.filter((change) => change.status === 'failed').length;
}

function createTemporaryId() {
    const randomId = globalThis.crypto?.randomUUID?.();
    return `offline-${randomId ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function getPathId(path, expression) {
    return path.match(expression)?.[1] ?? null;
}

async function lookupCachedData(userId, path) {
    return (await getCachedApiResponse(userId, path))?.data ?? [];
}

async function makeOptimisticResponse(userId, path, method, body) {
    const animalId = getPathId(path, /^\/animals\/([^/]+)$/);
    const exploitationId = getPathId(path, /^\/exploitations\/([^/]+)$/);
    const isAnimalCreate = path === '/animals' && method === 'POST';
    const isExploitationCreate = path === '/exploitations' && method === 'POST';
    const isHealthRecordCreate = /^\/animals\/[^/]+\/health-records$/.test(path) && method === 'POST';
    const isReminderCreate = /^\/animals\/[^/]+\/reminders$/.test(path) && method === 'POST';

    if (isAnimalCreate) {
        const id = createTemporaryId();
        const [types, exploitations] = await Promise.all([
            lookupCachedData(userId, '/livestock-types'),
            lookupCachedData(userId, '/exploitations'),
        ]);
        const animal = {
            id,
            ...body,
            status: 'actif',
            livestock_type: types.find((type) => type.id === body.livestock_type_id) ?? null,
            exploitation: exploitations.find((farm) => farm.id === body.exploitation_id) ?? null,
            parent: null,
            health_records: [],
            reminders: [],
        };
        return { data: animal };
    }

    if (isExploitationCreate) return { data: { id: createTemporaryId(), ...body } };

    if (animalId && method === 'PUT') {
        const cached = await getCachedApiResponse(userId, path);
        return { data: { ...(cached?.data ?? { id: animalId }), ...body } };
    }

    if (exploitationId && method === 'PUT') {
        const cached = await getCachedApiResponse(userId, path);
        return { data: { ...(cached?.data ?? { id: exploitationId }), ...body } };
    }

    if (path === '/auth/me' && method === 'PATCH') {
        const cached = await getRecord(`profile:${userId}`);
        const user = { ...(cached?.value ?? {}), ...body };
        await saveCachedUser(user);
        return { data: user };
    }

    if (isHealthRecordCreate || isReminderCreate) {
        return { data: { id: createTemporaryId(), ...body } };
    }

    if (animalId && method === 'DELETE') {
        const cached = await getCachedApiResponse(userId, path);
        return { data: { ...(cached?.data ?? { id: animalId }), status: 'archive' } };
    }

    if (exploitationId && method === 'DELETE') return { data: { id: exploitationId } };

    return { data: null };
}

function mergeResource(value, collection, method, resource) {
    if (!Array.isArray(value?.data)) return value;
    const items = [...value.data];
    const index = items.findIndex((item) => String(item.id) === String(resource.id));

    if (method === 'DELETE') {
        if (collection === 'exploitations') {
            return { ...value, data: items.filter((item) => String(item.id) !== String(resource.id)) };
        } else if (index >= 0) {
            items[index] = { ...items[index], status: 'archive' };
        }
    } else if (index >= 0) {
        items[index] = { ...items[index], ...resource };
    } else if (method === 'POST') {
        items.push(resource);
    }

    return { ...value, data: items };
}

export async function updateCachedResponses(userId, path, method, response) {
    const records = (await getAllRecords()).filter((record) => record.id.startsWith(userPrefix(userId)));
    const animalId = getPathId(path, /^\/animals\/([^/]+)$/);
    const exploitationId = getPathId(path, /^\/exploitations\/([^/]+)$/);
    const childMatch = path.match(/^\/animals\/([^/]+)\/(health-records|reminders)$/);
    const resource = response?.data;

    for (const record of records) {
        const cachedPath = record.id.slice(userPrefix(userId).length);
        let value = record.value;

        if ((path === '/animals' || animalId) && cachedPath === '/animals' && resource) {
            value = mergeResource(value, 'animals', method, resource);
        } else if ((path === '/exploitations' || exploitationId) && cachedPath === '/exploitations' && resource) {
            value = mergeResource(value, 'exploitations', method, resource);
        } else if (animalId && cachedPath === path && resource) {
            value = { ...value, data: { ...(value?.data ?? {}), ...resource } };
        } else if (exploitationId && cachedPath === path && resource) {
            value = { ...value, data: { ...(value?.data ?? {}), ...resource } };
        } else if (childMatch && cachedPath === `/animals/${childMatch[1]}` && resource) {
            const childKey = childMatch[2] === 'health-records' ? 'health_records' : 'reminders';
            const animal = value?.data;
            if (animal) {
                const children = [...(animal[childKey] ?? [])];
                const index = children.findIndex((item) => String(item.id) === String(resource.id));
                if (method === 'DELETE') {
                    if (index >= 0) children.splice(index, 1);
                } else if (index >= 0) {
                    children[index] = { ...children[index], ...resource };
                } else if (method === 'POST') {
                    children.push(resource);
                }
                value = { ...value, data: { ...animal, [childKey]: children } };
            }
        }

        if (value !== record.value) await putRecord({ ...record, value });
    }

    if (path === '/animals' && method === 'POST' && resource) {
        await cacheApiResponse(userId, `/animals/${resource.id}`, { data: resource });
    }

    if (path === '/exploitations' && method === 'POST' && resource) {
        await cacheApiResponse(userId, `/exploitations/${resource.id}`, { data: resource });
    }

    if ((animalId || exploitationId) && method === 'PUT' && resource) {
        await cacheApiResponse(userId, path, { data: resource });
    }
}

export async function cacheApiResponseWithPendingChanges(userId, path, value) {
    await cacheApiResponse(userId, path, value);

    for (const change of await getQueuedChanges(userId)) {
        await updateCachedResponses(userId, change.path, change.method, change.response);
    }
}

export async function queueOfflineChange(userId, path, method, body) {
    if (!userId) {
        throw new Error('Connectez-vous en ligne avant d’utiliser les fonctions hors ligne.');
    }

    const requestBody = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
    const response = await makeOptimisticResponse(userId, path, method, requestBody);
    const queuedChanges = await getQueuedChanges(userId);
    const change = {
        id: createTemporaryId(),
        type: 'queued-change',
        userId,
        path,
        method,
        body: requestBody,
        response,
        status: 'pending',
        createdAt: Math.max(Date.now(), ((queuedChanges[queuedChanges.length - 1]?.createdAt) ?? 0) + 1),
    };

    await putRecord(change);
    if (path === '/auth/me' && response.data) await saveCachedUser(response.data);
    await updateCachedResponses(userId, path, method, response);
    await refreshOfflineState(userId);
    if (offlineState.isOnline) {
        queueMicrotask(() => syncQueuedChanges(userId));
    }
    return response;
}

function csrfToken() {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

function replaceIds(value, idMap) {
    if (Array.isArray(value)) return value.map((item) => replaceIds(item, idMap));
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [
            key,
            (key === 'id' || key.endsWith('_id')) && idMap[String(item)]
                ? idMap[String(item)]
                : replaceIds(item, idMap),
        ]));
    }
    return value;
}

async function replaceTemporaryId(userId, temporaryId, serverId) {
    const records = await getAllRecords();
    const idMapRecordId = `mapping:${userId}`;
    const idMapRecord = records.find((record) => record.id === idMapRecordId);
    const idMap = { ...(idMapRecord?.value ?? {}), [temporaryId]: serverId };

    await putRecord({ id: idMapRecordId, value: idMap });

    for (const record of records) {
        if (record.id.startsWith(userPrefix(userId))) {
            const cachedPath = record.id.slice(userPrefix(userId).length);
            const updatedPath = cachedPath.split('/').map((part) => idMap[part] ?? part).join('/');
            await deleteRecord(record.id);
            await putRecord({
                ...record,
                id: cacheId(userId, updatedPath),
                value: replaceIds(record.value, idMap),
            });
        } else if (record.type === 'queued-change' && record.userId === userId) {
            await putRecord({
                ...record,
                path: record.path.split('/').map((part) => idMap[part] ?? part).join('/'),
                body: replaceIds(record.body, idMap),
                response: replaceIds(record.response, idMap),
            });
        }
    }
}

export async function syncQueuedChanges(userId = offlineState.userId) {
    if (!userId || !offlineState.isOnline || offlineState.syncing) return;

    offlineState.syncing = true;
    offlineState.syncError = '';

    try {
        const changes = await getQueuedChanges(userId);
        let idMap = (await getRecord(`mapping:${userId}`))?.value ?? {};

        for (const change of changes) {
            if (change.status === 'failed') {
                offlineState.syncError = change.error;
                break;
            }

            const path = change.path
                .split('/')
                .map((part) => idMap[part] ?? part)
                .join('/');
            const body = replaceIds(change.body, idMap);
            const headers = { Accept: 'application/json' };
            const options = { method: change.method, headers, credentials: 'same-origin' };

            if (body !== undefined) {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            if (!['GET', 'HEAD', 'OPTIONS'].includes(change.method)) {
                headers['X-XSRF-TOKEN'] = csrfToken();
            }

            let response;
            try {
                response = await fetch(path.startsWith('/sanctum') ? path : `/api${path}`, options);
            } catch (error) {
                offlineState.isOnline = false;
                offlineState.syncError = error.message || 'Réseau indisponible.';
                break;
            }

            let payload = null;
            if (response.status !== 204) {
                try {
                    payload = await response.json();
                } catch (error) {
                    offlineState.syncError = `Réponse serveur illisible : ${error.message}`;
                    break;
                }
            }

            if (!response.ok) {
                const message = response.status === 401
                    ? 'La session a expiré. Reconnectez-vous pour synchroniser les changements.'
                    : payload?.message ?? `La synchronisation a échoué (HTTP ${response.status}).`;

                if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
                    await putRecord({ ...change, status: 'failed', error: message });
                }
                offlineState.syncError = message;
                break;
            }

            const temporaryId = change.response?.data?.id;
            const serverId = payload?.data?.id;
            if (
                typeof temporaryId === 'string'
                && temporaryId.startsWith('offline-')
                && serverId
                && !idMap[temporaryId]
            ) {
                await replaceTemporaryId(userId, temporaryId, serverId);
                idMap = { ...idMap, [temporaryId]: serverId };
            }
            await deleteRecord(change.id);
            await refreshOfflineState(userId);
        }
    } finally {
        offlineState.syncing = false;
        await refreshOfflineState(userId);
    }
}

export async function retryFailedChanges(userId = offlineState.userId) {
    const changes = await getQueuedChanges(userId);
    for (const change of changes) {
        if (change.status === 'failed') {
            await putRecord({ ...change, status: 'pending', error: undefined });
        }
    }
    offlineState.syncError = '';
    offlineState.isOnline = true;
    await refreshOfflineState(userId);
    return syncQueuedChanges(userId);
}

export async function discardFailedChange(userId = offlineState.userId) {
    const failed = (await getQueuedChanges(userId)).find((change) => change.status === 'failed');
    if (failed) await deleteRecord(failed.id);
    await refreshOfflineState(userId);
}

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        offlineState.isOnline = true;
    });
    window.addEventListener('offline', () => {
        offlineState.isOnline = false;
    });
}
