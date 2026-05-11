#  Développement — Plugin Firefox

> Partagez votre historique de navigation, organisez vos liens par tags, et synchronisez avec vos collaborateurs en temps réel.

![Firefox](https://img.shields.io/badge/Firefox-Extension-FF7139?logo=firefox-browser&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V2-2b5797)
![Langage](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![Backend](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?logo=firebase&logoColor=black)
![Statut](https://img.shields.io/badge/Statut-Fonctionnel-2e7d32)

---

##  Sommaire

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Structure des fichiers](#-structure-des-fichiers)
- [Installation](#-installation)
- [Configuration Firebase](#-configuration-firebase)
- [Utilisation](#-utilisation)
- [Technologies utilisées](#-technologies-utilisées)
- [Améliorations prévues](#-améliorations-prévues)
- [Auteur](#-auteur)

---

## 🔍 Aperçu

**HistoShare** est une extension Firefox développée en JavaScript vanilla (sans framework) qui permet de :

1. **Lire** l'historique de navigation directement depuis Firefox via l'API `browser.history`
2. **Tagger** chaque lien avec des mots-clés personnalisés, sauvegardés localement
3. **Filtrer** les liens par tag pour retrouver rapidement une ressource
4. **Partager** son historique enrichi avec d'autres utilisateurs via Firebase

---

## ✅ Fonctionnalités

| Fonctionnalité | Description | Statut |
|---|---|---|
| Affichage de l'historique    | 20 derniers liens sur 7 jours          | ✅ Implémenté |
| Ajout de tags                | Touche Entrée dans le champ `+ tag`    | ✅ Implémenté |
| Persistance des tags         | Sauvegarde via `browser.storage.local` | ✅ Implémenté |
| Filtrage par tag             | Champ de recherche en temps réel       | ✅ Implémenté |
| Partage vers Firebase        | Bouton ⬆ sur chaque lien               | ✅ Implémenté |
| Affichage des liens partagés | Onglet "Liens partagés"                | ✅ Implémenté |
| Identification anonyme       | ID généré localement par utilisateur   | ✅ Implémenté |
| Filtrage des liens partagés  | Recherche côté partagé                     | 🔜 Prévu |
| Suppression de tags          | Retirer un tag existant                    | 🔜 Prévu |
| Authentification Firebase    | Sécurisation par compte                    | 🔜 Prévu |

---

##  Architecture

```
Utilisateur
    │
    ▼
popup.html  ──────────────────────────────────────────────────────────┐
    │                                                                  │
popup.js  ──── browser.history API  ──── Historique local             │
    │                                                                  │
    │       ──── browser.storage.local ── Tags par URL                │
    │                                                                  │
sync.js   ──── fetch() REST ──────────── Firebase Realtime DB ────────┘
                                              │
                                         Autres utilisateurs
```

**Flux de données :**

1. Ouverture du popup → `popup.js` interroge `browser.history`
2. Les tags sauvegardés sont chargés depuis `browser.storage.local`
3. Les deux sources sont fusionnées et affichées dans `popup.html`
4. Clic sur "Partager" → `sync.js` envoie un `POST` JSON vers Firebase
5. Onglet "Liens partagés" → `GET` Firebase → affichage communautaire

---

##  Structure des fichiers

```
mon-extension/
│
├── manifest.json      # Déclaration : permissions, popup, version
├── popup.html         # Interface utilisateur (onglets, filtre, liste)
├── popup.css          # Styles visuels
├── popup.js           # Logique principale (historique, tags, filtrage)
└── sync.js            # Module de synchronisation Firebase
```

### Rôle de chaque fichier

**`manifest.json`** — Point d'entrée obligatoire. Déclare les permissions nécessaires :
```json
{
  "permissions": ["history", "storage", "tabs"],
  "host_permissions": ["https://*.firebaseio.com/*"]
}
```

**`popup.js`** — Cœur de l'extension. Gère :
- La lecture de l'historique via `browser.history.search()`
- Le stockage des tags via `browser.storage.local`
- Le filtrage par mot-clé côté client

**`sync.js`** — Module de partage. Deux fonctions principales :
- `partagerLien(url, titre, tags)` → POST vers Firebase
- `recupererLiensPartages()` → GET depuis Firebase

---

##  Installation

### Prérequis

- Firefox (version récente)
- Un éditeur de code (VS Code recommandé)
- Un compte Google (pour Firebase, uniquement si vous voulez le partage)

### Charger l'extension dans Firefox

1. Ouvrez Firefox et tapez `about:debugging` dans la barre d'adresse
2. Cliquez sur **"Ce Firefox"** dans le menu gauche
3. Cliquez sur **"Charger un module complémentaire temporaire"**
4. Naviguez jusqu'au dossier du projet et sélectionnez `manifest.json`
5. L'icône HistoShare apparaît dans la barre Firefox 

> **Note :** L'extension temporaire est supprimée à la fermeture de Firefox. Pour la recharger, répétez l'opération depuis `about:debugging`.

### Recharger après une modification

Dans `about:debugging`, cliquez sur **"Recharger"** à côté de l'extension.

Pour déboguer : clic droit sur le popup → **Inspecter** → Console.

---

##  Configuration Firebase

Le partage entre utilisateurs nécessite un projet Firebase.

### Étapes de configuration

1. Rendez-vous sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créez un nouveau projet
3. Dans le menu gauche : **Realtime Database** → **Créer une base de données**
4. Choisissez le **mode test** (règles ouvertes pour le développement)
5. Copiez votre URL de base de données :
   ```
   https://votre-projet-default-rtdb.firebaseio.com
   ```
6. Collez cette URL dans `sync.js` :
   ```js
   const FIREBASE_URL = "https://pluginfirefox-kd-default-rtdb.firebaseio.com/liens_partages/";
   ```
7. Rechargez l'extension dans "about:debugging"

### Structure des données dans Firebase

```json
{
  "liens_partages": {
    "-NxKj2abc123": {
      "url": "https://exemple.com/article",
      "titre": "Titre de la page",
      "tags": ["dev", "firefox"],
      "partageA": 1716300000000,
      "utilisateur": "user_a7f3k"
    }
  }
}
```

### Vérifier que ça fonctionne

Après avoir partagé un lien, ouvrez dans Firefox :
```
https://pluginfirefox-kd-default-rtdb.firebaseio.com/liens_partages/
```
Vous devez voir le JSON avec votre lien. 

---

## 📖 Utilisation

### Ajouter un tag

1. Ouvrez le popup HistoShare
2. Repérez un lien dans la liste
3. Cliquez sur le champ `+ tag` à droite du lien
4. Tapez votre mot-clé et appuyez sur **Entrée**

### Filtrer par tag

1. Saisissez un tag dans le champ **"Filtrer par tag..."** en haut
2. Cliquez sur **Filtrer** — seuls les liens avec ce tag s'affichent
3. Cliquez sur **Tout** pour revenir à la liste complète

### Partager un lien

1. Ajoutez d'abord vos tags au lien (optionnel mais recommandé)
2. Cliquez sur ⬆ Partager sur le lien souhaité
3. Le bouton indique "✓ Partagé !" en vert si l'envoi réussit

### Voir les liens partagés

1. Cliquez sur l'onglet "Liens partagés" dans le popup
2. Les liens envoyés par tous les utilisateurs connectés à votre Firebase apparaissent
3. Les plus récents sont affichés en premier

---

##  Technologies utilisées

| Technologie | Usage |
|---|---|
| HTML5 / CSS3 | Interface du popup |
| JavaScript ES6+ | Logique de l'extension (vanilla, sans framework) |
| WebExtensions API | Accès à l'historique, stockage local, onglets |
| `browser.history` | Lecture des pages visitées |
| `browser.storage.local` | Persistance des tags entre sessions |
| Firebase Realtime DB | Synchronisation entre utilisateurs |
| `fetch()` | Communication avec Firebase (REST, sans SDK) |

---

##  Améliorations prévues

### Court terme
- [ ] Filtrage des liens partagés par tag
- [ ] Suppression d'un tag existant (bouton ✕)
- [ ] Pagination de la liste (au-delà de 20 liens)

### Moyen terme
- [ ] Authentification Firebase (email ou anonyme)
- [ ] Règles de sécurité Firebase (lecture/écriture contrôlée)
- [ ] Export des liens et tags en JSON ou CSV

### Long terme
- [ ] Migration vers Manifest V3
- [ ] Publication sur [addons.mozilla.org](https://addons.mozilla.org)
- [ ] Suggestions automatiques de tags

---

##  Auteur

Projet développé par deux Etudiants KONE KPANTIERI ISMAEL ET DIABY ISHAK BAKARY  dans le cadre d'un apprentissage des extensions Firefox, de zéro à une version fonctionnelle avec backend cloud.

Stack utilisée : HTML · CSS · JavaScript · Firefox WebExtensions API · Firebase

---

> Conseil : Pour tester le partage à plusieurs, donnez à vos collaborateurs votre URL Firebase. Ils la renseignent dans leur `sync.js`, rechargent l'extension, et voient vos liens partagés dans l'onglet "Liens partagés".
