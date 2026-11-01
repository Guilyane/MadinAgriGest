<template>
    <main class="not-found">
        <span class="brand-mark" aria-hidden="true">M</span>
        <p class="eyebrow">Erreur 404</p>
        <h1>Cette page n’existe pas</h1>
        <p class="muted">Vérifiez l’adresse ou retournez à votre espace.</p>
        <RouterLink class="button button-primary" :to="{ name: 'dashboard' }">Retour au tableau de bord</RouterLink>
    </main>
</template>
