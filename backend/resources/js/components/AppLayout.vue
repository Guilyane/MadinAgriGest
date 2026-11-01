<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../auth';

const router = useRouter();
const logoutError = ref('');

async function logout() {
    logoutError.value = '';
    try {
        await auth.logout();
        await router.push({ name: 'login' });
    } catch (error) {
        logoutError.value = error.message;
    }
}
</script>

<template>
    <div class="app-shell">
        <aside class="sidebar">
            <RouterLink class="brand" :to="{ name: 'dashboard' }" aria-label="MadinAgriGest, accueil">
                <span class="brand-mark" aria-hidden="true">M</span>
                <span>MadinAgriGest</span>
            </RouterLink>
            <div class="profile-chip">
                <span class="avatar" aria-hidden="true">{{ auth.user?.first_name?.charAt(0) }}</span>
                <span>
                    <strong>{{ auth.user?.first_name }} {{ auth.user?.last_name }}</strong>
                    <small>{{ auth.user?.profile_type === 'eleveur' ? 'Éleveur / exploitant' : 'Particulier' }}</small>
                </span>
            </div>
            <nav class="main-nav" aria-label="Navigation principale">
                <RouterLink v-if="auth.user?.profile_type !== 'admin'" :to="{ name: 'dashboard' }" class="nav-link">
                    <span aria-hidden="true">⌂</span> Tableau de bord
                </RouterLink>
                <RouterLink v-if="auth.user?.profile_type !== 'admin'" :to="{ name: 'animals' }" class="nav-link">
                    <span aria-hidden="true">♧</span> Mes animaux
                </RouterLink>
                <RouterLink v-if="auth.user?.profile_type === 'eleveur'" :to="{ name: 'exploitations' }" class="nav-link">
                    <span aria-hidden="true">⌂</span> Exploitations
                </RouterLink>
                <RouterLink :to="{ name: 'profile' }" class="nav-link mobile-only">
                    <span aria-hidden="true">⚙</span> Mon profil
                </RouterLink>
                <button class="nav-link nav-button mobile-only" type="button" @click="logout">
                    <span aria-hidden="true">↪</span> Quitter
                </button>
            </nav>
            <div class="sidebar-bottom">
                <RouterLink :to="{ name: 'profile' }" class="nav-link">
                    <span aria-hidden="true">⚙</span> Mon profil
                </RouterLink>
                <button class="nav-link nav-button" type="button" @click="logout">
                    <span aria-hidden="true">↪</span> Se déconnecter
                </button>
            </div>
        </aside>
        <main class="main-content">
            <p v-if="logoutError" class="alert" role="alert">{{ logoutError }}</p>
            <slot />
        </main>
    </div>
</template>
