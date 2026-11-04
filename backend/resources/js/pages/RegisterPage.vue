<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../auth';
import { ApiError } from '../api';
import AlertMessage from '../components/AlertMessage.vue';
import FormField from '../components/FormField.vue';
import { t } from '../i18n';

const router = useRouter();
const form = ref({
    first_name: '',
    last_name: '',
    email: '',
    profile_type: 'particulier',
    siret: '',
    password: '',
    password_confirmation: '',
});
const errors = ref({});
const generalError = ref('');
const busy = ref(false);
const registrationIllustration = '/images/duo-fermiers.png';

async function submit() {
    errors.value = {};
    generalError.value = '';
    busy.value = true;
    try {
        await auth.register(form.value);
        await router.push({ name: 'dashboard' });
    } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
            errors.value = Object.fromEntries(
                Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]),
            );
        } else {
            generalError.value = error.message;
        }
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <main class="auth-page auth-register">
        <aside class="auth-illustration register-art">
            <span class="sun-disc"></span>
            <div class="field-lines"></div>
            <img class="register-illustration" :src="registrationIllustration" :alt="t('Deux agriculteurs avec leurs outils de travail')">
            <p>{{ t('Bienvenue dans') }}<br>{{ t('la communauté agricole.') }}</p>
        </aside>
        <section class="auth-card register-card" aria-labelledby="register-title">
            <RouterLink class="auth-brand" :to="{ name: 'login' }">MadinAgriGest</RouterLink>
            <p class="eyebrow">{{ t('Votre espace de gestion') }}</p>
            <h1 id="register-title">{{ t('Créer un compte') }}</h1>
            <form class="form-stack" @submit.prevent="submit">
                <AlertMessage :message="generalError" />
                <div class="form-grid">
                    <FormField id="first_name" :label="t('Prénom')" :error="errors.first_name">
                        <input id="first_name" v-model.trim="form.first_name" autocomplete="given-name" required>
                    </FormField>
                    <FormField id="last_name" :label="t('Nom')" :error="errors.last_name">
                        <input id="last_name" v-model.trim="form.last_name" autocomplete="family-name" required>
                    </FormField>
                </div>
                <FormField id="register_email" :label="t('Adresse e-mail')" :error="errors.email">
                    <input id="register_email" v-model.trim="form.email" autocomplete="email" type="email" required>
                </FormField>
                <FormField id="profile_type" :label="t('Vous êtes')">
                    <select id="profile_type" v-model="form.profile_type">
                        <option value="particulier">{{ t('Particulier') }}</option>
                        <option value="eleveur">{{ t('Éleveur / exploitant agricole') }}</option>
                    </select>
                </FormField>
                <FormField v-if="form.profile_type === 'eleveur'" id="siret" :label="t('Numéro SIRET')" :error="errors.siret" :hint="t('14 chiffres')">
                    <input id="siret" v-model.trim="form.siret" autocomplete="off" inputmode="numeric" maxlength="14" pattern="[0-9]{14}" required>
                </FormField>
                <div class="form-grid">
                    <FormField id="register_password" :label="t('Mot de passe')" :error="errors.password" :hint="t('8 caractères minimum')">
                        <input id="register_password" v-model="form.password" autocomplete="new-password" type="password" minlength="8" required>
                    </FormField>
                    <FormField id="password_confirmation" :label="t('Confirmation')" :error="errors.password_confirmation">
                        <input id="password_confirmation" v-model="form.password_confirmation" autocomplete="new-password" type="password" required>
                    </FormField>
                </div>
                <button class="button button-primary button-wide" type="submit" :disabled="busy">
                    {{ t(busy ? 'Création…' : 'Créer mon compte') }}
                </button>
            </form>
            <p class="auth-switch">{{ t('Déjà inscrit ?') }} <RouterLink :to="{ name: 'login' }">{{ t('Se connecter') }}</RouterLink></p>
        </section>
    </main>
</template>
