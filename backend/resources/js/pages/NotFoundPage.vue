<script setup>
import { t } from '../i18n';
</script>

<template>
    <main class="not-found">
        <span class="brand-mark" aria-hidden="true">M</span>
        <p class="eyebrow">{{ t('Erreur 404') }}</p>
        <h1>{{ t('Cette page n’existe pas') }}</h1>
        <p class="muted">{{ t('Vérifiez l’adresse ou retournez à votre espace.') }}</p>
        <RouterLink class="button button-primary" :to="{ name: 'dashboard' }">{{ t('Retour au tableau de bord') }}</RouterLink>
    </main>
</template>
