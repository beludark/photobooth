# 둘의 부스 — Photobooth à deux (à distance)

Un mini photobooth façon coréenne, pensé pour deux personnes connectées depuis deux endroits différents. Format à choisir, cadre, filtre, décompte entre les poses, sélection des meilleures photos, stickers, puis téléchargement de la bande finale.

## Comment ça marche (techniquement)

GitHub Pages n'héberge que des fichiers statiques (pas de serveur). Pour que vous puissiez vous voir en direct malgré ça, le site utilise **WebRTC** (connexion directe entre vos deux navigateurs) via la librairie **PeerJS**, qui s'appuie sur son serveur public gratuit uniquement pour la "poignée de main" initiale (aucune vidéo ne transite par ce serveur, seulement l'établissement de la connexion).

Conséquences à connaître :
- Ça fonctionne très bien pour un usage perso à deux. Le serveur public PeerJS n'est pas garanti à 100% (rare) — si la connexion échoue, réessayez.
- Chaque salle = un identifiant unique (`pb-<code>`). Le premier arrivé "possède" la salle ; une deuxième personne s'y connecte. Une troisième tentative est automatiquement refusée (limite stricte de 2 personnes par salle).
- Il n'y a pas de base de données : si vous fermez l'onglet, la salle disparaît. Il n'y a rien à nettoyer côté serveur.
- Ni les photos ni la vidéo ne sont stockées nulle part — tout reste dans vos deux navigateurs, en mémoire, jusqu'au téléchargement final.

## Déploiement sur GitHub Pages

1. Crée un nouveau repository GitHub (public ou privé avec Pages activé sur un plan qui le permet).
2. Mets tous les fichiers de ce dossier (`index.html`, `style.css`, `js/`) à la racine du repo.
3. Va dans **Settings → Pages**, choisis la branche `main` (ou celle utilisée) et le dossier `/ (root)`.
4. Attends une ou deux minutes, ton site sera disponible sur `https://<ton-user>.github.io/<ton-repo>/`.
5. **Important** : la caméra ne fonctionne qu'en HTTPS (ou en localhost). GitHub Pages sert en HTTPS par défaut, donc pas d'action nécessaire ici.

## Utilisation

1. Toi : ouvre le site, clique **Créer ma salle**. Un code du type `LUNE-4821` apparaît, ainsi qu'un lien à copier.
2. Envoie ce lien à ta copine (Messages, WhatsApp, peu importe).
3. Elle ouvre le lien (le code se pré-remplit), clique **Rejoindre**, autorise la caméra.
4. Une fois connectées, l'hôte clique **On y va** pour passer au choix du format.
5. Choisissez ensemble le format de bande, la couleur du cadre et le filtre (les choix se synchronisent en direct).
6. L'hôte clique **Démarrer la séance** : décompte de 3 secondes avant chaque photo, puis une pause de 3 secondes entre chaque pose pour changer de tête.
7. Une fois toutes les photos prises, sélectionnez ensemble celles que vous gardez.
8. Décorez la bande finale avec des stickers (cliquez un sticker dans la palette, puis cliquez sur la bande pour le poser ; recliquez un sticker déjà posé pour l'enlever).
9. Cliquez **Télécharger** — l'image PNG finale se télécharge dans votre navigateur.

## Personnalisation rapide

- Formats, couleurs de cadre, filtres et emojis de stickers : tout est modifiable en haut de `js/state.js`.
- Durées du décompte et de la pause entre les poses : constantes `COUNTDOWN_SECONDS` et `REST_SECONDS` dans `js/state.js`.
- Palette de couleurs et polices : variables CSS en haut de `style.css`.

Amusez-vous bien ! 💗
