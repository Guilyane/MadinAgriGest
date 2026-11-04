import { ref, watch } from 'vue';

const translations = {
    'Changer de langue': 'Change language',
    'Hors ligne. Les données déjà consultées restent disponibles ;': 'You are offline. Previously viewed data remains available;',
    'changement': 'change',
    'changements': 'changes',
    'en attente.': 'pending.',
    'en attente de synchronisation.': 'waiting to sync.',
    'Tenter la synchronisation': 'Try syncing',
    'les changements seront synchronisés au retour du réseau.': 'changes will sync when you are back online.',
    'Synchronisation des changements…': 'Syncing changes…',
    'Synchronisation bloquée : {error}': 'Sync paused: {error}',
    'Réessayer': 'Retry',
    'Annuler le changement bloqué': 'Discard blocked change',
    'en attente de synchronisation.': 'waiting to sync.',
    'Supprimer définitivement le changement bloqué de cet appareil ?': 'Permanently discard the blocked change on this device?',
    'MadinAgriGest, accueil': 'MadinAgriGest, home',
    'Éleveur / exploitant': 'Farmer',
    'Particulier': 'Individual',
    'Administrateur': 'Administrator',
    'Navigation principale': 'Main navigation',
    'Tableau de bord': 'Dashboard',
    'Mes animaux': 'My animals',
    'Exploitations': 'Farms',
    'Mon profil': 'My profile',
    'Quitter': 'Log out',
    'Se déconnecter': 'Log out',
    'Impossible de contacter le serveur. Vérifiez votre connexion et que le serveur de l’application est démarré, puis réessayez.': 'Unable to reach the server. Check your connection and that the application server is running, then try again.',
    'Une connexion est nécessaire pour se déconnecter en toute sécurité.': 'An internet connection is required to log out securely.',
    'Une erreur technique est survenue sur le serveur. Réessayez ou contactez l’administrateur.': 'A technical error occurred on the server. Try again or contact the administrator.',
    'Le serveur a rencontré une erreur. Réessayez plus tard ou contactez l’administrateur.': 'The server encountered an error. Try again later or contact the administrator.',
    'Le serveur a envoyé une réponse invalide.': 'The server sent an invalid response.',
    'Une erreur est survenue. Réessaie plus tard.': 'An error occurred. Please try again later.',
    'Impossible de préparer la session sécurisée. Vérifiez que le serveur de l’application est démarré, puis réessayez.': 'Unable to prepare a secure session. Check that the application server is running, then try again.',
    'Réseau indisponible.': 'Network unavailable.',
    'La session a expiré. Reconnectez-vous pour synchroniser les changements.': 'Your session has expired. Sign in again to sync your changes.',
    'Non renseigné': 'Not provided',
    'Connexion…': 'Signing in…',
    'Se connecter': 'Sign in',
    'Adresse e-mail': 'Email address',
    'Mot de passe': 'Password',
    'Pas encore de compte ?': 'Don’t have an account yet?',
    'Créer un compte': 'Create an account',
    'Illustration d’animaux de la ferme': 'Illustration of farm animals',
    'Bienvenue dans<br>la communauté agricole.': 'Welcome to<br>the farming community.',
    'Bienvenue dans': 'Welcome to',
    'la communauté agricole.': 'the farming community.',
    'Votre espace de gestion': 'Your management space',
    'Prénom': 'First name',
    'Nom': 'Last name',
    'Vous êtes': 'You are',
    'Éleveur / exploitant agricole': 'Farmer / agricultural operator',
    'Numéro SIRET': 'SIRET number',
    '14 chiffres': '14 digits',
    '8 caractères minimum': 'At least 8 characters',
    'Confirmation': 'Confirm password',
    'Création…': 'Creating…',
    'Créer mon compte': 'Create my account',
    'Déjà inscrit ?': 'Already registered?',
    'Deux agriculteurs avec leurs outils de travail': 'Two farmers with their tools',
    'Votre espace': 'Your space',
    'Bonjour {name}': 'Hello, {name}',
    'Voici le résumé de vos animaux et des prochaines échéances.': 'Here is an overview of your animals and upcoming reminders.',
    '＋ Ajouter un animal': '＋ Add an animal',
    '＋ Ajouter une exploitation': '＋ Add a farm',
    'Chargement du tableau de bord…': 'Loading dashboard…',
    'Indicateurs': 'Statistics',
    'Animaux actifs': 'Active animals',
    'Rappels à venir': 'Upcoming reminders',
    'Rappels dépassés': 'Overdue reminders',
    'À ne pas oublier': 'Coming up',
    'Prochaines échéances': 'Upcoming reminders',
    'Voir les animaux': 'View animals',
    'Aucun rappel à venir.': 'No upcoming reminders.',
    'À régulariser': 'Needs attention',
    'Aucun rappel dépassé.': 'No overdue reminders.',
    'Accès rapide': 'Quick access',
    'Que souhaitez-vous faire ?': 'What would you like to do?',
    'Gérer mes animaux': 'Manage my animals',
    'Consulter les fiches et les soins': 'View animal records and care',
    'Mes exploitations': 'My farms',
    'Gérer les informations agricoles': 'Manage farm details',
    'Mon cheptel': 'My livestock',
    'Consultez et mettez à jour les fiches de vos animaux.': 'View and update your animal records.',
    '＋ Ajouter un animal': '＋ Add an animal',
    'Chargement des animaux…': 'Loading animals…',
    'Actif': 'Active',
    'Vendu': 'Sold',
    'Décédé': 'Deceased',
    'Archivé': 'Archived',
    'Plein air / prairie': 'Outdoor / pasture',
    'Stabulation': 'Barn',
    'Liste des animaux': 'Animal list',
    'Boucle': 'Tag',
    'Voir la fiche': 'View record',
    'Aucun animal pour le moment': 'No animals yet',
    'Ajoutez votre premier animal pour commencer son suivi.': 'Add your first animal to start tracking its care.',
    'Ajouter un animal': 'Add an animal',
    'Modifier la fiche': 'Edit record',
    'Renseignez les informations principales de l’animal.': 'Enter the animal’s main details.',
    'Retour aux animaux': 'Back to animals',
    'Chargement de la fiche…': 'Loading record…',
    'Nom': 'Name',
    'Type de bétail': 'Livestock type',
    'Choisir un type': 'Choose a type',
    'Numéro de boucle': 'Tag number',
    'Facultatif, mais unique pour chaque animal.': 'Optional, but must be unique for each animal.',
    'Sexe': 'Sex',
    'Femelle': 'Female',
    'Mâle': 'Male',
    'Date de naissance': 'Date of birth',
    'Mère': 'Mother',
    'Père': 'Father',
    'Non renseignée': 'Not provided',
    '· Femelle': '· Female',
    '· Mâle': '· Male',
    '· Boucle': '· Tag',
    'Mode de vie': 'Housing',
    'Choisissez une seule option.': 'Choose one option.',
    'Exploitation': 'Farm',
    'Aucune exploitation': 'No farm',
    'Commentaires': 'Comments',
    '500 caractères maximum.': '500 characters maximum.',
    'Annuler': 'Cancel',
    'Enregistrement…': 'Saving…',
    'Enregistrer la fiche': 'Save record',
    'Retour aux exploitations': 'Back to farms',
    'Modifier une exploitation': 'Edit farm',
    'Ajouter une exploitation': 'Add a farm',
    'Chargement…': 'Loading…',
    'Nom de l’exploitation': 'Farm name',
    'Localisation': 'Location',
    'Facultatif.': 'Optional.',
    'Enregistrer': 'Save',
    'Paramètres du compte': 'Account settings',
    'Mettez à jour vos informations personnelles.': 'Update your personal information.',
    'Type de compte': 'Account type',
    'Le type de compte ne peut pas être modifié depuis le profil.': 'Your account type cannot be changed here.',
    'Renseignez les informations principales de l’animal.': 'Enter the animal’s main details.',
    'Parent': 'Parent',
    'Enregistrer les modifications': 'Save changes',
    'Votre profil a été mis à jour.': 'Your profile has been updated.',
    'Mon activité agricole': 'My farming activity',
    'Gérez les exploitations associées à votre compte.': 'Manage the farms linked to your account.',
    'Chargement des exploitations…': 'Loading farms…',
    'Localisation non renseignée': 'Location not provided',
    'Modifier': 'Edit',
    'Supprimer': 'Delete',
    'Aucune exploitation enregistrée': 'No farms added',
    'Vous pouvez associer plusieurs exploitations à votre compte éleveur.': 'You can link multiple farms to your farmer account.',
    'Supprimer l’exploitation « {name} » ?': 'Delete the farm “{name}”?',
    'Erreur 404': 'Error 404',
    'Cette page n’existe pas': 'This page does not exist',
    'Vérifiez l’adresse ou retournez à votre espace.': 'Check the address or return to your dashboard.',
    'Retour au tableau de bord': 'Back to dashboard',
    'Archiver cet animal ? Sa fiche et son historique seront conservés.': 'Archive this animal? Its record and history will be kept.',
    '← Mes animaux': '← My animals',
    'Archiver': 'Archive',
    'Informations': 'Details',
    'Fiche de l’animal': 'Animal record',
    'Type': 'Type',
    'Bovin': 'Cattle',
    'Équin': 'Equine',
    'Porcin': 'Pig',
    'Caprin': 'Goat',
    'Aucun commentaire': 'No comments',
    'Historique sanitaire': 'Health history',
    'Soins enregistrés': 'Recorded care',
    'Les soins antérieurs ne sont pas disponibles hors connexion : cette fiche n’a pas encore été consultée en ligne.': 'Previous care records are unavailable offline because this record has not yet been viewed online.',
    'Vaccination': 'Vaccination',
    'Traitement': 'Treatment',
    'Aucun soin enregistré.': 'No care recorded.',
    'Ajouter un soin': 'Add care',
    'Type de soin': 'Care type',
    'Date': 'Date',
    'Description': 'Description',
    'Ajout…': 'Adding…',
    'Ajouter le soin': 'Add care record',
    'Organisation': 'Planning',
    'Rappels': 'Reminders',
    'Les rappels antérieurs ne sont pas disponibles hors connexion : cette fiche n’a pas encore été consultée en ligne.': 'Previous reminders are unavailable offline because this record has not yet been viewed online.',
    'Aucun rappel enregistré.': 'No reminders recorded.',
    'Ajouter un rappel': 'Add a reminder',
    'Intitulé': 'Title',
    'Description (facultative)': 'Description (optional)',
    'Ajouter le rappel': 'Add reminder',
    'Animal introuvable.': 'Animal not found.',
    'Supprimer l’exploitation contenant des animaux': 'A farm with animals cannot be deleted.',
    'Une exploitation contenant des animaux ne peut pas être supprimée.': 'A farm with animals cannot be deleted.',
};

