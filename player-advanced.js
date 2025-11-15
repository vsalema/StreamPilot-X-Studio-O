// player-advanced.js
// Optimisation init player + overlay iframe lazy, sans toucher au CORS ni aux URLs absolues
// --- Détection du type de flux (HLS, DASH, YouTube, fallback) ---
function spxDetectSourceConfig(url) {
  const lower = url.trim().toLowerCase();

  if (lower.endsWith('.m3u8')) {
    return { src: url, type: 'application/x-mpegURL' };
  }
  if (lower.endsWith('.mpd')) {
    return { src: url, type: 'application/dash+xml' };
  }
  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) {
    return { src: url, type: 'video/youtube' };
  }
  if (lower.endsWith('.mp3')) {
    return { src: url, type: 'audio/mpeg' };
  }

  // Fallback générique
  return { src: url, type: 'video/mp4' };
}

// --- Init player "core" : on ne fait rien si app.js a déjà tout initialisé ---
function spxInitCorePlayerIfNeeded() {
  if (typeof videojs === 'undefined') return;

  const existing = videojs.getPlayers && videojs.getPlayers();
  // Si le player est déjà géré par app.js, on récupère simplement la ref
  if (existing && existing.player && existing.player.id_ === 'player') {
    window.spxPlayer = existing.player;
    return;
  }

  const el = document.getElementById('player');
  if (!el) return;

  const player = videojs(el, {
    preload: 'metadata',
    fluid: true,
    controls: true,
    html5: {
      nativeAudioTracks: false,
      nativeVideoTracks: false
    }
  });

  window.spxPlayer = player;
}
// --- Wiring URL input + bouton, en mode "soft" pour éviter de casser app.js ---
function spxWireUrlLoader() {
  const player = window.spxPlayer;
  if (!player) return;

  // Dans ton HTML actuel, l’input est #srcInput et le bouton #btnLoad
  const urlInput = document.getElementById('srcInput');
  const playBtn  = document.getElementById('btnLoad');

  if (!urlInput || !playBtn) return;

  const handler = (e) => {
    if (e && e.type === 'keydown' && e.key !== 'Enter') return;

    const raw = urlInput.value.trim();
    if (!raw) return;

    const source = spxDetectSourceConfig(raw);

    // Aucune réécriture d’URL, aucun hack CORS
    player.src(source);
    player.play().catch(() => {});
  };

  // On ajoute une seule fois (pour éviter les doublons si app.js écoute déjà)
  if (!playBtn.dataset.spxBound) {
    playBtn.addEventListener('click', handler);
    playBtn.dataset.spxBound = '1';
  }
  if (!urlInput.dataset.spxBound) {
    urlInput.addEventListener('keydown', handler);
    urlInput.dataset.spxBound = '1';
  }
}
// --- Overlay iframe lazy sur le player ---
// -> utilise le CSS existant (#playerOverlayLayer, #playerOverlayClose)
function spxInitOverlayIframe() {
  const player = window.spxPlayer;
  if (!player) return;
  const rootEl = player.el();
  if (!rootEl) return;

  // Si déjà créé par ailleurs, on ne double pas
  let overlay = rootEl.querySelector('#playerOverlayLayer');
  let iframe, closeBtn;

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'playerOverlayLayer';

    // Bouton close
    closeBtn = document.createElement('button');
    closeBtn.id = 'playerOverlayClose';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';

    // Iframe lazy
    iframe = document.createElement('iframe');
    iframe.id = 'playerOverlayFrame';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('referrerpolicy', 'no-referrer');

    overlay.appendChild(closeBtn);
    overlay.appendChild(iframe);
    rootEl.appendChild(overlay);
  } else {
    iframe = overlay.querySelector('iframe') || overlay.querySelector('#playerOverlayFrame');
    closeBtn = overlay.querySelector('#playerOverlayClose');
  }

  if (!iframe || !closeBtn) return;

  overlay.hidden = true;
  overlay.style.display = 'none';

  let iframeLoaded = false;

  function openOverlay(url) {
    if (url && !iframe.dataset.src) {
      iframe.dataset.src = url;
    }
    if (!iframeLoaded && iframe.dataset.src) {
      iframe.src = iframe.dataset.src;
      iframeLoaded = true;
    }
    overlay.hidden = false;
    overlay.style.display = 'block';
  }

  function closeOverlay() {
    overlay.hidden = true;
    overlay.style.display = 'none';
  }

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  // Expose une API globale ultra simple, que tu peux appeler depuis custom-addon.js
  // Exemple: window.spxOpenOverlay('https://vsalema.github.io/spx-docs/');
  window.spxOpenOverlay = openOverlay;
}

// --- Boot sequence optimisée ---
// 1) core player le plus vite possible
// 2) wiring URL
// 3) overlay iframe créé et lazy-loadable
document.addEventListener('DOMContentLoaded', () => {
  spxInitCorePlayerIfNeeded();
  spxWireUrlLoader();

  // On laisse un petit délai pour ne pas bloquer le rendu
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      spxInitOverlayIframe();
    });
  } else {
    setTimeout(() => {
      spxInitOverlayIframe();
    }, 400);
  }
});

function spxFindLogoForTitle(title) {
  if (!title || !Array.isArray(window.CUSTOM_LIST)) return null;
  const clean = title.trim().toLowerCase();

  // match exact ou "propre"
  const match = window.CUSTOM_LIST.find((item) => {
    if (!item || !item.title) return false;
    return item.title.trim().toLowerCase() === clean;
  });

  return match && match.logo ? match.logo : null;
}

function spxEnhanceCurrentTitleWithLogo() {
  const el = document.getElementById('currentTitle');
  if (!el) return;

  function applyLogo() {
    // Si on a déjà injecté un logo, on ne refait rien
    if (el.querySelector('.spx-title-logo')) return;

    const text = el.textContent.trim();
    if (!text) return;

    const logoUrl = spxFindLogoForTitle(text);
    if (!logoUrl) return;

    el.innerHTML = `
      <img src="${logoUrl}" class="spx-title-logo" alt="" />
      <span>${text}</span>
    `;
  }

  // Première passe au chargement
  applyLogo();

  // Surveille tout changement (NEXT/PREV, customlist, etc.)
  const observer = new MutationObserver(() => {
    // Si quelqu’un remet juste du texte, on re-applique le logo
    if (!el.querySelector('.spx-title-logo')) {
      applyLogo();
    }
  });

  observer.observe(el, {
    childList: true,
    characterData: true,
    subtree: true
  });
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  spxEnhanceCurrentTitleWithLogo();
});


