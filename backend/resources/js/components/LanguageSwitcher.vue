<script setup>
import { locale, t, toggleLocale } from '../i18n';
</script>

<template>
    <button
        class="language-switcher"
        type="button"
        :aria-label="t('Changer de langue')"
        @click="toggleLocale"
    >
        {{ locale === 'fr' ? 'FR' : 'EN' }}
    </button>
</template>
