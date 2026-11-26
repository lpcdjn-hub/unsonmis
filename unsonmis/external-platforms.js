/* UNSONMIS — plateformes musicales partenaires
   Recherche externe + lecteurs officiels intégrés. Les morceaux restent hébergés
   par leurs plateformes : aucune copie ni extraction de flux non autorisée. */
(() => {
  "use strict";
  const root = document.getElementById("tab-tracks");
  if (!root || document.getElementById("unsonmis-platforms")) return;

  const panel = document.createElement("section");
  panel.id = "unsonmis-platforms";
  panel.className = "community-panel";
  panel.style.marginTop = "18px";
  panel.innerHTML = `
    <h2>🌐 Explorer d'autres scènes musicales</h2>
    <p>Retrouve des artistes, DJ sets et musiques indépendantes sur plusieurs plateformes. La lecture s'effectue dans leur lecteur officiel ou sur leur site.</p>
    <div class="search-box">
      <input id="platformSearch" type="search" placeholder="Artiste, DJ, style ou morceau…">
      <button id="platformSearchBtn" type="button">Explorer</button>
    </div>
    <div class="community-actions" id="platformLinks">
      <button type="button" data-platform="soundcloud">SoundCloud</button>
      <button type="button" data-platform="mixcloud">Mixcloud</button>
      <button type="button" data-platform="audiomack">Audiomack</button>
      <button type="button" data-platform="jamendo">Jamendo</button>
      <button type="button" data-platform="funkwhale">Funkwhale</button>
    </div>
    <hr class="community-divider">
    <h3>▶️ Écouter un lien SoundCloud ou Mixcloud</h3>
    <p>Colle le lien public d'un morceau, mix ou émission pour afficher le lecteur officiel ici.</p>
    <div class="search-box">
      <input id="platformEmbedUrl" type="url" placeholder="https://soundcloud.com/... ou https://www.mixcloud.com/...">
      <button id="platformEmbedBtn" type="button">Charger</button>
    </div>
    <div id="platformEmbedStatus" class="community-status" aria-live="polite"></div>
    <div id="platformEmbedFrame"></div>
  `;

  const audiusList = document.getElementById("trackList");
  if (audiusList) audiusList.insertAdjacentElement("afterend", panel);
  else root.appendChild(panel);

  const search = document.getElementById("platformSearch");
  const status = document.getElementById("platformEmbedStatus");
  const links = {
    soundcloud: q => "https://soundcloud.com/search?q=" + encodeURIComponent(q),
    mixcloud: q => "https://www.mixcloud.com/search/?q=" + encodeURIComponent(q),
    audiomack: q => "https://audiomack.com/search/" + encodeURIComponent(q),
    jamendo: q => "https://www.jamendo.com/search?q=" + encodeURIComponent(q),
    funkwhale: () => "https://funkwhale.audio/"
  };
  function explore(platform) {
    const q = search.value.trim() || "electronic world music";
    window.open(links[platform](q), "_blank", "noopener,noreferrer");
  }
  panel.querySelectorAll("[data-platform]").forEach(btn => {
    btn.addEventListener("click", () => explore(btn.dataset.platform));
  });
  document.getElementById("platformSearchBtn").addEventListener("click", () => explore("soundcloud"));
  search.addEventListener("keydown", e => {
    if (e.key === "Enter") explore("soundcloud");
  });

  document.getElementById("platformEmbedBtn").addEventListener("click", () => {
    const raw = document.getElementById("platformEmbedUrl").value.trim();
    const frame = document.getElementById("platformEmbedFrame");
    frame.replaceChildren();
    let url;
    try { url = new URL(raw); } catch (_) {
      status.textContent = "Entre un lien public valide.";
      return;
    }
    if (url.protocol !== "https:") {
      status.textContent = "Le lien doit commencer par https://";
      return;
    }
    let embed;
    if (/(^|\\.)soundcloud\\.com$/i.test(url.hostname)) {
      embed = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url.href) + "&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true";
    } else if (/(^|\\.)mixcloud\\.com$/i.test(url.hostname)) {
      embed = "https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=0&feed=" + encodeURIComponent(url.pathname);
    } else {
      status.textContent = "Pour le lecteur intégré, utilise un lien SoundCloud ou Mixcloud.";
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.src = embed;
    iframe.title = "Lecteur musical intégré";
    iframe.width = "100%";
    iframe.height = "180";
    iframe.loading = "lazy";
    iframe.allow = "autoplay";
    iframe.setAttribute("frameborder", "0");
    iframe.style.borderRadius = "10px";
    frame.appendChild(iframe);
    status.textContent = "Lecteur officiel chargé. La disponibilité dépend du contenu et de la plateforme.";
  });
})();
