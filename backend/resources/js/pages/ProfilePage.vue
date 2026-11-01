<script setup>
import { ref } from 'vue';
import { auth } from '../auth';
import { ApiError, apiRequest } from '../api';
import AlertMessage from '../components/AlertMessage.vue';
import AppLayout from '../components/AppLayout.vue';
import FormField from '../components/FormField.vue';

const form = ref({
    first_name: auth.user?.first_name ?? '',
    last_name: auth.user?.last_name ?? '',
    email: auth.user?.email ?? '',
});
const errors = ref({});
const error = ref('');
const success = ref('');
const busy = ref(false);

async function submit() {
    busy.value = true;
    errors.value = {};
    error.value = '';
    success.value = '';
    try {
        const response = await apiRequest('/auth/me', { method: 'PATCH', body: form.value });
        auth.user = response.data;
        success.value = 'Votre profil a été mis à jour.';
    } catch (exception) {
        if (exception instanceof ApiError && exception.status === 422) {
            errors.value = Object.fromEntries(
                Object.entries(exception.errors).map(([field, messages]) => [field, messages[0]]),
            );
        } else {
            error.value = exception.message;
        }
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <AppLayout>
        <header class="page-header">
            <div><p class="eyebrow">Paramètres du compte</p><h1>Mon profil</h1><p class="muted">Mettez à jour vos informations personnelles.</p></div>
        </header>
        <form class="panel form-panel narrow-panel" @submit.prevent="submit">
            <AlertMessage :message="error" />
            <AlertMessage :message="success" kind="success" />
            <div class="form-grid">
                <FormField id="profile_first_name" label="Prénom" :error="errors.first_name">
                    <input id="profile_first_name" v-model.trim="form.first_name" autocomplete="given-name" required>
                </FormField>
                <FormField id="profile_last_name" label="Nom" :error="errors.last_name">
                    <input id="profile_last_name" v-model.trim="form.last_name" autocomplete="family-name" required>
                </FormField>
            </div>
            <FormField id="profile_email" label="Adresse e-mail" :error="errors.email">
                <input id="profile_email" v-model.trim="form.email" autocomplete="email" type="email" required>
            </FormField>
            <div class="profile-role">
                <span>Type de compte</span>
                <strong>{{ auth.user?.profile_type === 'eleveur' ? 'Éleveur / exploitant agricole' : auth.user?.profile_type === 'admin' ? 'Administrateur' : 'Particulier' }}</strong>
                <small>Le type de compte ne peut pas être modifié depuis le profil.</small>
            </div>
            <div class="form-actions">
                <button class="button button-primary" type="submit" :disabled="busy">{{ busy ? 'Enregistrement…' : 'Enregistrer les modifications' }}</button>
            </div>
        </form>
    </AppLayout>
</template>
