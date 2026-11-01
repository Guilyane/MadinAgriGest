# MadinAgriGest — API

Back-end Laravel de l’application de gestion d’animaux, de suivi sanitaire et d’exploitations.

## Prérequis

- PHP 8.3 ou supérieur avec les extensions Laravel nécessaires.
- Composer.
- MySQL 8.0.16 ou supérieur. SQLite est utilisé en mémoire pour les tests.

## Installation locale

Depuis le dossier `backend` :

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Créer la base `madinagrigest`, puis renseigner l’accès à MySQL dans `.env`. Ensuite :

```powershell
php artisan migrate --seed
php artisan serve
```

Les types de bétail initiaux sont `Bovin`, `Porcin`, `Équin` et `Caprin`. Aucun compte de démonstration ni compte administrateur n’est créé par le seeder.

## Authentification SPA

L’API utilise Sanctum en mode session/cookie pour une interface Vue servie par la même application. Le client doit :

1. Demander `GET /sanctum/csrf-cookie`.
2. Envoyer les cookies avec les requêtes.
3. Envoyer l’en-tête `X-XSRF-TOKEN` pour les requêtes qui modifient des données.
4. Appeler `POST /api/auth/register` ou `POST /api/auth/login`.

La variable `SANCTUM_STATEFUL_DOMAINS` doit contenir les hôtes utilisés en développement. En production, servir l’interface et l’API depuis le même domaine privilégié. Ne pas conserver de mot de passe ni de jeton dans le stockage local du navigateur.

À l’inscription publique, le profil est limité à `particulier` ou `eleveur`. L’API ne permet pas de s’attribuer le rôle `admin`.

## Interface Vue

L’application Vue 3 et Vue Router est intégrée à Laravel et servie sur le même domaine que l’API. Depuis le dossier `backend` :

```powershell
npm install
npm run dev
```

Dans un second terminal, lancer Laravel avec `php artisan serve`. Pour compiler les fichiers destinés à la production, utiliser `npm run build`.

Les routes front principales sont `/connexion`, `/inscription`, `/` (tableau de bord), `/animaux`, `/animaux/nouveau`, `/animaux/{id}` et `/exploitations`. La navigation vers les pages d’exploitation est réservée au profil éleveur. Les fichiers d’interface se trouvent dans `resources/js/pages`, les composants réutilisables dans `resources/js/components` et le routage dans `resources/js/router.js`.

## Routes MVP

Toutes les routes ci-dessous, sauf l’inscription et la connexion, nécessitent une session authentifiée.

| Méthode | Route | Usage |
|---|---|---|
| `POST` | `/api/auth/register` | Créer un compte particulier ou éleveur |
| `POST` | `/api/auth/login` | Ouvrir une session |
| `GET` | `/api/auth/me` | Consulter le profil connecté |
| `PATCH` | `/api/auth/me` | Modifier nom, prénom ou adresse e-mail |
| `POST` | `/api/auth/logout` | Fermer la session |
| `GET` | `/api/dashboard` | Résumé des animaux actifs et des rappels |
| `GET` | `/api/livestock-types` | Lister les types de bétail |
| `GET`, `POST` | `/api/animals` | Lister ou ajouter des animaux |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/animals/{id}` | Consulter, modifier ou archiver un animal |
| `GET`, `POST` | `/api/animals/{id}/health-records` | Consulter ou ajouter des soins |
| `PUT`, `PATCH`, `DELETE` | `/api/animals/{id}/health-records/{recordId}` | Modifier ou supprimer un soin |
| `GET`, `POST` | `/api/animals/{id}/reminders` | Consulter ou ajouter des rappels |
| `PUT`, `PATCH`, `DELETE` | `/api/animals/{id}/reminders/{reminderId}` | Modifier ou supprimer un rappel |
| `GET`, `POST` | `/api/exploitations` | Lister ou créer des exploitations (éleveur uniquement) |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/exploitations/{id}` | Consulter, modifier ou supprimer une exploitation (éleveur uniquement) |

`DELETE /api/animals/{id}` archive l’animal et conserve son historique. Un numéro de boucle renseigné doit être unique dans l’application. Le champ facultatif `housing_type` accepte `plein_air` ou `stabulation` ; ces valeurs sont mutuellement exclusives et décrivent le mode de vie actuel de l’animal. Un particulier et un éleveur peuvent gérer leurs animaux ; seul un éleveur peut gérer une ou plusieurs exploitations. Un administrateur n’accède pas aux fonctions métier non définies.

## Validation et erreurs

- `422` : données invalides, avec le détail des erreurs par champ.
- `401` : session absente ou expirée.
- `403` : rôle insuffisant.
- `404` : ressource absente ou appartenant à un autre compte.
- `409` : suppression d’une exploitation qui contient encore des animaux.

Les accès aux animaux, soins et rappels sont limités au propriétaire connecté. Les exploitations sont limitées à leur propriétaire éleveur.

## Vérifications

```powershell
php artisan test
```

Les tests utilisent SQLite en mémoire et couvrent notamment l’inscription, la limitation du rôle administrateur, l’accès exclusif des éleveurs aux exploitations, l’existence de plusieurs exploitations par éleveur et l’isolation des animaux entre comptes.
