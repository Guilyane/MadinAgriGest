# MadinAgriGest

Application web de gestion d’animaux, de suivi sanitaire et d’exploitations agricoles.

Le périmètre MVP et le socle technique ont été définis progressivement : Laravel API, Vue 3 et MySQL/MariaDB. Le back-end Laravel est dans [backend/](./backend/README.md).

Les fonctions d’administration détaillées et les modules hors MVP restent à définir avant leur ajout.

Après une première connexion en ligne, l’application conserve sur l’appareil les données consultées et permet de créer ou modifier des animaux, des exploitations, des soins et des rappels hors ligne. Les changements en attente sont synchronisés automatiquement au retour du réseau. La connexion et l’inscription nécessitent toujours Internet ; les données hors ligne sont propres au navigateur et à l’appareil utilisés.

L’interface est disponible en français et en anglais. Le choix de langue est mémorisé dans le navigateur.
