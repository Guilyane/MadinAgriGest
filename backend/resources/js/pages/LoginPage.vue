<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../auth';
import { ApiError } from '../api';
import AlertMessage from '../components/AlertMessage.vue';
import FormField from '../components/FormField.vue';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);
const loginIllustration = '/images/animaux-ferme.png';

async function submit() {
    error.value = '';
    busy.value = true;
    try {
        await auth.login({ email: email.value, password: password.value });
        await router.push({ name: 'dashboard' });
    } catch (exception) {
        error.value = exception instanceof ApiError && exception.errors.email
            ? exception.errors.email[0]
            : exception.message;
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <main class="auth-page auth-login">
        <section class="auth-card" aria-labelledby="login-title">
            <RouterLink class="auth-brand" :to="{ name: 'login' }">MadinAgriGest</RouterLink>
            <h1 id="login-title" class="visually-hidden">Se connecter</h1>
            <form class="form-stack" @submit.prevent="submit">
                <AlertMessage :message="error" />
                <FormField id="email" label="Adresse e-mail">
                    <input id="email" v-model.trim="email" autocomplete="email" type="email" required>
                </FormField>
                <FormField id="password" label="Mot de passe">
                    <input id="password" v-model="password" autocomplete="current-password" type="password" required>
                </FormField>
                <button class="button button-primary button-wide" type="submit" :disabled="busy">
                    {{ busy ? 'Connexion…' : 'Se connecter' }}
                </button>
            </form>
            <p class="auth-switch">Pas encore de compte ? <RouterLink :to="{ name: 'register' }">Créer un compte</RouterLink></p>
        </section>
        <aside class="login-animals">
            <img :src="loginIllustration" alt="Illustration d’animaux de la ferme">
        </aside>
    </main>
</template>
