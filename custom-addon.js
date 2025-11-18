(function(){
  // Configuration initiale: à éditer par l'utilisateur
  window.CUSTOM_LIST = window.CUSTOM_LIST || [
    { title: "TF1",  logo: "/logos/tf1.png", type: "overlay", url: "https://vsalema.github.io/play/?https://raw.githubusercontent.com/mikekaprielian/rtnaodhor93n398/main/fr/videotf1.m3u8" },
    { title: "CMTV", logo: "https://cdn.brandfetch.io/idaBgpGjjj/w/446/h/223/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/player.php?stream=CMTVPT" },
    { title: "TVI",  logo: "https://upload.wikimedia.org/wikipedia/fr/6/63/TVI_logo_2017.png", type: "overlay", url: "https://vsalema.github.io/tvi2/" },
    { title: "TVIR", logo: "https://www.zupimages.net/up/24/14/xplw.jpg", type: "overlay", url: "https://vsalema.github.io/tvi-reality/" },
    { title: "TVIF", logo: "https://www.iol.pt/multimedia/oratvi/multimedia/imagem/id/616562540cf279ce41ddfe4f/", type: "overlay", url: "https://vsalema.github.io/tvi-ficcao/" },
    { title: "TVIA", logo: "https://raw.githubusercontent.com/imagesloads/images/refs/heads/main/img_5ba20c62b2143299.png", type: "overlay", url: "https://vsalema.github.io/tvi-africa/" },
    { title: "SIC",  logo: "https://www.zupimages.net/up/24/13/ax1g.jpg", type: "overlay", url: "https://vsalema.github.io/sic/" },
    { title: "CNN",  logo: "https://e1.pngegg.com/pngimages/206/434/png-clipart-logo-cnn-actualites-logo-de-nbc-medias-texte-rouge-ligne.png", type: "overlay", url: "https://vsalema.github.io/CNN/" },
    { title: "RTP1", logo: "https://media.rtp.pt/extra/wp-content/uploads/sites/22/2021/12/thumbnail_image010-860x507-1640950102.jpg", type: "overlay", url: "https://vsalema.github.io/play/?https://streaming-live.rtp.pt/liverepeater/smil:rtp1HD.smil/playlist.m3u8" },
    { title: "RTPN", logo: "https://raw.githubusercontent.com/imagesloads/images/refs/heads/main/img_378039629532c486.png", type: "overlay", url: "https://vsalema.github.io/play/?https://streaming-live.rtp.pt/livetvhlsDVR/rtpnHDdvr.smil/playlist.m3u8?DVR" },
    { title: "RTPI", logo: "https://www.atelevisao.com/wp-content/uploads/2012/03/RTP-Internacional-Nova-Imagem.jpg", type: "overlay", url: "https://vsalema.github.io/play/?https://streaming-live.rtp.pt/liverepeater/rtpi.smil/playlist.m3u8" },
    { title: "CANAL+",  logo: "https://1000logos.net/wp-content/uploads/2023/03/Canal-Logo-1984-768x432.png", type: "overlay", url: "//popcdn.day/go.php?stream=CANALPLFR" },
    { title: "CANAL+F", logo: "https://upload.wikimedia.org/wikipedia/fr/3/3b/C%2B_Foot.png", type: "overlay", url: "//popcdn.day/go.php?stream=FOOTPLUSFR" },
    { title: "RMC Sp",  logo: "https://raw.githubusercontent.com/imagesloads/images/refs/heads/main/img_ce1754f94a887510.png", type: "overlay", url: "https://popcdn.day/go.php?stream=RMCSPORT1FR" },
    { title: "BTV", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/BTV_Black.svg", type: "overlay", url: "//popcdn.day/go.php?stream=BTV1" },
    { title: "SCP", logo: "https://pplware.sapo.pt/wp-content/uploads/2017/06/scp_00.jpg", type: "overlay", url: "//popcdn.day/go.php?stream=SPT1" },
    { title: "11",  logo: "https://www.zupimages.net/up/24/13/qj99.jpg", type: "overlay", url: "https://popcdn.day/go.php?stream=Canal11" },
    { title: "BOLA", logo: "https://www.telesatellite.com/images/actu/a/abolatv.jpg", type: "overlay", url: "//popcdn.day/go.php?stream=ABOLA" },
    { title: "Sport tv 1",  logo: "https://cdn.brandfetch.io/idKvjRibkN/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/go.php?stream=SPT1" },
    { title: "Sport tv 2",  logo: "https://cdn.brandfetch.io/idKvjRibkN/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/go.php?stream=SPT2" },
    { title: "Sport tv 3",  logo: "https://cdn.brandfetch.io/idKvjRibkN/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/go.php?stream=SPT3" },
    { title: "Sport tv 4",  logo: "https://cdn.brandfetch.io/idKvjRibkN/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/go.php?stream=SPT4" },
    { title: "Sport tv 5",  logo: "https://cdn.brandfetch.io/idKvjRibkN/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", type: "overlay", url: "//popcdn.day/go.php?stream=SPT5" },
    { title: "DAZN 1 PT",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/DAZN_logo.svg", type: "overlay", url: "//popcdn.day/go.php?stream=ELEVEN1" },
    { title: "DAZN 2 PT",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/DAZN_logo.svg", type: "overlay", url: "//popcdn.day/go.php?stream=ELEVEN2" },
    { title: "DAZN 3 PT",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/DAZN_logo.svg", type: "overlay", url: "//popcdn.day/go.php?stream=ELEVEN3" },
    { title: "DAZN 4 PT",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/DAZN_logo.svg", type: "overlay", url: "//popcdn.day/go.php?stream=ELEVEN4" },
    { title: "DAZN 5 PT",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/DAZN_logo.svg", type: "overlay", url: "//popcdn.day/go.php?stream=ELEVEN5" },
    { title: "R.Alfa",  logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Radio_Alfa.png", type: "overlay", url: "https://vsalema.github.io/radio-alfa-5/" }
  ];
})();
  
(function(){

  function $(id){ return document.getElementById(id); }

  var btnToggle = $('btnToggleCustomList');
  var grp = $('customGroup');
  var list = $('customList');
  var cnt = $('customCount');
  var chan = $('channelList');

  if(!btnToggle || !grp || !list || !cnt || !chan){
    // Rien à faire si le DOM cible n'est pas là
    return;
  }

  function hasFn(name){ return typeof window[name] === 'function'; }

  // --- helpers a11y + perf pour chaque item (déclaré une seule fois) ---
  function enhanceCustomItem(itemEl){
    if (itemEl.dataset.enhanced === "1") return; // idempotent
    itemEl.dataset.enhanced = "1";

    // a11y + clavier
    itemEl.setAttribute("role", "listitem");
    itemEl.tabIndex = 0;
    itemEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        itemEl.click();
      }
    });

    // logos “light”
    var img = itemEl.querySelector("img");
    if (img) {
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
    }
  }

  function openOverlay(url){
    if(hasFn('showOverlay')){ window.showOverlay(url); return; }
    // fallback léger si showOverlay n'existe pas
    var iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'position:fixed;inset:5% 5% auto 5%;width:90%;height:80%;z-index:99999;background:#111;border:1px solid #333;border-radius:12px';
    var close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = 'position:fixed;top:6%;right:6%;z-index:100000';
    function cleanup(){ document.body.removeChild(iframe); document.body.removeChild(close); }
    close.onclick = cleanup;
    document.body.appendChild(iframe);
    document.body.appendChild(close);
  }

  function render(){
    // wrapper pour exposer au scope global
    window.renderCustomList = render;

    list.innerHTML = '';

    // rôle de liste posé UNE fois
    if (!list.hasAttribute("role")) list.setAttribute("role", "list");

    var data = Array.isArray(window.CUSTOM_LIST) ? window.CUSTOM_LIST : [];

    // Tri "Favoris en premier" (stable)
    try {
      var __idx = new Map();
      (data || []).forEach(function(it, i){ __idx.set(it, i); });
      data = (data || []).slice().sort(function(a,b){
        var af = (typeof isFav==='function' && a && isFav(a.url)) ? 1 : 0;
        var bf = (typeof isFav==='function' && b && isFav(b.url)) ? 1 : 0;
        if (af !== bf) return bf - af; // favoris en premier
        var ia = __idx.has(a) ? __idx.get(a) : 0;
        var ib = __idx.has(b) ? __idx.get(b) : 0;
        return ia - ib;
      });
    } catch(e){ /* no-op */ }

    cnt.textContent = String(data.length);
    if(!data.length){
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Aucune entrée dans la liste perso.';
      list.appendChild(empty);
      return;
    }

    data.forEach(function(item){
      // filtre favoris éventuel
      if (typeof favOnly !== "undefined" && favOnly) {
        try { if (!(typeof isFav==="function" && isFav(item.url))) return; } catch(e) {}
      }

      var row = document.createElement('div');
      row.className = 'custom-item';
      row.title = item.title || '';

      var img = document.createElement('img');
      img.className = 'logo';
      img.alt = '';
      img.src = item.logo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = item.title || '(Sans titre)';

      var badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = item.type === 'overlay' ? 'Overlay' : 'Média';

      row.appendChild(img);
      row.appendChild(name);
      row.appendChild(badge);

      // Nettoyage label badge (option UX)
      try {
        Array.from(badge.childNodes).forEach(function(n){
          if(n.nodeType===3){ badge.removeChild(n); }
        });
        if (badge.textContent && badge.textContent.trim() === 'Overlay') badge.textContent = '';
      } catch(e) {}

      // --- Bouton favori (identique à channelList) ---
      var fav = document.createElement('button');
      fav.type = 'button';
      fav.className = 'fav-btn';
      try {
        fav.setAttribute('aria-pressed', (typeof isFav==='function' && isFav(item.url)) ? 'true' : 'false');
      } catch(e) {
        fav.setAttribute('aria-pressed', 'false');
      }
      fav.textContent = fav.getAttribute('aria-pressed') === 'true' ? '★' : '☆';
      fav.title = 'Ajouter aux favoris';

      fav.addEventListener('click', function(ev){
        ev.stopPropagation();
        var pressed = fav.getAttribute('aria-pressed') !== 'true';
        fav.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        fav.textContent = pressed ? '★' : '☆';
        if (typeof toggleFav === 'function') {
          toggleFav(item.url, pressed);
        }
        // Si filtre favoris actif, on re-render pour masquer/afficher
        try {
          if (typeof favOnly !== 'undefined' && favOnly) {
            renderCustomList();
          }
        } catch(e){}
      });

      row.appendChild(fav);

             row.addEventListener('click', function () {
        // 1) Mettre à jour le titre + mini logo dans currentTitle
        if (typeof window.spxRenderChannelHeader === 'function') {
          window.spxRenderChannelHeader(
            item.title || '(Sans titre)',
            item.logo || null
          );
        }

        // 2) Comportement existant : overlay ou source
        if (item.type === 'overlay') {
          openOverlay(item.url);
        } else if (hasFn('loadSource')) {
          window.loadSource(item.url);
        }
      });
    

// ✅ applique le mini-patch ICI (après handlers, avant append)
      enhanceCustomItem(row);

      list.appendChild(row);
    });
  }

  var open = false;
  function setOpen(v){
    open = !!v;
    grp.style.display = open ? 'flex' : 'none';
    list.style.display = open ? 'flex' : 'none';
    chan.style.display = open ? 'none' : 'flex';
    btnToggle.setAttribute('aria-pressed', open ? 'true' : 'false');
  }

  btnToggle.addEventListener('click', function(){
    if(!open) render();
    setOpen(!open);
  });
  // === Bouton Radio : ouvrir l'entrée "R.Alfa" en overlay ===
  var btnRadio = $('btnradio');
  if (btnRadio) {
    btnRadio.addEventListener('click', function () {
      // On récupère l'entrée "R.Alfa" depuis CUSTOM_LIST
      var data = Array.isArray(window.CUSTOM_LIST) ? window.CUSTOM_LIST : [];
      var radioItem = data.find(function (it) {
        return it && it.title === "R.Alfa";
      });

      var url  = radioItem && radioItem.url  ? radioItem.url  : "https://vsalema.github.io/radio-alfa-5/";
      var logo = radioItem && radioItem.logo ? radioItem.logo : null;
      var title = radioItem && radioItem.title ? radioItem.title : "R.Alfa";

      // Met à jour le header central (titre + logo)
      if (typeof window.spxRenderChannelHeader === "function") {
        window.spxRenderChannelHeader(title, logo, "Radio");
      }

      // Ouvre l’overlay avec l’URL de R.Alfa
      openOverlay(url);
    });
  }
})();

// --- Force ouverture de channelList quand on clique un exemple du menu ---
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#examples button, #examples .item, #examples .example-btn");
  if (!btn) return;

  // Cacher customList si elle est affichée
  const customList = document.getElementById("customList");
  const customGroup = document.getElementById("customGroup");
  if (customList) {
    customList.style.display = "none";
  }
  if (customGroup) {
    customGroup.style.display = "none";
  }

  // Afficher channelList
  const channelList = document.getElementById("channelList");
  const totalGroup = document.querySelector(".group"); // le groupe principal
  if (channelList) {
    channelList.style.display = "flex";
  }
  if (totalGroup) {
    totalGroup.style.display = "flex";
  }

  // Optionnel : refermer le details pour une UX plus nette
  const details = document.getElementById("examplesDetails");
  if (details && details.open) {
    details.open = false;
  }
});

// Synchroniser avec le filtre "⭐ Favoris" global
try {
  var _btnFavOnly = document.getElementById('btnFavOnly');
  if (_btnFavOnly) {
    _btnFavOnly.addEventListener('click', function(){ 
      if (typeof renderCustomList === 'function') renderCustomList();
    });
  }
} catch(e) {}

// Re-render custom list when favorites set changes
try {
  window.addEventListener('favorites:changed', function(){
    if (typeof renderCustomList === 'function') renderCustomList();
  });
} catch(e) {}


function spxRenderChannelHeader(title, logoUrl, subtitle) {
  const container = document.getElementById('currentTitle');
  if (!container) return;

  // Valeurs par défaut
  const safeTitle = title || 'Aucune chaîne';
  const safeSubtitle = subtitle || 'En direct';

  // On vide le contenu actuel
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Wrapper principal
  const box = document.createElement('div');
  box.className = 'spx-split-box';

  // Zone gauche : logo
  const left = document.createElement('div');
  left.className = 'spx-split-left';

  if (logoUrl) {
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    left.appendChild(img);
  }

  // Zone droite : titre + sous-titre
  const right = document.createElement('div');
  right.className = 'spx-split-right';

  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = safeTitle;

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'subtitle';
  subtitleEl.textContent = safeSubtitle;

  right.appendChild(titleEl);
  right.appendChild(subtitleEl);

  box.appendChild(left);
  box.appendChild(right);

  container.appendChild(box);
}

// exposée globalement
window.spxRenderChannelHeader = spxRenderChannelHeader;
