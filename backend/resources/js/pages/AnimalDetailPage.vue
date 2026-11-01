<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError, apiRequest } from '../api';
import AlertMessage from '../components/AlertMessage.vue';
import AppLayout from '../components/AppLayout.vue';
import FormField from '../components/FormField.vue';
import { formatDate } from '../date';

const route = useRoute();
const router = useRouter();
const animal = ref(null);
const loading = ref(true);
const error = ref('');
const formError = ref('');
const healthForm = ref({ category: 'vaccination', performed_on: '', description: '' });
const reminderForm = ref({ title: '', reminder_date: '', description: '' });
const savingHealth = ref(false);
const savingReminder = ref(false);

onMounted(loadAnimal);

async function loadAnimal() {
    try {
        animal.value = (await apiRequest(`/animals/${route.params.id}`)).data;
    } catch (exception) {
        error.value = exception.message;
    } finally {
        loading.value = false;
    }
}

async function addHealthRecord() {
    savingHealth.value = true;
    formError.value = '';
    try {
        await apiRequest(`/animals/${animal.value.id}/health-records`, {
            method: 'POST',
            body: healthForm.value,
        });
        healthForm.value = { category: 'vaccination', performed_on: '', description: '' };
        await loadAnimal();
    } catch (exception) {
        formError.value = exception instanceof ApiError && exception.status === 422
            ? Object.values(exception.errors).flat()[0]
            : exception.message;
    } finally {
        savingHealth.value = false;
    }
}

async function addReminder() {
    savingReminder.value = true;
    formError.value = '';
    try {
        await apiRequest(`/animals/${animal.value.id}/reminders`, {
            method: 'POST',
            body: reminderForm.value,
        });
        reminderForm.value = { title: '', reminder_date: '', description: '' };
        await loadAnimal();
    } catch (exception) {
        formError.value = exception instanceof ApiError && exception.status === 422
            ? Object.values(exception.errors).flat()[0]
            : exception.message;
    } finally {
        savingReminder.value = false;
    }
}

async function archiveAnimal() {
    if (!window.confirm('Archiver cet animal ? Sa fiche et son historique seront conservés.')) return;
    try {
        await apiRequest(`/animals/${animal.value.id}`, { method: 'DELETE' });
        await router.push({ name: 'animals' });
    } catch (exception) {
        error.value = exception.message;
    }
}
</script>

