<script setup>
import { onMounted, ref } from 'vue';
import { apiRequest } from '../api';
import AppLayout from '../components/AppLayout.vue';
import AlertMessage from '../components/AlertMessage.vue';
import { t } from '../i18n';

const animals = ref([]);
const error = ref('');
const loading = ref(true);

onMounted(loadAnimals);

async function loadAnimals() {
    try {
        const response = await apiRequest('/animals');
        animals.value = response.data;
    } catch (exception) {
        error.value = exception.message;
    } finally {
        loading.value = false;
    }
}

function statusLabel(status) {
    return t({ actif: 'Actif', vendu: 'Vendu', decede: 'Décédé', archive: 'Archivé' }[status] ?? status);
}

function housingLabel(value) {
    return t({ plein_air: 'Plein air / prairie', stabulation: 'Stabulation' }[value] ?? 'Non renseigné');
}
</script>

<template>
    <AppLayout>
        <header class="page-header">
            <div><p class="eyebrow">{{ t('Mon cheptel') }}</p><h1>{{ t('Mes animaux') }}</h1><p class="muted">{{ t('Consultez et mettez à jour les fiches de vos animaux.') }}</p></div>
            <RouterLink class="button button-primary" :to="{ name: 'animal-create' }">{{ t('＋ Ajouter un animal') }}</RouterLink>
        </header>
        <AlertMessage :message="error" />
        <p v-if="loading" class="loading-text">{{ t('Chargement des animaux…') }}</p>
        <section v-else-if="animals.length" class="animal-grid" :aria-label="t('Liste des animaux')">
            <article v-for="animal in animals" :key="animal.id" class="animal-card">
                <div class="animal-card-top">
                    <span class="animal-avatar" aria-hidden="true">{{ animal.livestock_type?.name === 'Équin' ? '🐴' : animal.livestock_type?.name === 'Porcin' ? '🐖' : animal.livestock_type?.name === 'Caprin' ? '🐐' : animal.livestock_type?.name === 'Ovin' ? '🐑' : '🐄' }}</span>
                    <span class="status-badge" :class="`status-${animal.status}`">{{ statusLabel(animal.status) }}</span>
                </div>
                <h2>{{ animal.name }}</h2>
                <p class="muted">{{ t(animal.livestock_type?.name ?? '') }}<span v-if="animal.breed"> · {{ animal.breed }}</span><span v-if="animal.tag_number"> · {{ t('Boucle') }} {{ animal.tag_number }}</span></p>
                <p class="animal-housing">{{ housingLabel(animal.housing_type) }}</p>
                <p v-if="animal.exploitation" class="muted">{{ animal.exploitation.name }}</p>
                <RouterLink class="button button-secondary button-wide" :to="{ name: 'animal-detail', params: { id: animal.id } }">{{ t('Voir la fiche') }}</RouterLink>
            </article>
        </section>
        <section v-else class="empty-state">
            <span class="empty-icon" aria-hidden="true">♧</span>
            <h2>{{ t('Aucun animal pour le moment') }}</h2>
            <p>{{ t('Ajoutez votre premier animal pour commencer son suivi.') }}</p>
            <RouterLink class="button button-primary" :to="{ name: 'animal-create' }">{{ t('Ajouter un animal') }}</RouterLink>
        </section>
    </AppLayout>
</template>
