// popup.js — Version complète avec partage fonctionnel

let liensAvecTags = [];
let vueActuelle = "local";

document.addEventListener("DOMContentLoaded", function() {
  chargerHistorique();

  document.getElementById("btn-filtrer").addEventListener("click", filtrerParTag);
  document.getElementById("btn-tout").addEventListener("click", afficherTout);

  document.getElementById("onglet-local").addEventListener("click", function() {
    vueActuelle = "local";
    this.classList.add("actif");
    document.getElementById("onglet-partage").classList.remove("actif");
    chargerHistorique();
  });

  document.getElementById("onglet-partage").addEventListener("click", function() {
    vueActuelle = "partage";
    this.classList.add("actif");
    document.getElementById("onglet-local").classList.remove("actif");
    chargerEtAfficherLiensPartages();
  });
});

// ─── Historique local ─────────────────────────────────────────────────────────

function chargerHistorique() {
  browser.history.search({
    text: "",
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    maxResults: 20
  }).then(function(items) {
    browser.storage.local.get("tagsParUrl").then(function(resultat) {
      const tagsParUrl = resultat.tagsParUrl || {};
      liensAvecTags = items.map(function(item) {
        return {
          url: item.url,
          titre: item.title || item.url,
          tags: tagsParUrl[item.url] || []
        };
      });
      afficherLiens(liensAvecTags);
    });
  });
}

// ─── Affichage ────────────────────────────────────────────────────────────────

function afficherLiens(liens) {
  const conteneur = document.getElementById("liste-historique");
  conteneur.innerHTML = "";

  if (liens.length === 0) {
    conteneur.innerHTML = "<p>Aucun lien trouvé.</p>";
    return;
  }

  liens.forEach(function(lien) {
    const div = document.createElement("div");
    div.className = "lien-item";

    const tagsHtml = lien.tags.map(function(tag) {
      return `<span class="tag">${tag}</span>`;
    }).join("");

    // Titre tronqué
    const titreAffiche = lien.titre.length > 45
      ? lien.titre.substring(0, 45) + "..."
      : lien.titre;

    div.innerHTML = `
      <a href="${lien.url}" title="${lien.url}" target="_blank">${titreAffiche}</a>
      <div class="zone-tags">
        ${tagsHtml}
        <input type="text" class="champ-tag" placeholder="+ tag" data-url="${lien.url}">
        <button class="btn-partager" title="Partager ce lien">⬆ Partager</button>
      </div>
    `;

    // Ajout de tag (touche Entrée)
    const input = div.querySelector(".champ-tag");
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && input.value.trim() !== "") {
        ajouterTag(lien.url, input.value.trim());
        input.value = "";
      }
    });

    // Bouton Partager
    div.querySelector(".btn-partager").addEventListener("click", function() {
      const btn = this;
      btn.textContent = "Envoi...";
      btn.disabled = true;

      partagerLien(lien.url, lien.titre, lien.tags).then(function() {
        btn.textContent = "✓ Partagé !";
        btn.style.background = "#4CAF50";
      }).catch(function() {
        btn.textContent = "✗ Erreur";
        btn.style.background = "#e53935";
        btn.disabled = false;
      });
    });

    conteneur.appendChild(div);
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function ajouterTag(url, nouveauTag) {
  browser.storage.local.get("tagsParUrl").then(function(resultat) {
    const tagsParUrl = resultat.tagsParUrl || {};
    const tags = tagsParUrl[url] || [];
    if (!tags.includes(nouveauTag)) {
      tags.push(nouveauTag);
      tagsParUrl[url] = tags;
      browser.storage.local.set({ tagsParUrl }).then(chargerHistorique);
    }
  });
}

// ─── Filtrage ─────────────────────────────────────────────────────────────────

function filtrerParTag() {
  const filtre = document.getElementById("champ-filtre").value.trim().toLowerCase();
  if (!filtre) return;
  const filtres = liensAvecTags.filter(function(lien) {
    return lien.tags.some(function(tag) {
      return tag.toLowerCase().includes(filtre);
    });
  });
  afficherLiens(filtres);
}

function afficherTout() {
  document.getElementById("champ-filtre").value = "";
  if (vueActuelle === "local") afficherLiens(liensAvecTags);
  else chargerEtAfficherLiensPartages();
}

// ─── Liens partagés (Firebase) ────────────────────────────────────────────────

function chargerEtAfficherLiensPartages() {
  const conteneur = document.getElementById("liste-historique");
  conteneur.innerHTML = "<p>Connexion à Firebase...</p>";

  recupererLiensPartages().then(function(liens) {
    if (liens.length === 0) {
      conteneur.innerHTML = "<p>Aucun lien partagé pour l'instant.</p>";
      return;
    }

    conteneur.innerHTML = "";
    liens.reverse(); // les plus récents en premier

    liens.forEach(function(lien) {
      const div = document.createElement("div");
      div.className = "lien-item lien-partage";

      const tagsHtml = (lien.tags || []).map(function(tag) {
        return `<span class="tag">${tag}</span>`;
      }).join("");

      const date = new Date(lien.partageA).toLocaleDateString("fr-FR");
      const titreAffiche = (lien.titre || lien.url).substring(0, 45);

      div.innerHTML = `
        <a href="${lien.url}" title="${lien.url}" target="_blank">${titreAffiche}</a>
        <div class="meta-partage">Partagé le ${date}</div>
        <div class="zone-tags">${tagsHtml}</div>
      `;
      conteneur.appendChild(div);
    });
  }).catch(function() {
    conteneur.innerHTML = "<p style='color:red'>Erreur : vérifiez l'URL Firebase dans sync.js</p>";
  });
}