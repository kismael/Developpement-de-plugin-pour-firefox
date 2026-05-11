// sync.js — Communication avec Firebase REST API
// Remplacez cette URL par celle de VOTRE projet Firebase :
const FIREBASE_URL = "https://pluginfirefox-kd-default-rtdb.firebaseio.com";

// Nom de la "collection" dans Firebase où on stocke les liens partagés
const CHEMIN = "/liens_partages";

// ─── Envoyer un lien vers Firebase ───────────────────────────────────────────

function partagerLien(url, titre, tags) {
  // On crée un objet avec les infos du lien
  const lien = {
    url: url,
    titre: titre,
    tags: tags,
    partageA: Date.now(), // horodatage
    utilisateur: obtenirIdUtilisateur() // ID anonyme
  };

  // On envoie via l'API REST Firebase (méthode POST = crée un nouvel enregistrement)
  return fetch(FIREBASE_URL + CHEMIN + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lien)
  })
  .then(function(reponse) {
    return reponse.json();
  })
  .then(function(data) {
    console.log("Lien partagé avec succès, ID Firebase :", data.name);
    return data;
  })
  .catch(function(erreur) {
    console.error("Erreur de partage :", erreur);
  });
}

// ─── Récupérer les liens partagés depuis Firebase ─────────────────────────────

function recupererLiensPartages() {
  return fetch(FIREBASE_URL + CHEMIN + ".json")
  .then(function(reponse) {
    return reponse.json();
  })
  .then(function(data) {
    if (!data) return []; // base vide

    // Firebase retourne un objet avec des clés aléatoires → on le convertit en tableau
    return Object.values(data);
  })
  .catch(function(erreur) {
    console.error("Erreur de récupération :", erreur);
    return [];
  });
}

// ─── Identifiant utilisateur anonyme ─────────────────────────────────────────
// Chaque installation génère un ID unique stocké localement
// (pas de compte requis, juste pour distinguer les utilisateurs)

function obtenirIdUtilisateur() {
  // Note : cette fonction est appelée de façon synchrone ici pour simplifier.
  // Dans un vrai projet, on utiliserait un ID stocké dans browser.storage.
  return "user_" + Math.random().toString(36).substring(2, 9);
}