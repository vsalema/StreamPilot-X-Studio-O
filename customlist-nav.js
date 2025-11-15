// Respecte la préférence système "réduire les animations"
const _reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function scrollActiveIntoView(el){
  if (!el || typeof el.scrollIntoView !== 'function') return;
  const opts = _reduceMotion
    ? { block: 'nearest', inline: 'nearest' }
    : { behavior: 'smooth', block: 'nearest', inline: 'nearest' };
  el.scrollIntoView(opts);
}
// customlist-nav.js
(function () {
  // ------- Helpers DOM -------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const btnPrev = $('#btnPrev');
  const btnNext = $('#btnNext');
  const btnToggle = $('#btnToggleCustomList');
  const listEl   = $('#customList');
  const titleEl  = $('#currentTitle');

  if (!btnPrev || !btnNext || !btnToggle || !listEl) return;

  // État de navigation local à la customList
  let cur = -1;

  const isCustomOpen = () => btnToggle.getAttribute('aria-pressed') === 'true';

  const rows = () => $$('#customList .custom-item'); // Ordre réel rendu par custom-addon.js

  const clearActive = () => rows().forEach(r => r.classList.remove('active'));

  // ➜ PATCH : auto-scroll doux ajouté ici
  const setActiveAt = (i) => {
    const r = rows()[i];
    if (!r) return;
    r.classList.add('active');

    // Auto-scroll vers l’élément actif (respecte prefers-reduced-motion)
    scrollActiveIntoView(r);

    try {
      const name = r.querySelector('.name')?.textContent?.trim();
      if (name) titleEl.textContent = name;
    } catch (_) {}
  };

  const playAt = (i) => {
    const items = rows();
    if (!items.length) return;
    const len = items.length;
    cur = ((i % len) + len) % len;

    // Marquage visuel
    clearActive();
    setActiveAt(cur);

    // Déclenche les handlers déjà en place sur la ligne (overlay ou loadSource)
    // -> ne casse rien côté player/app.js
    items[cur].click();
  };

  const resetIfNeeded = () => {
    if (!isCustomOpen()) return;
    // Si aucune ligne active, on positionne sur la première
    if (!rows().some(r => r.classList.contains('active'))) {
      if (rows().length) playAt(0);
    }
  };
// ---- Interception Prev/Next quand la customList est ouverte ----
  const onPrev = (e) => {
    if (!isCustomOpen()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!rows().length) return;
    playAt(cur < 0 ? rows().length - 1 : cur - 1);
  };
  const onNext = (e) => {
    if (!isCustomOpen()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!rows().length) return;
    playAt(cur + 1);
  };

  // Capture en phase "capture" pour bloquer l’écouteur d’app.js quand il faut
  btnPrev.addEventListener('click', onPrev, { capture: true });
  btnNext.addEventListener('click', onNext, { capture: true });

  // Flèches clavier (même logique que ton app)
  window.addEventListener('keydown', (e) => {
    if (!isCustomOpen()) return;
    if (e.key === 'ArrowLeft')  { onPrev(e); }
    if (e.key === 'ArrowRight') { onNext(e); }
  }, { capture: true });

  // Quand on ouvre la customList, on initialise l’état
  btnToggle.addEventListener('click', () => {
    setTimeout(resetIfNeeded, 0);
  });

  // Si l’addon re-rend la liste (favoris, filtre, etc.), on garde la synchro
  const patchRender = () => {
    const original = window.renderCustomList;
    if (typeof original !== 'function') return;
    window.renderCustomList = function patched() {
      const res = original.apply(this, arguments);
      // Après re-render : réappliquer un actif si besoin
      cur = Math.min(Math.max(cur, -1), rows().length - 1);
      if (rows().length) {
        if (cur < 0) cur = 0;
        clearActive();
        setActiveAt(cur); // auto-scroll s’applique aussi ici
      }
      return res;
    };
  };

  // Attends que custom-addon ait exposé renderCustomList
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    patchRender(); resetIfNeeded();
  } else {
    window.addEventListener('DOMContentLoaded', () => { patchRender(); resetIfNeeded(); });
  }
})();
