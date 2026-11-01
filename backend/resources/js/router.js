import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './auth';
import LoginPage from './pages/LoginPage.vue';
import RegisterPage from './pages/RegisterPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import AnimalsPage from './pages/AnimalsPage.vue';
import AnimalFormPage from './pages/AnimalFormPage.vue';
import AnimalDetailPage from './pages/AnimalDetailPage.vue';
import ExploitationsPage from './pages/ExploitationsPage.vue';
import ExploitationFormPage from './pages/ExploitationFormPage.vue';
import ProfilePage from './pages/ProfilePage.vue';
import NotFoundPage from './pages/NotFoundPage.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/connexion', name: 'login', component: LoginPage, meta: { guest: true } },
        { path: '/inscription', name: 'register', component: RegisterPage, meta: { guest: true } },
        { path: '/', name: 'dashboard', component: DashboardPage, meta: { auth: true, business: true } },
        { path: '/animaux', name: 'animals', component: AnimalsPage, meta: { auth: true, business: true } },
        { path: '/animaux/nouveau', name: 'animal-create', component: AnimalFormPage, meta: { auth: true, business: true } },
        { path: '/animaux/:id', name: 'animal-detail', component: AnimalDetailPage, meta: { auth: true, business: true } },
        { path: '/animaux/:id/modifier', name: 'animal-edit', component: AnimalFormPage, meta: { auth: true, business: true } },
        { path: '/exploitations', name: 'exploitations', component: ExploitationsPage, meta: { auth: true, breeder: true } },
        { path: '/exploitations/nouvelle', name: 'exploitation-create', component: ExploitationFormPage, meta: { auth: true, breeder: true } },
        { path: '/exploitations/:id/modifier', name: 'exploitation-edit', component: ExploitationFormPage, meta: { auth: true, breeder: true } },
        { path: '/profil', name: 'profile', component: ProfilePage, meta: { auth: true } },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
    ],
});

router.beforeEach(async (to) => {
    await auth.initialize();

    if (to.meta.auth && !auth.user) return { name: 'login' };
    if (to.meta.guest && auth.user) return { name: 'dashboard' };
    if (to.meta.business && auth.user?.profile_type === 'admin') return { name: 'profile' };
    if (to.meta.breeder && auth.user?.profile_type !== 'eleveur') return { name: 'dashboard' };

    return true;
});

export default router;