<template>
    <AppLayout>
        <p v-if="loading" class="loading-text">Chargement de la fiche…</p>
        <template v-else-if="animal">
            <header class="page-header">
                <div>
                    <RouterLink class="back-link" :to="{ name: 'animals' }">← Mes animaux</RouterLink>
                    <h1>{{ animal.name }}</h1>
                    <p class="muted">{{ animal.livestock_type?.name }}<span v-if="animal.tag_number"> · Boucle {{ animal.tag_number }}</span></p>
                </div>
                <div class="header-actions">
                    <RouterLink class="button button-secondary" :to="{ name: 'animal-edit', params: { id: animal.id } }">Modifier</RouterLink>
                    <button class="button button-danger-outline" type="button" @click="archiveAnimal">Archiver</button>
                </div>
            </header>
            <AlertMessage :message="error" />
            <AlertMessage :message="formError" />
            <section class="detail-grid">
                <article class="panel">
                    <div class="section-heading"><div><p class="eyebrow">Informations</p><h2>Fiche de l’animal</h2></div><span class="status-badge" :class="`status-${animal.status}`">{{ animal.status }}</span></div>
                    <dl class="detail-list">
                        <div><dt>Type</dt><dd>{{ animal.livestock_type?.name ?? '—' }}</dd></div>
                        <div><dt>Numéro de boucle</dt><dd>{{ animal.tag_number || 'Non renseigné' }}</dd></div>
                        <div><dt>Sexe</dt><dd>{{ animal.sex === 'male' ? 'Mâle' : animal.sex === 'femelle' ? 'Femelle' : 'Non renseigné' }}</dd></div>
                        <div><dt>Date de naissance</dt><dd>{{ formatDate(animal.birth_date) }}</dd></div>
                        <div><dt>Mode de vie</dt><dd>{{ animal.housing_type === 'plein_air' ? 'Plein air / prairie' : animal.housing_type === 'stabulation' ? 'Stabulation' : 'Non renseigné' }}</dd></div>
                        <div><dt>Exploitation</dt><dd>{{ animal.exploitation?.name ?? 'Aucune exploitation' }}</dd></div>
                        <div><dt>Parent</dt><dd>{{ animal.parent?.name ?? 'Non renseigné' }}</dd></div>
                        <div><dt>Commentaires</dt><dd>{{ animal.comments || 'Aucun commentaire' }}</dd></div>
                    </dl>
                </article>
                <section class="panel">
                    <div class="section-heading"><div><p class="eyebrow">Historique sanitaire</p><h2>Soins enregistrés</h2></div></div>
                    <p v-if="animal.offline_history_unavailable" class="empty-note">Les soins antérieurs ne sont pas disponibles hors connexion : cette fiche n’a pas encore été consultée en ligne.</p>
                    <ul v-if="animal.health_records?.length" class="record-list">
                        <li v-for="record in animal.health_records" :key="record.id">
                            <span class="record-marker" aria-hidden="true"></span>
                            <div><strong>{{ record.category === 'vaccination' ? 'Vaccination' : 'Traitement' }}</strong><small>{{ formatDate(record.performed_on) }}</small><p>{{ record.description }}</p></div>
                        </li>
                    </ul>
                    <p v-else-if="!animal.offline_history_unavailable" class="empty-note">Aucun soin enregistré.</p>
                    <form class="compact-form" @submit.prevent="addHealthRecord">
                        <h3>Ajouter un soin</h3>
                        <FormField id="health_category" label="Type de soin">
                            <select id="health_category" v-model="healthForm.category"><option value="vaccination">Vaccination</option><option value="traitement">Traitement</option></select>
                        </FormField>
                        <FormField id="health_date" label="Date">
                            <input id="health_date" v-model="healthForm.performed_on" type="date" required>
                        </FormField>
                        <FormField id="health_description" label="Description">
                            <textarea id="health_description" v-model.trim="healthForm.description" rows="2" required></textarea>
                        </FormField>
                        <button class="button button-secondary" type="submit" :disabled="savingHealth">{{ savingHealth ? 'Ajout…' : 'Ajouter le soin' }}</button>
                    </form>
                </section>
                <section class="panel">
                    <div class="section-heading"><div><p class="eyebrow">Organisation</p><h2>Rappels</h2></div></div>
                    <p v-if="animal.offline_history_unavailable" class="empty-note">Les rappels antérieurs ne sont pas disponibles hors connexion : cette fiche n’a pas encore été consultée en ligne.</p>
                    <ul v-if="animal.reminders?.length" class="reminder-list">
                        <li v-for="reminder in animal.reminders" :key="reminder.id">
                            <span class="date-pill">{{ formatDate(reminder.reminder_date) }}</span>
                            <span><strong>{{ reminder.title }}</strong><small>{{ reminder.description || ' ' }}</small></span>
                        </li>
                    </ul>
                    <p v-else-if="!animal.offline_history_unavailable" class="empty-note">Aucun rappel enregistré.</p>
                    <form class="compact-form" @submit.prevent="addReminder">
                        <h3>Ajouter un rappel</h3>
                        <FormField id="reminder_title" label="Intitulé">
                            <input id="reminder_title" v-model.trim="reminderForm.title" maxlength="150" required>
                        </FormField>
                        <FormField id="reminder_date" label="Date">
                            <input id="reminder_date" v-model="reminderForm.reminder_date" type="date" required>
                        </FormField>
                        <FormField id="reminder_description" label="Description (facultative)">
                            <textarea id="reminder_description" v-model.trim="reminderForm.description" rows="2"></textarea>
                        </FormField>
                        <button class="button button-secondary" type="submit" :disabled="savingReminder">{{ savingReminder ? 'Ajout…' : 'Ajouter le rappel' }}</button>
                    </form>
                </section>
            </section>
        </template>
        <AlertMessage v-else :message="error || 'Animal introuvable.'" />
    </AppLayout>
</template>