function storedLocale() {
    try {
        return localStorage.getItem('madinagrigest-language') === 'en' ? 'en' : 'fr';
    } catch (error) {
        console.warn('Unable to read the saved language preference.', error);
        return 'fr';
    }
}

export const locale = ref(storedLocale());

watch(locale, (language) => {
    document.documentElement.lang = language;
    try {
        localStorage.setItem('madinagrigest-language', language);
    } catch (error) {
        console.warn('Unable to save the language preference.', error);
    }
}, { immediate: true });

export function setLocale(language) {
    if (language === 'fr' || language === 'en') locale.value = language;
}

export function toggleLocale() {
    setLocale(locale.value === 'fr' ? 'en' : 'fr');
}

export function t(message, values = {}) {
    let translated = locale.value === 'en' ? (translations[message] ?? message) : message;
    for (const [key, value] of Object.entries(values)) {
        translated = translated.replaceAll(`{${key}}`, String(value));
    }
    return translated;
}

export function translateError(message) {
    if (locale.value === 'en') return t(message);

    if (message === 'These credentials do not match our records.') {
        return 'Ces identifiants ne correspondent pas à nos enregistrements.';
    }

    const fieldName = (field) => ({
        'first name': 'prénom',
        'last name': 'nom',
        email: 'adresse e-mail',
        password: 'mot de passe',
        'password confirmation': 'confirmation du mot de passe',
        siret: 'numéro SIRET',
    }[field.toLowerCase()] ?? field);
    const required = message.match(/^The (.+) field is required\.$/);
    if (required) return `Le champ ${fieldName(required[1])} est obligatoire.`;

    const invalidEmail = message.match(/^The (.+) field must be a valid email address\.$/);
    if (invalidEmail) return `Le champ ${fieldName(invalidEmail[1])} doit être une adresse e-mail valide.`;

    const unique = message.match(/^The (.+?)(?: field)? has already been taken\.$/);
    if (unique) return `${fieldName(unique[1])} est déjà utilisé.`;

    const minimum = message.match(/^The (.+) field must be at least (\d+) characters\.$/);
    if (minimum) return `Le champ ${fieldName(minimum[1])} doit contenir au moins ${minimum[2]} caractères.`;

    const maximum = message.match(/^The (.+) field must not be greater than (\d+) characters\.$/);
    if (maximum) return `Le champ ${fieldName(maximum[1])} ne doit pas dépasser ${maximum[2]} caractères.`;

    const confirmed = message.match(/^The (.+) field confirmation does not match\.$/);
    if (confirmed) return `La confirmation du champ ${fieldName(confirmed[1])} ne correspond pas.`;

    const exactLength = message.match(/^The (.+) field must be (\d+) characters\.$/);
    if (exactLength) return `Le champ ${fieldName(exactLength[1])} doit contenir ${exactLength[2]} caractères.`;

    return t(message);
}
