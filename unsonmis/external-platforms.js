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
      <button type="button" data-platform="freemusicarchive">Free Music Archive</button>
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

  <hr class="community-divider">
  <h3>🎧 Catalogue gratuit : écoute directe</h3>
  <p>Trois catalogues supplémentaires : aperçus Apple/iTunes, Internet Archive et fichiers audio libres de Wikimedia Commons. Les licences et conditions restent celles de chaque œuvre.</p>
  <div class="search-box">
    <input id="freeCatalogSearch" type="search" placeholder="Rechercher un artiste ou un style…">
    <button id="freeCatalogBtn" type="button">Rechercher</button>
  </div>
  <div id="freeCatalogStatus" class="community-status" aria-live="polite"></div>
  <div id="freeCatalogResults" class="track-list"></div>
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
    freemusicarchive: q => "https://freemusicarchive.org/search/?quicksearch=" + encodeURIComponent(q),
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


  const freeSearch = document.getElementById("freeCatalogSearch");
  const freeStatus = document.getElementById("freeCatalogStatus");
  const freeResults = document.getElementById("freeCatalogResults");

  function resultCard(title, artist, source, url, license, preview) {
    const card = document.createElement("article");
    card.className = "community-admin-item";
    const heading = document.createElement("strong");
    heading.textContent = title || "Titre sans nom";
    const byline = document.createElement("p");
    byline.textContent = (artist || "Artiste non renseigné") + " · " + source + (license ? " · " + license : "");
    card.append(heading, byline);
    if (preview) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = preview;
      audio.style.width = "100%";
      card.append(audio);
      const playInMain = document.createElement("button");
      playInMain.type = "button";
      playInMain.className = "action-pill primary";
      playInMain.textContent = "▶ Lire dans le lecteur UNSONMIS";
      playInMain.addEventListener("click", () => {
        if (typeof window.playFromQueue === "function") {
          window.playFromQueue([{ title: title || "Titre sans nom", artist: artist || "Artiste non renseigné", url: preview, isLive: false }], 0);
        } else {
          audio.play().catch(() => { byline.textContent += " · Lecture impossible dans ce navigateur"; });
        }
      });
      card.append(playInMain);
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Voir la source et ses conditions";
    link.style.color = "var(--yellow)";
    card.append(link);
    return card;
  }

  async function searchFreeCatalogues() {
    const q = freeSearch.value.trim();
    if (!q) { freeStatus.textContent = "Entre un artiste ou un style musical."; return; }
    freeResults.replaceChildren();
    freeStatus.textContent = "Recherche dans les catalogues gratuits…";
    const jobs = [];

    jobs.push((async () => {
      const api = "https://ccmixter.org/api/query?f=json&t=search_uploads&dataview=links&limit=12&search_type=any&lic=by&search=" + encodeURIComponent(q);
      const res = await fetch(api);
      if (!res.ok) throw new Error("ccMixter indisponible");
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.results || data.uploads || data.data || Object.values(data).filter(v => v && typeof v === "object"));
      const findAudio = value => {
        if (!value) return "";
        if (typeof value === "string") return /^https?:\/\//i.test(value) && /\.(mp3|ogg|wav|flac|m4a)(\?|$)/i.test(value) ? value : "";
        if (Array.isArray(value)) {
          for (const child of value) { const found = findAudio(child); if (found) return found; }
        } else if (typeof value === "object") {
          for (const child of Object.values(value)) { const found = findAudio(child); if (found) return found; }
        }
        return "";
      };
      await Promise.all(rows.slice(0, 12).map(async item => {
        const id = item.upload_id || item.id;
        const artist = item.user_real_name || item.user_name || item.artist || item.user || "Artiste ccMixter";
        const title = item.upload_name || item.title || item.name || "Titre ccMixter";
        const page = item.upload_url || (id ? "https://ccmixter.org/files/" + encodeURIComponent(item.user_name || item.user || "") + "/" + encodeURIComponent(id) : "https://ccmixter.org/");
        let audio = findAudio(item);
        if (!audio && id) {
          try {
            const fileRes = await fetch("https://ccmixter.org/api/query?f=json&dataview=files&ids=" + encodeURIComponent(id));
            if (fileRes.ok) audio = findAudio(await fileRes.json());
          } catch (_) {}
        }
        const license = item.license || item.license_name || "Creative Commons BY · consulter la fiche";
        freeResults.append(resultCard(title, artist, "ccMixter", page, license + " · attribution requise", audio));
      }));
    })());
    jobs.push((async () => {
      const api = "https://itunes.apple.com/search?entity=song&limit=12&term=" + encodeURIComponent(q);
      const res = await fetch(api);
      if (!res.ok) throw new Error("Apple/iTunes indisponible");
      const data = await res.json();
      (data.results || []).forEach(t => {
        if (!t.previewUrl) return;
        freeResults.append(resultCard(t.trackName, t.artistName, "Apple/iTunes · aperçu", t.trackViewUrl || "https://music.apple.com/", "Aperçu court", t.previewUrl));
      });
    })());

    jobs.push((async () => {
      const api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent("filemime:audio " + q) + "&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*";
      const res = await fetch(api);
      if (!res.ok) throw new Error("Wikimedia Commons indisponible");
      const data = await res.json();
      Object.values(data.query?.pages || {}).forEach(page => {
        const info = page.imageinfo?.[0];
        const meta = info?.extmetadata || {};
        const license = meta.LicenseShortName?.value || "";
        const licenseUrl = meta.LicenseUrl?.value || "";
        if (!info?.url || !/^(CC0|Public domain|CC BY|CC BY-SA|CC BY-NC|CC BY-NC-SA|CC BY-ND|CC BY-NC-ND)/i.test(license)) return;
        const artist = (meta.Artist?.value || meta.Credit?.value || "Auteur non renseigné").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const title = page.title.replace(/^File:/, "");
        const pageUrl = "https://commons.wikimedia.org/wiki/" + encodeURIComponent(page.title.replace(/ /g, "_"));
        freeResults.append(resultCard(title, artist, "Wikimedia Commons", pageUrl, license + (licenseUrl ? " · " + licenseUrl : ""), info.url));
      });
    })());
    jobs.push((async () => {
      const query = 'mediatype:audio AND licenseurl:* AND "' + q.replace(/[+-!(){}\[\]^"~*?:\\/]/g, " ") + '"';
      const api = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(query) + "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=licenseurl&rows=10&page=1&output=json";
      const res = await fetch(api);
      if (!res.ok) throw new Error("Internet Archive indisponible");
      const data = await res.json();
      const docs = data.response?.docs || [];
      await Promise.all(docs.slice(0, 8).map(async item => {
        try {
          const metaRes = await fetch("https://archive.org/metadata/" + encodeURIComponent(item.identifier));
          if (!metaRes.ok) return;
          const meta = await metaRes.json();
          const files = meta.files || [];
          const audioFile = files.find(f => typeof f.name === "string" && /\.mp3$/i.test(f.name) && !f.name.includes("__ia_thumb"));
          if (!audioFile) return;
          const license = String(item.licenseurl || "");
          const allowed = /creativecommons\.org\/licenses\/(by|by-sa)\//i.test(license) || /creativecommons\.org\/publicdomain\/(zero|mark)/i.test(license) || /public domain|cc0/i.test(String(meta.metadata?.rights || ""));
          if (!allowed) return;
          const audioUrl = "https://archive.org/download/" + encodeURIComponent(item.identifier) + "/" + audioFile.name.split("/").map(encodeURIComponent).join("/");
          const page = "https://archive.org/details/" + encodeURIComponent(item.identifier);
          const label = /publicdomain/i.test(license) || license.includes("/publicdomain/") || /public domain|cc0/i.test(String(meta.metadata?.rights || "")) ? "Domaine public / CC0" : /by-sa/i.test(license) ? "CC BY-SA · attribution + partage à l'identique" : "CC BY · attribution requise";
          freeResults.append(resultCard(item.title, Array.isArray(item.creator) ? item.creator.join(", ") : item.creator, "Internet Archive", page, label, audioUrl));
        } catch (_) {}
      }));
    })());

    const settled = await Promise.allSettled(jobs);
    const errors = settled.filter(x => x.status === "rejected").length;
    const count = freeResults.children.length;
    freeStatus.textContent = count + " résultat(s) affiché(s)." + (errors ? " Certains catalogues n'ont pas répondu." : "") + " Les aperçus Apple sont limités ; les fichiers Archive dépendent de leur licence et disponibilité.";
    if (!count) freeStatus.textContent += " Aucun fichier compatible trouvé pour cette recherche.";
  }

  document.getElementById("freeCatalogBtn").addEventListener("click", searchFreeCatalogues);
  freeSearch.addEventListener("keydown", e => { if (e.key === "Enter") searchFreeCatalogues(); });

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
    if (/(^|\.)soundcloud\.com$/i.test(url.hostname)) {
      embed = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url.href) + "&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true";
    } else if (/(^|\.)mixcloud\.com$/i.test(url.hostname)) {
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
