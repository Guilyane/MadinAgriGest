import { reactive } from 'vue';
import { apiRequest, ensureCsrfCookie } from './api';
import {
    clearLastCachedUser,
    getLastCachedUser,
    offlineState,
    saveCachedUser,
    setActiveUser,
} from './offline';
import { t } from './i18n';

function warmOfflineData(user) {
    if (!navigator.onLine) return;

    const paths = ['/dashboard', '/animals', '/livestock-types'];
    if (user.profile_type === 'eleveur') paths.push('/exploitations');

    void Promise.allSettled(paths.map((path) => apiRequest(path))).then((results) => {
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Impossible de préparer les données hors ligne (${paths[index]}).`, result.reason);
            }
        });
    });
}

export const auth = reactive({
    user: null,
    initialized: false,
    initialization: null,

    async initialize() {
        if (this.initialized) return;
        if (this.initialization) return this.initialization;

        this.initialization = (async () => {
            try {
                const response = await apiRequest('/auth/me');
                this.user = response.data;
                await saveCachedUser(this.user);
                await setActiveUser(this.user);
                warmOfflineData(this.user);
            } catch (error) {
                if (error.status === 401) {
                    this.user = null;
                    await setActiveUser(null);
                } else if (!offlineState.isOnline || !navigator.onLine) {
                    this.user = await getLastCachedUser();
                    await setActiveUser(this.user);
                } else {
                    throw error;
                }
            } finally {
                this.initialized = true;
                this.initialization = null;
            }
        })();

        return this.initialization;
    },

    async login(credentials) {
        await ensureCsrfCookie();
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: credentials,
        });
        this.user = response.data;
        await saveCachedUser(this.user);
        await setActiveUser(this.user);
        warmOfflineData(this.user);
    },

    async register(values) {
        await ensureCsrfCookie();
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: values,
        });
        this.user = response.data;
        await saveCachedUser(this.user);
        await setActiveUser(this.user);
        warmOfflineData(this.user);
    },

    async logout() {
        if (!navigator.onLine) {
            throw new Error(t('Une connexion est nécessaire pour se déconnecter en toute sécurité.'));
        }
        await apiRequest('/auth/logout', { method: 'POST' });
        this.user = null;
        await clearLastCachedUser();
        await setActiveUser(null);
    },
});
