<script setup>
import { onMounted, ref } from 'vue';
import { apiRequest } from '../api';
import AppLayout from '../components/AppLayout.vue';
import AlertMessage from '../components/AlertMessage.vue';
import { auth } from '../auth';
import { formatDate } from '../date';
import { t } from '../i18n';

const dashboard = ref(null);
const error = ref('');
const loading = ref(true);

onMounted(async () => {
    try {
        dashboard.value = (await apiRequest('/dashboard')).data;
    } catch (exception) {
        error.value = exception.message;
    } finally {
        loading.value = false;
    }
});

</script>

<template>
    <AppLayout>
        <header class="page-header">
            <div>
                <p class="eyebrow">{{ t('Votre espace') }}</p>
                <h1>{{ t('Bonjour {name}', { name: auth.user?.first_name ?? '' }) }}</h1>
                <p class="muted">{{ t('Voici le résumé de vos animaux et des prochaines échéances.') }}</p>
            </div>
            <RouterLink class="button button-primary" :to="{ name: 'animal-create' }">{{ t('＋ Ajouter un animal') }}</RouterLink>
        </header>
        <AlertMessage :message="error" />
        <p v-if="loading" class="loading-text">{{ t('Chargement du tableau de bord…') }}</p>
        <template v-else-if="dashboard">
            <section class="stats-grid" :aria-label="t('Indicateurs')">
                <article class="stat-card">
                    <span class="stat-icon green" aria-hidden="true">♧</span>
                    <p>{{ t('Animaux actifs') }}</p>
                    <strong>{{ dashboard.active_animals_count }}</strong>
                </article>
                <article class="stat-card">
                    <span class="stat-icon amber" aria-hidden="true">◷</span>
                    <p>{{ t('Rappels à venir') }}</p>
                    <strong>{{ dashboard.upcoming_reminders.length }}</strong>
                </article>
                <article class="stat-card">
                    <span class="stat-icon red" aria-hidden="true">!</span>
                    <p>{{ t('Rappels dépassés') }}</p>
                    <strong>{{ dashboard.overdue_reminders.length }}</strong>
                </article>
            </section>
            <div class="content-grid">
                <section class="panel">
                    <div class="section-heading">
                        <div><p class="eyebrow">{{ t('À ne pas oublier') }}</p><h2>{{ t('Prochaines échéances') }}</h2></div>
                        <RouterLink :to="{ name: 'animals' }" class="text-link">{{ t('Voir les animaux') }}</RouterLink>
                    </div>
                    <ul v-if="dashboard.upcoming_reminders.length" class="reminder-list">
                        <li v-for="reminder in dashboard.upcoming_reminders" :key="reminder.id">
                            <span class="date-pill">{{ formatDate(reminder.reminder_date) }}</span>
                            <span><strong>{{ reminder.title }}</strong><small>{{ reminder.animal?.name }}</small></span>
                        </li>
                    </ul>
                    <p v-else class="empty-note">{{ t('Aucun rappel à venir.') }}</p>
                </section>
                <section class="panel">
                    <div class="section-heading"><div><p class="eyebrow">{{ t('À régulariser') }}</p><h2>{{ t('Rappels dépassés') }}</h2></div></div>
                    <ul v-if="dashboard.overdue_reminders.length" class="reminder-list overdue-list">
                        <li v-for="reminder in dashboard.overdue_reminders" :key="reminder.id">
                            <span class="date-pill">{{ formatDate(reminder.reminder_date) }}</span>
                            <span><strong>{{ reminder.title }}</strong><small>{{ reminder.animal?.name }}</small></span>
                        </li>
                    </ul>
                    <p v-else class="empty-note">{{ t('Aucun rappel dépassé.') }}</p>
                </section>
            </div>
            <section class="quick-actions">
                <div><p class="eyebrow">{{ t('Accès rapide') }}</p><h2>{{ t('Que souhaitez-vous faire ?') }}</h2></div>
                <RouterLink class="action-card" :to="{ name: 'animals' }"><span aria-hidden="true">♧</span><strong>{{ t('Gérer mes animaux') }}</strong><small>{{ t('Consulter les fiches et les soins') }}</small></RouterLink>
                <RouterLink v-if="auth.user?.profile_type === 'eleveur'" class="action-card" :to="{ name: 'exploitations' }"><span aria-hidden="true">⌂</span><strong>{{ t('Mes exploitations') }}</strong><small>{{ t('Gérer les informations agricoles') }}</small></RouterLink>
            </section>
        </template>
    </AppLayout>
</template>
