<script setup>
import { onMounted, ref } from 'vue';
import { apiRequest } from '../api';
import AppLayout from '../components/AppLayout.vue';
import AlertMessage from '../components/AlertMessage.vue';

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
    return { actif: 'Actif', vendu: 'Vendu', decede: 'Décédé', archive: 'Archivé' }[status] ?? status;
}

function housingLabel(value) {
    return { plein_air: 'Plein air / prairie', stabulation: 'Stabulation' }[value] ?? 'Non renseigné';
}
</script>

<template>
    <AppLayout>
        <header class="page-header">
            <div><p class="eyebrow">Mon cheptel</p><h1>Mes animaux</h1><p class="muted">Consultez et mettez à jour les fiches de vos animaux.</p></div>
            <RouterLink class="button button-primary" :to="{ name: 'animal-create' }">＋ Ajouter un animal</RouterLink>
        </header>
        <AlertMessage :message="error" />
        <p v-if="loading" class="loading-text">Chargement des animaux…</p>
        <section v-else-if="animals.length" class="animal-grid" aria-label="Liste des animaux">
            <article v-for="animal in animals" :key="animal.id" class="animal-card">
                <div class="animal-card-top">
                    <span class="animal-avatar" aria-hidden="true">{{ animal.livestock_type?.name === 'Équin' ? '🐴' : animal.livestock_type?.name === 'Porcin' ? '🐖' : animal.livestock_type?.name === 'Caprin' ? '🐐' : '🐄' }}</span>
                    <span class="status-badge" :class="`status-${animal.status}`">{{ statusLabel(animal.status) }}</span>
                </div>
                <h2>{{ animal.name }}</h2>
                <p class="muted">{{ animal.livestock_type?.name }}<span v-if="animal.tag_number"> · Boucle {{ animal.tag_number }}</span></p>
                <p class="animal-housing">{{ housingLabel(animal.housing_type) }}</p>
                <p v-if="animal.exploitation" class="muted">{{ animal.exploitation.name }}</p>
                <RouterLink class="button button-secondary button-wide" :to="{ name: 'animal-detail', params: { id: animal.id } }">Voir la fiche</RouterLink>
            </article>
        </section>
        <section v-else class="empty-state">
            <span class="empty-icon" aria-hidden="true">♧</span>
            <h2>Aucun animal pour le moment</h2>
            <p>Ajoutez votre premier animal pour commencer son suivi.</p>
            <RouterLink class="button button-primary" :to="{ name: 'animal-create' }">Ajouter un animal</RouterLink>
        </section>
    </AppLayout>
</template>
