
// favs-patch.js — non-breaking patch layer for favorites clearing
// Loads after app.js. It overrides only the "clear favorites" logic using safe interception.

(function(){
  'use strict';

  // --- Utilities ------------------------------------------------------------

  function uniq(arr){
    return Array.from(new Set((arr || []).filter(Boolean)));
  }

  // Gather channel URLs from the current ChannelList view (JS data first, DOM fallback)
  function getChannelUrls(){
    const urls = [];
    try {
      if (Array.isArray(window.channelsData) && window.channelsData.length){
        for (const c of window.channelsData){
          if (c && c.url) urls.push(c.url);
        }
      }
    } catch(e){ /* ignore */ }

    // DOM fallback: #channelList .item[data-url]
    try {
      if (!urls.length){
        const items = document.querySelectorAll('#channelList .item');
        items.forEach((el)=>{
          const u = (el && el.dataset) ? el.dataset.url : null;
          if (u) urls.push(u);
        });
      }
    } catch(e){ /* ignore */ }

    return uniq(urls);
  }

  // Gather URLs for the custom list (if exposed globally)
  function getCustomUrls(){
    try {
      if (Array.isArray(window.CUSTOM_LIST)){
        return uniq(window.CUSTOM_LIST.map(x => x && x.url));
      }
    } catch(e){ /* ignore */ }
    return [];
  }

  // Drop favorites strictly via the real favorites API from app.js
  function drop(urls){
    if (!Array.isArray(urls) || !urls.length) return 0;
    let count = 0;
    try {
      const hasIsFav = (typeof window.isFav === 'function');
      const hasToggleFav = (typeof window.toggleFav === 'function');

      if (!hasToggleFav){
        console.warn('[favs-patch] toggleFav() is not available. Abort.');
        return 0;
      }

      urls.forEach((u)=>{
        if (!u) return;
        // If isFav is available, check first; else try a best-effort removal
        const shouldRemove = hasIsFav ? window.isFav(u) : true;
        if (shouldRemove){
          window.toggleFav(u, false); // ensure remove semantics
          count++;
        }
      });

      // Notify UI that favorites changed
      try {
        window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { perList: true } }));
      } catch(e){ /* ignore */ }

    } catch(e){
      console.error('[favs-patch] drop error:', e);
    }
    return count;
  }

  // Expose for debugging if needed
  window._favsPatch = {
    getChannelUrls,
    getCustomUrls,
    drop
  };

  // --- Intercept buttons safely --------------------------------------------
  function installHandlers(){
    // ChannelList clear button
    const btnChannels = document.getElementById('btnClearFavsChannels');
    if (btnChannels){
      // Capture-phase listener; stop other handlers to avoid conflicting logic
      btnChannels.addEventListener('click', function onClearChannels(e){
        try {
          e.preventDefault();
          // Stop any other listener bound after app.js to avoid double toggling
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

          const urls = getChannelUrls();
          const removed = drop(urls);
          console.log(`[favs-patch] Cleared favorites for ChannelList: ${removed} item(s).`);
        } catch(err){
          console.error('[favs-patch] onClearChannels error:', err);
        }
      }, true);
    }

    // CustomList clear button (optional: keep behavior consistent)
    const btnCustom = document.getElementById('btnClearFavsCustom');
    if (btnCustom){
      btnCustom.addEventListener('click', function onClearCustom(e){
        try {
          e.preventDefault();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

          const urls = getCustomUrls();
          const removed = drop(urls);
          console.log(`[favs-patch] Cleared favorites for CustomList: ${removed} item(s).`);
        } catch(err){
          console.error('[favs-patch] onClearCustom error:', err);
        }
      }, true);
    }
  }

  // Wait for DOM ready (and after app.js has defined its API)
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installHandlers);
  } else {
    // Already parsed
    installHandlers();
  }
})();
