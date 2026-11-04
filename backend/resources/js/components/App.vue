<script setup>
import { watch } from 'vue';
import { auth } from '../auth';
import {
    discardFailedChange,
    offlineState,
    retryFailedChanges,
    setActiveUser,
    syncQueuedChanges,
} from '../offline';
import LanguageSwitcher from './LanguageSwitcher.vue';
import { t } from '../i18n';

watch(
    [() => offlineState.isOnline, () => auth.user?.id],
    async ([isOnline]) => {
        await setActiveUser(auth.user);
        if (isOnline && auth.user?.id) await syncQueuedChanges(auth.user.id);
    },
    { immediate: true },
);

async function retrySync() {
    await retryFailedChanges(auth.user?.id);
}

async function discardFailed() {
    if (!window.confirm(t('Supprimer définitivement le changement bloqué de cet appareil ?'))) return;
    await discardFailedChange(auth.user?.id);
    await syncQueuedChanges(auth.user?.id);
}
</script>

<template>
    <LanguageSwitcher />
    <aside
        v-if="!offlineState.isOnline || offlineState.pendingCount || offlineState.failedCount || offlineState.syncing"
        class="offline-banner"
        :class="{ 'offline-banner-error': offlineState.syncError }"
        role="status"
        aria-live="polite"
    >
        <span v-if="!offlineState.isOnline">
            {{ t('Hors ligne. Les données déjà consultées restent disponibles ;') }}
            <template v-if="offlineState.pendingCount">
                {{ offlineState.pendingCount }} {{ t(offlineState.pendingCount > 1 ? 'changements' : 'changement') }} {{ t('en attente.') }}
                <button type="button" class="offline-action" @click="retrySync">{{ t('Tenter la synchronisation') }}</button>
            </template>
            <template v-else>{{ t('les changements seront synchronisés au retour du réseau.') }}</template>
        </span>
        <span v-else-if="offlineState.syncing">{{ t('Synchronisation des changements…') }}</span>
        <span v-else-if="offlineState.syncError">
            {{ t('Synchronisation bloquée : {error}', { error: offlineState.syncError }) }}
            <button type="button" class="offline-action" @click="retrySync">{{ t('Réessayer') }}</button>
            <button v-if="offlineState.failedCount" type="button" class="offline-action" @click="discardFailed">
                {{ t('Annuler le changement bloqué') }}
            </button>
        </span>
        <span v-else-if="offlineState.pendingCount">
            {{ offlineState.pendingCount }} {{ t(offlineState.pendingCount > 1 ? 'changements' : 'changement') }} {{ t('en attente de synchronisation.') }}
        </span>
    </aside>
    <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
    </RouterView>
</template>
