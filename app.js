// (old per-list clearing removed)
/* Extracted from inline <script> */

function isYouTubeUrl(url){return /^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)}
function addYtAutoplayParams(url){const hasQuery=url.includes('?');const sep=hasQuery?'&':'?';return url+sep+'autoplay=1&playsinline=1'}
function inferType(url){const u=url.split('?')[0].toLowerCase();if(u.endsWith('.m3u8'))return'application/x-mpegURL';if(u.endsWith('.mpd'))return'application/dash+xml';if(u.endsWith('.mp4'))return'video/mp4';if(u.endsWith('.mp3'))return'audio/mpeg';if(isYouTubeUrl(url))return'video/youtube';if(u.endsWith('.m3u'))return'audio/x-mpegurl';return''}
async function fetchText(url){const res=await fetch(url);if(!res.ok)throw new Error('Échec de chargement : '+res.status);return res.text();}
function parseM3UExtended(text,baseUrl){
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(!lines[0]||!lines[0].startsWith('#EXTM3U'))return[];
  const channels=[];
  for(let i=0;i<lines.length;i++){
    if(lines[i].startsWith('#EXTINF')){
      const info=lines[i];
      let name=(info.split(',').slice(1).join(',')||'').trim();
      const attrs={}; const attrRegex=/([a-zA-Z0-9\-]+)="([^"]*)"/g; let m;
      while((m=attrRegex.exec(info))!==null)attrs[m[1]]=m[2];
      const logo=attrs['tvg-logo']||attrs['logo']||'';
      const group=attrs['group-title']||'';
      const tvgName=attrs['tvg-name']||'';
      if(tvgName&&!name)name=tvgName;
      const media=lines[i+1]&& !lines[i+1].startsWith('#')?lines[i+1]:null;
      if(!media)continue;
      let url=media; try{url=new URL(media,baseUrl).toString()}catch{}
      channels.push({name:name||'Sans titre',url,logo,group});
    }
  }
  return channels;
}

const player=videojs('player',{autoplay:true,muted:true,controls:true,preload:'auto',fluid:true,responsive:true,html5:{vhs:{enableLowInitialPlaylist:true,useDevicePixelRatio:true}},techOrder:['html5','youtube']});
if(player.maxQualitySelector){player.maxQualitySelector({persist:true});}else{console.warn('Plugin videojs-max-quality-selector non détecté.');}

function pauseAllPlayers(){
  try { player.pause(); } catch {}
  document.querySelectorAll('video, audio').forEach(el=>{ try { if(!el.paused && !el.ended) el.pause(); } catch {} });
  if (document.pictureInPictureElement) { try { document.exitPictureInPicture(); } catch {} }
  document.querySelectorAll('iframe').forEach(iframe=>{
    const src=(iframe.src||'').toLowerCase();
    try{
      if(src.includes('youtube.com') || src.includes('youtu.be')){
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}','*');
      }
      if(src.includes('player.vimeo.com')){
        iframe.contentWindow.postMessage({method:'pause'}, '*');
      }
    }catch{}
  });
}

function ensureOverlay(){
  const el = player && player.el && player.el();
  if(!el) return null;
  let layer = el.querySelector('#playerOverlayLayer');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'playerOverlayLayer';
    layer.innerHTML = `
      <iframe id="playerOverlayFrame" title="Overlay" referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
      <button id="playerOverlayClose" type="button" title="Fermer l’overlay" style="visibility: hidden;">✕ Fermer</button>
    `;

    el.appendChild(layer);
    layer.querySelector('#playerOverlayClose').addEventListener('click', hideOverlay);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideOverlay(); });
  }
  return layer;
}
function showOverlay(url){
  pauseAllPlayers();
  const layer = ensureOverlay(); if(!layer) return;
  const frame = layer.querySelector('#playerOverlayFrame');
  frame.removeAttribute('src');
  frame.src = url;
  layer.hidden = false;
  layer.style.display = 'block';
}
function hideOverlay(){
  const layer = ensureOverlay(); if(!layer) return;
  const frame = layer.querySelector('#playerOverlayFrame');
  layer.hidden = true;
  layer.style.display = 'none';
  frame.removeAttribute('src');
}
window.overlay = { open: showOverlay, close: hideOverlay, toggle:(url)=>{
  const layer = ensureOverlay();
  const isOpen = layer && layer.style.display === 'block';
  if(isOpen) hideOverlay(); else if(url) showOverlay(url);
}};
player.on('loadstart', hideOverlay);

const input=document.getElementById('srcInput');
const btn=document.getElementById('btnLoad');
const m3uInput=document.getElementById('m3uInput');
const btnLoadM3U=document.getElementById('btnLoadM3U');
const channelList=document.getElementById('channelList');
const asideEl=document.getElementById('playlistAside');
const controlBar=document.getElementById('controlBar');
const currentTitle=document.getElementById('currentTitle');
const btnPrev=document.getElementById('btnPrev');
const btnNext=document.getElementById('btnNext');
const btnFavOnly=document.getElementById('btnFavOnly');
const searchInput=document.getElementById('channelSearch');
const clearSearch=document.getElementById('clearSearch');
const sortSelect=document.getElementById('sortMode');
const btnCheckLinks=document.getElementById('btnCheckLinks');
const verifySummary=document.getElementById('verifySummary');
const okCountEl=document.getElementById('okCount');
const badCountEl=document.getElementById('badCount');
const unkCountEl=document.getElementById('unkCount');
const btnCancelVerify=document.getElementById('btnCancelVerify');
const btnClearStatus=document.getElementById('btnClearStatus');
const totalCountEl=document.getElementById('totalCount');

const btnQuality = document.getElementById('btnQuality');
const qualityMenu = document.getElementById('qualityMenu');
const btnAudio = document.getElementById('btnAudio');
const audioMenu = document.getElementById('audioMenu');
const btnCC = document.getElementById('btnCC');
const ccMenu = document.getElementById('ccMenu');
const btnPiP = document.getElementById('btnPiP');
const btnFS  = document.getElementById('btnFS');

const layoutRoot = document.getElementById('layoutRoot');
const btnHamburger = document.getElementById('btnHamburger');
const asideBackdrop = document.getElementById('asideBackdrop');

let channelsData=[]; let currentIndex=-1; let favOnly=false; let searchTerm=''; let sortMode='original';
const FAV_KEY='m3u_fav_v1'; const FAV_ORDER_KEY='m3u_fav_order_v1';

let openState = {}; const getOpen = (g) => openState[g] !== undefined ? openState[g] : true; const setOpen = (g, v) => { openState[g]=!!v; };

function loadFavs(){ try{ return new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]')); }catch{ return new Set(); } }
function saveFavs(set){ localStorage.setItem(FAV_KEY, JSON.stringify([...set])); }
let favSet=loadFavs();
function isFav(url){ return favSet.has(url); }
function toggleFav(url, pressed){ if(pressed){ favSet.add(url); } else { favSet.delete(url); removeFromFavOrder(url); } saveFavs(favSet); if(favOnly) rebuildFromCurrent(); }

function loadFavOrder(){ try{ return JSON.parse(localStorage.getItem(FAV_ORDER_KEY)||'[]'); }catch{ return []; } }
function saveFavOrder(arr){ localStorage.setItem(FAV_ORDER_KEY, JSON.stringify(arr)); }
function ensureFavOrderIncludes(urls){ const order = loadFavOrder(); let changed=false; urls.forEach(u=>{ if(!order.includes(u)){ order.push(u); changed=true; } }); if(changed) saveFavOrder(order); return order; }
function removeFromFavOrder(url){ const order = loadFavOrder().filter(u=>u!==url); saveFavOrder(order); }
function orderFavs(favs){ const order = ensureFavOrderIncludes(favs.map(f=>f.url)); const mapIndex = new Map(order.map((u,i)=>[u,i])); return favs.slice().sort((a,b)=> (mapIndex.get(a.url)??1e9) - (mapIndex.get(b.url)??1e9)); }

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file=e.target.files[0]; if (!file) return;
  const text=await file.text(); const channels=parseM3UExtended(text, file.name);
  if (!channels.length) return alert('Fichier M3U invalide ou vide');
  populateChannels(channels); playChannelAt(0);
});

/* --- Hamburger / Aside overlay (mobile) --------------------------- */
function openAsideMobile(){
  layoutRoot.classList.add('aside-open');
  btnHamburger.setAttribute('aria-expanded','true');
}
function closeAsideMobile(){
  layoutRoot.classList.remove('aside-open');
  btnHamburger.setAttribute('aria-expanded','false');
}
function toggleAsideMobile(){
  if(layoutRoot.classList.contains('aside-open')) closeAsideMobile(); else openAsideMobile();
}
btnHamburger.addEventListener('click', toggleAsideMobile);
asideBackdrop.addEventListener('click', closeAsideMobile);
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAsideMobile(); });
window.addEventListener('orientationchange', closeAsideMobile);

function fitAsideHeight(){
  if(!asideEl||!controlBar) return;
  if (window.matchMedia('(max-width: 960px)').matches){
    asideEl.style.maxHeight = '';
    channelList.style.maxHeight = '';
    return;
  }
  const asideTop=asideEl.getBoundingClientRect().top+window.scrollY;
  const barBottom=controlBar.getBoundingClientRect().bottom+window.scrollY;
  const max=Math.max(200, Math.floor(barBottom-asideTop));
  asideEl.style.maxHeight=max+'px';
  const headerHeight=
    asideEl.querySelector('.brand').offsetHeight +
    asideEl.querySelector('.aside-row').offsetHeight +
    asideEl.querySelector('.group').offsetHeight + 24;
  channelList.style.maxHeight=Math.max(80, max-headerHeight)+'px';
}

const ro=new ResizeObserver(fitAsideHeight); ro.observe(document.body);
['load','resize','orientationchange'].forEach(ev=>window.addEventListener(ev, fitAsideHeight));
document.addEventListener('DOMContentLoaded', fitAsideHeight);

async function loadSource(url){
  if(!url) return;
  let src=url.trim();
  const guess=inferType(src);
  if(guess==='audio/x-mpegurl'||src.toLowerCase().endsWith('.m3u8')){
    try{
      const text=await fetchText(src);
      if(text.startsWith('#EXTM3U')&&/#EXTINF/i.test(text)){
        populateChannels(parseM3UExtended(text, src));
        playChannelAt(0); fitAsideHeight(); return;
      }
    }catch(e){ console.warn('Analyse M3U étendue échouée, tentative lecture directe.', e); }
  }
  const type=isYouTubeUrl(src)?'video/youtube':inferType(src);
  if(!type) return alert('Type non détecté.');
  player.pause(); player.src({src:isYouTubeUrl(src)?addYtAutoplayParams(src):src, type});
  player.ready(()=>{ player.play().catch(()=>{}); });
  currentTitle.textContent=isYouTubeUrl(src)?'YouTube':src.split('/').pop();
}

let lastChannels = [];
function populateChannels(channels){
  lastChannels = channels.slice();
  if (totalCountEl) totalCountEl.textContent = String(channels.length);
  rebuildFromCurrent();
}

function captureOpenState(){ channelList.querySelectorAll('details.group-panel[data-group]').forEach(d => setOpen(d.dataset.group, d.open)); }
function sortChannels(list){
  const collator = new Intl.Collator('fr', { sensitivity:'base', numeric:true });
  if(sortMode==='name')  return list.slice().sort((a,b)=>collator.compare(a.name||'', b.name||''));
  if(sortMode==='group') return list.slice().sort((a,b)=>{ const g=collator.compare(a.group||'', b.group||''); return g!==0?g:collator.compare(a.name||'', b.name||''); });
  return list.slice();
}

function rebuildFromCurrent(){
  captureOpenState();
  const base = favOnly ? lastChannels.filter(c=>isFav(c.url)) : lastChannels.slice();
  const q = (searchTerm||'').trim().toLowerCase();
  const filtered = q ? base.filter(c => (c.name||'').toLowerCase().includes(q) || (c.group||'').toLowerCase().includes(q)) : base;
  const sorted = sortChannels(filtered);

  channelList.innerHTML='';

  if(!favOnly && !q){
    let favs = lastChannels.filter(c=>isFav(c.url));
    if(favs.length){
      favs = orderFavs(favs);
      const df = document.createElement('details');
      df.className='group-panel'; df.dataset.group = '⭐ Favoris'; df.open = getOpen('⭐ Favoris');
      const sum = document.createElement('summary'); sum.className='summary';
      sum.innerHTML = `<span class="caret">▶</span><span>⭐ Favoris</span><span class="count">${favs.length}</span>`;
      df.appendChild(sum);
      const box = document.createElement('div');
      favs.forEach(ch => box.appendChild(buildRow(ch)));
      df.appendChild(box);
      df.addEventListener('toggle', ()=> setOpen('⭐ Favoris', df.open));
      channelList.appendChild(df);
      enableFavReorder(box);
    }
  }

  const groups=new Map();
  sorted.forEach(c=>{ const g=c.group||'Général'; if(!groups.has(g)) groups.set(g,[]); groups.get(g).push(c); });
  const flat=[];
  for(const [groupName, items] of groups){
    const d = document.createElement('details');
    d.className='group-panel'; d.dataset.group = groupName; d.open = getOpen(groupName);
    const s = document.createElement('summary');
    s.className='summary';
    s.innerHTML = `<span class="caret">▶</span><span>${groupName}</span><span class="count">${items.length}</span>`;
    d.appendChild(s);
    const box = document.createElement('div');
    items.forEach(ch => { flat.push(ch); box.appendChild(buildRow(ch)); });
    d.appendChild(box);
    d.addEventListener('toggle', ()=> setOpen(groupName, d.open));
    channelList.appendChild(d);
  }

  channelsData = flat; currentIndex = -1;

  if(!channelList.children.length){
    const empty=document.createElement('div'); empty.className='empty'; empty.textContent='Aucun résultat.'; channelList.appendChild(empty);
  }
  fitAsideHeight();
}

function buildRow(ch){
  const row=document.createElement('div'); row.className='item'; row.title=ch.name; row.dataset.url = ch.url;
  const now=document.createElement('span'); now.className='now'; now.textContent='▶';
  const img=document.createElement('img'); img.className='logo'; img.alt=''; img.loading='lazy'; img.referrerPolicy='no-referrer';
  img.src=ch.logo||'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="100%" height="100%" fill="%230b132b"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%235a6aa8" font-size="12" font-family="Arial">TV</text></svg>';
  const name=document.createElement('div'); name.className='name'; name.textContent=ch.name;

  const status=document.createElement('div'); status.className='status'; status.innerHTML='<span class="dot unk"></span><span class="label">—</span>';
  const badge=document.createElement('div'); badge.className='badge'; badge.textContent=ch.group||'';
  const fav=document.createElement('button'); fav.type='button'; fav.className='fav-btn'; fav.setAttribute('aria-pressed', isFav(ch.url) ? 'true' : 'false');
  fav.textContent = fav.getAttribute('aria-pressed')==='true' ? '★' : '☆';
  fav.title = 'Ajouter aux favoris';
  fav.addEventListener('click', (e)=>{
    e.stopPropagation();
    const pressed = fav.getAttribute('aria-pressed')!=='true';
    fav.setAttribute('aria-pressed', pressed?'true':'false');
    fav.textContent = pressed ? '★' : '☆';
    toggleFav(ch.url, pressed);
  });

  row.append(img, name, now, status, badge, fav);

  row.addEventListener('click', ()=>{
    const idx = channelsData.findIndex(x=>x.url===ch.url && x.name===ch.name);
    playChannelAt( idx>=0 ? idx : 0 );
    closeAsideMobile();
  });

  row.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); openContextMenu(ev.clientX, ev.clientY, ch, row); });
  attachLongPress(row, (point)=> openContextMenu(point.x, point.y, ch, row));

  return row;
}

function playChannelAt(i){
  if(!channelsData.length) return;
  const len=channelsData.length; const idx=((i%len)+len)%len; const ch=channelsData[idx];

  channelList.querySelectorAll('.item.active').forEach(n=>{ n.classList.remove('active'); n.removeAttribute('aria-current'); });
  const match=[...channelList.querySelectorAll('.item')].find(el=> el.dataset.url===ch.url );
  if(match){ match.classList.add('active'); match.setAttribute('aria-current','true'); }

  const isYT=isYouTubeUrl(ch.url);
  const type=isYT?'video/youtube':(inferType(ch.url)||'application/x-mpegURL');
  const srcFinal=isYT?addYtAutoplayParams(ch.url):ch.url;

  player.pause();
  player.src({ src: srcFinal, type });
  try{ player.muted(true); }catch{}
  player.ready(()=>{ player.play().catch(()=>{}); });

  currentTitle.textContent=ch.name||'Chaîne';
  setTimeout(()=>{ try{ player.muted(false); const v=player.el().querySelector('video'); if(v) v.muted=false; }catch{} },300);

  currentIndex=idx;

  player.one('loadedmetadata', ()=>{
    setupQualityUI();
    buildAudioMenu();
    buildCCMenu();
    reflectPiPState();
  });
}

function nextChannel(){ if(channelsData.length) playChannelAt((currentIndex+1)%channelsData.length); }
function prevChannel(){ if(channelsData.length) playChannelAt((currentIndex-1+channelsData.length)%channelsData.length); }
btnNext.addEventListener('click', nextChannel);
btnPrev.addEventListener('click', prevChannel);

window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowRight'){e.preventDefault();nextChannel();} if(e.key==='ArrowLeft'){e.preventDefault();prevChannel();} });

btn.addEventListener('click', ()=> { 
  loadSource(input.value);
  const det = document.getElementById('examplesDetails'); if(det) det.open = false;
  player.one('loadedmetadata', ()=>{
    setupQualityUI(); buildAudioMenu(); buildCCMenu(); reflectPiPState();
  });
});
btnLoadM3U.addEventListener('click', ()=> loadPlaylist(m3uInput.value));

async function loadPlaylist(url){
  if(!url) return;
  try{
    const text=await fetchText(url);
    if(!text.startsWith('#EXTM3U')) throw new Error('Playlist M3U invalide ou non étendue.');
    const channels=parseM3UExtended(text, url);
    if(!channels.length) throw new Error('Aucune entrée #EXTINF détectée.');
    populateChannels(channels); playChannelAt(0); fitAsideHeight();
  }catch(e){ alert(e.message); }
}

btnFavOnly.addEventListener('click', ()=>{ favOnly = !favOnly; btnFavOnly.classList.toggle('active', favOnly); rebuildFromCurrent(); });
searchInput.addEventListener('input', (e)=>{ searchTerm = e.target.value || ''; rebuildFromCurrent(); });
clearSearch.addEventListener('click', ()=>{ searchTerm = ''; searchInput.value = ''; rebuildFromCurrent(); searchInput.focus(); });
sortSelect.addEventListener('change', (e)=>{ sortMode = e.target.value || 'original'; rebuildFromCurrent(); });

const samples = [
  { label: 'Film', url: 'https://vsalema.github.io/tvpt4/css/playlist_par_genre.m3u' },
  { label: 'France tv🇫🇷', url: 'https://vsalema.github.io/tvpt4/css/TVradioZap-TV-Europe+_s_2024-12-27.m3u' },
  { label: 'World/Channels', url: 'https://vsalema.github.io/tvpt4/css/world-m3u.m3u' },
  { label: 'Youtube-Music', url: 'https://www.youtube.com/watch?v=1MieSL5ZA90' },
  { label: 'MP3', url: 'https://vsalema.github.io/MP3/playlist.m3u8', cover: 'https://image.tmdb.org/t/p/original/sSkhWrgE497L4PYpmPGXwYHulMa.jpg' },
  { label: 'Disco/Music', url: 'https://cdnapisec.kaltura.com/p/3253003/sp/325300300/playManifest/entryId/1_n6qy7o0p/flavorIds/1_che6zx2l,1_ykrrgdcr,1_16iv2dgv,1_3i7zbypc,1_cssv5q02,1_fq1zn4dk,1_wik14twv/format/applehttp/protocol/https/a.m3u8' },
  { label: 'Tony Carreira', url: 'https://vsalema.github.io/tvpt4/css/tony_carreira_best_succes.m3u' },
  { label: 'Overlay', html: '<button id="btnOverlay" type="button" title="Ouvrir un overlay">Overlay</button>' }
];

// === Catégorisation + overlay logo pour #channelList ===
(function initCategoryLogo(){
  const channelList = document.getElementById('channelList');

  function ensureStyles(){
    if (document.getElementById('categoryLogoStyles')) return;
    const css = `
    .playerWrap{position:relative}
    #categoryLogo{position:absolute;top:10px;left:10px;width:64px;height:64px;object-fit:contain;border-radius:12px;padding:6px;background:#0f1630cc;border:1px solid #2a2f45;box-shadow:0 4px 14px rgba(0,0,0,.35)}
    @media (max-width:720px){#categoryLogo{width:48px;height:48px}}`;
    const s = document.createElement('style');
    s.id = 'categoryLogoStyles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function ensureOverlay(){
    const player = document.getElementById('player');
    if (!player) return null;
    ensureStyles();
    if (!player.parentElement.classList.contains('playerWrap')){
      const wrap = document.createElement('div');
      wrap.className = 'playerWrap';
      player.parentElement.insertBefore(wrap, player);
      wrap.appendChild(player);
    }
    let img = document.getElementById('categoryLogo');
    if (!img){
      img = document.createElement('img');
      img.id = 'categoryLogo';
      img.alt = '';
      img.hidden = true;
      player.parentElement.appendChild(img);
    }
    return img;
  }

  const CATEGORY_LOGOS = window.CATEGORY_LOGOS || {
    "MP3":   "https://m.media-amazon.com/images/I/71OGmfmMMfL.png",
    "Radio": "",
    "Pod":   ""
  };
  const DEFAULT_LOGO = window.DEFAULT_CATEGORY_LOGO || "";

  function setCategoryLogo(category){
    const img = ensureOverlay();
    if (!img) return;
    const url = (category && CATEGORY_LOGOS[category]) || DEFAULT_LOGO || "";
    if (url){
      if (img.src !== url) img.src = url;
      img.alt = category || 'catégorie';
      img.hidden = false;
    } else {
      img.hidden = true;
    }
  }
  window.setCategoryLogo = setCategoryLogo;

  function setChannelCategory(category){
    if (channelList && category) channelList.dataset.category = category;
    setCategoryLogo(channelList?.dataset?.category || null);
  }
  window.setChannelCategory = setChannelCategory;

  function inferCategoryFromLabelUrl(label, url){
    if (label && /mp3/i.test(label)) return 'MP3';
    if (label && /radio/i.test(label)) return 'Radio';
    if (url && /\.(m3u8|m3u|pls)(\?|#|$)/i.test(url)) return 'Radio';
    if (url && /\.(mp3|aac|m4a|flac|ogg)(\?|#|$)/i.test(url)) return 'MP3';
    return null;
  }
  window.inferCategoryFromLabelUrl = inferCategoryFromLabelUrl;

  window.addEventListener('playlist:loaded', (e)=>{
    const cat = e?.detail?.category || channelList?.dataset?.category || null;
    setChannelCategory(cat);
  });
})();
const ex = document.getElementById('examples');

samples.forEach(s => {
  if (s.html) {
    ex.insertAdjacentHTML('beforeend', s.html);
  } else {
    const a = document.createElement('button');
    a.type = 'button';
    a.textContent = s.label;
    a.style.background = '#263572';
    a.style.padding = '8px 10px';
    a.style.borderRadius = '10px';
    a.style.fontSize = '12px';
    a.style.margin = '5px';
    a.addEventListener('click', () => {
      const cat = s.category || (window.inferCategoryFromLabelUrl && inferCategoryFromLabelUrl(s.label, s.url));
      if (cat && window.setChannelCategory) setChannelCategory(cat);
      input.value = s.url;
      btn.click();
    });
    ex.appendChild(a);
  }
});

const overlayLinks = [
  { label: 'TESTE',  url: 'https://vsalema.github.io/play/?https://clouding.wideiptv.top/CMTVPT/index.fmp4.m3u8?token=806e693478d9825ebcbe7e02c63b0118adab4f31-73bc83493a9f2ce2f1b9ee940043bc26-1763164955-1763154155
  ' },
  { label: 'TVPT4',  url: 'https://vsalema.github.io/tvpt4/' },
  { label: 'Tous-les-film',url: 'https://vsalema.github.io/Tous-les-film/' },
  { label: 'Ancien-Film',url: 'https://vsalema.github.io/Ancien-Film/' },
  { label: 'Superhero',url: 'https://vsalema.github.io/Superhero/' },
  { label: 'Studio-ghibli',url: 'https://vsalema.github.io/Studio-ghibli/' },
  { label: 'Dreamworks',url: 'https://vsalema.github.io/Dreamworks/' },
  { label: 'Disney-pixar',   url: 'https://vsalema.github.io/Disney-pixar/' }
];

const overlayTitles = {
    "Disney-pixar": "Disney & Pixar – Films et Animations",
    "Dreamworks": "DreamWorks Animation – Films et séries",
    "Studio-ghibli": "Studio Ghibli – Collection complète",
    "Superhero": "Films de super-héros",
    "Ancien-Film": "Films classiques et rétro",
    "Tous-les-film": "Collection générale",
    "TVPT4": "Plateforme TVPT4"
};


(function addOverlayButtons(){
  const ex = document.getElementById('examples');
  if (!ex) return;
  overlayLinks.forEach(({label, url}) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.title = overlayTitles[label] || label;
    btn.style.backgroundColor = '#263572';
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '10px';
    btn.style.fontSize = '12px';
    btn.style.margin = '5px';

if (label === 'Disney-pixar') {
    btn.classList.add('btn-popout', 'btn-disney-pixar', 'no-text');
}    

if (label === 'Dreamworks') {
    btn.classList.add('btn-popout', 'btn-dreamworks', 'no-text');
} 

if (label === 'Studio-ghibli') {
    btn.classList.add('btn-popout', 'btn-ghibli', 'no-text');
} 
if (label === 'Superhero') {
  btn.classList.add('btn-popout', 'btn-superhero', 'no-text');
  btn.title = "Superhero – Films de super-héros";
}

if (label === 'Superhero') {
  btn.classList.add('btn-popout', 'btn-superhero', 'no-text');
  btn.title = "Superhero – Films de super-héros";
}

if (label === 'Ancien-Film') {
    btn.classList.add('btn-popout', 'btn-Ancien-Film', 'no-text');
}
if (label === 'Tous-les-film') {
    btn.classList.add('btn-popout', 'btn-Tous-les-film', 'no-text');
}


     btn.addEventListener('click', () => {
      pauseAllPlayers();
      overlay.open(url);
      const det = document.getElementById('examplesDetails');
      if (det) det.open = false;
    });
    ex.appendChild(btn);
  });
})();

const overlayBtn = document.getElementById('btnOverlay');
if (overlayBtn){
  overlayBtn.style.background = '#263572';
  overlayBtn.style.padding = '8px 10px';
  overlayBtn.style.borderRadius = '10px';
  overlayBtn.style.fontSize = '12px';
  overlayBtn.style.margin = '5px';
}
document.getElementById('examples').addEventListener('click', (e)=>{
  const btnOv = e.target.closest('#btnOverlay');
  if (!btnOv) return;
  const url = prompt('URL à ouvrir dans l’overlay', 'https://vsalema.github.io/MP3/');
  if (url) { pauseAllPlayers(); overlay.open(url); }
});

const btnExpandAside = document.getElementById('btnExpandAside');
const btnExpandFull  = document.getElementById('btnExpandFull');

if (btnExpandAside){
  btnExpandAside.addEventListener('click', ()=>{
    const on = layoutRoot.classList.toggle('fullpage');
    btnExpandAside.setAttribute('aria-pressed', on ? 'true' : 'false');
    closeAsideMobile();
  });
}

function enterFullscreen(el){
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}
function exitFullscreen(){
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}

if (btnExpandFull){
  btnExpandFull.addEventListener('click', async ()=>{
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    try{
      if (isFs){
        await exitFullscreen();
        btnExpandFull.setAttribute('aria-pressed','false');
      }else{
        await enterFullscreen(document.documentElement);
        btnExpandFull.setAttribute('aria-pressed','true');
      }
    }catch(e){ console.warn('Fullscreen error:', e); }
  });
}

['fullscreenchange','webkitfullscreenchange','msfullscreenchange'].forEach(ev=>{
  document.addEventListener(ev, ()=>{
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    if (btnExpandFull) btnExpandFull.setAttribute('aria-pressed', isFs ? 'true' : 'false');
  });
});

const ctx = document.getElementById('ctxMenu');
const ctxFavLabel = ctx.querySelector('.ctx-label-fav');
let ctxTargetChannel = null, ctxTargetRow = null;
function openContextMenu(x, y, ch, row){
  ctxTargetChannel = ch; ctxTargetRow = row;
  ctxFavLabel.textContent = isFav(ch.url) ? 'Retirer des favoris' : 'Ajouter aux favoris';
  const pad = 6; ctx.style.left='0px'; ctx.style.top='0px';
  ctx.classList.add('open'); ctx.setAttribute('aria-hidden','false');
  const r = ctx.getBoundingClientRect(); let posX=x, posY=y;
  const vw = innerWidth, vh = innerHeight;
  if(posX + r.width + pad > vw) posX = vw - r.width - pad;
  if(posY + r.height + pad > vh) posY = vh - r.height - pad;
  ctx.style.left = posX+'px'; ctx.style.top = posY+'px';
  const first = ctx.querySelector('.ctx-item'); if(first) first.focus();
  document.addEventListener('click', onGlobalClick);
  document.addEventListener('keydown', onGlobalKey);
  channelList.addEventListener('scroll', closeContextMenu, { once:true });
}
function closeContextMenu(){ ctx.classList.remove('open'); ctx.setAttribute('aria-hidden','true'); document.removeEventListener('click', onGlobalClick); document.removeEventListener('keydown', onGlobalKey); ctxTargetChannel = null; ctxTargetRow = null; }
function onGlobalClick(e){ if(!ctx.contains(e.target)) closeContextMenu(); }
function onGlobalKey(e){ if(e.key === 'Escape'){ e.preventDefault(); closeContextMenu(); } }
ctx.addEventListener('click', async (e)=>{
  const item = e.target.closest('.ctx-item'); if(!item || !ctxTargetChannel) return;
  const action = item.dataset.action;
  if(action === 'copy'){
    try{ await navigator.clipboard.writeText(ctxTargetChannel.url); }
    catch{ const ta=document.createElement('textarea'); ta.value=ctxTargetChannel.url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  } else if(action === 'fav'){
    const willAdd = !isFav(ctxTargetChannel.url);
    toggleFav(ctxTargetChannel.url, willAdd);
    const btn = ctxTargetRow?.querySelector('.fav-btn');
    if(btn){ btn.setAttribute('aria-pressed', willAdd ? 'true' : 'false'); btn.textContent = willAdd ? '★' : '☆'; }
    rebuildFromCurrent();
  } else if(action === 'newtab'){
    window.open(ctxTargetChannel.url, '_blank', 'noopener');
  }
  closeContextMenu();
});
const LONG_PRESS_MS = 500;
function attachLongPress(el, onLongPress){
  let timer=null, start={x:0,y:0};
  const cancel=()=>{ if(timer){ clearTimeout(timer); timer=null; } };
  el.addEventListener('touchstart', (ev)=>{
    if(ev.touches.length!==1) return;
    const t=ev.touches[0]; start={x:t.clientX,y:t.clientY};
    cancel(); timer=setTimeout(()=>{ onLongPress(start); timer=null; }, LONG_PRESS_MS);
  }, {passive:true});
  el.addEventListener('touchend', cancel, {passive:true});
  el.addEventListener('touchcancel', cancel, {passive:true});
  el.addEventListener('touchmove', (ev)=>{
    if(!timer) return; const t=ev.touches[0];
    if(Math.abs(t.clientX-start.x)>10 || Math.abs(t.clientY-start.y)>10) cancel();
  }, {passive:true});
}
function enableFavReorder(container){
  const items = [...container.querySelectorAll('.item')];
  items.forEach(it=>{
    it.setAttribute('draggable','true');
    it.addEventListener('dragstart', onDragStart);
    it.addEventListener('dragover', onDragOver);
    it.addEventListener('dragleave', onDragLeave);
    it.addEventListener('drop', onDrop);
    it.addEventListener('dragend', onDragEnd);
  });
}
let dragSrcUrl = null;
function onDragStart(e){ this.classList.add('dragging'); dragSrcUrl=this.dataset.url||null; if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; } }
function onDragOver(e){ e.preventDefault(); if(!dragSrcUrl) return; this.classList.add('drag-over'); if(e.dataTransfer) e.dataTransfer.dropEffect='move'; }
function onDragLeave(){ this.classList.remove('drag-over'); }
function onDrop(e){
  e.preventDefault(); this.classList.remove('drag-over');
  const targetUrl = this.dataset.url||null; if(!dragSrcUrl||!targetUrl||dragSrcUrl===targetUrl) return;
  const order = loadFavOrder(); const srcIdx = order.indexOf(dragSrcUrl); const dstIdx = order.indexOf(targetUrl);
  if(srcIdx===-1||dstIdx===-1) return;
  order.splice(dstIdx, 0, order.splice(srcIdx,1)[0]); saveFavOrder(order); rebuildFromCurrent();
}
function onDragEnd(){ this.classList.remove('dragging'); dragSrcUrl=null; }

const STATUS_MAP = new Map(); let verifyAbort = null;
function setRowStatus(url, state, reason){
  STATUS_MAP.set(url, state);
  const row = channelList.querySelector(`.item[data-url="${CSS.escape(url)}"]`);
  if(!row) return; const s = row.querySelector('.status'); if(!s) return;
  const dot = s.querySelector('.dot'); const label = s.querySelector('.label');
  dot.classList.remove('ok','bad','unk'); dot.classList.add(state === 'ok' ? 'ok' : state === 'bad' ? 'bad' : 'unk');
  label.textContent = state==='ok' ? 'OK' : state==='bad' ? (reason||'Erreur') : 'Inconnu';
}
function resetAllStatus(){
  STATUS_MAP.clear();
  channelList.querySelectorAll('.status .dot').forEach(d=>{ d.classList.remove('ok','bad','unk'); d.classList.add('unk'); });
  channelList.querySelectorAll('.status .label').forEach(l=>{ l.textContent = '—'; });
  updateSummary();
}
function updateSummary(){
  const vals = [...STATUS_MAP.values()];
  const ok = vals.filter(v=>v==='ok').length;
  const bad = vals.filter(v=>v==='bad').length;
  const unk = vals.filter(v=>v==='unk').length;
  okCountEl.textContent = ok; badCountEl.textContent = bad; unkCountEl.textContent = unk;
  verifySummary.style.display = (ok+bad+unk) ? '' : 'none';
}
function timeoutFetch(resource, options = {}, ms = 6000){
  const ctrl = new AbortController(); const id = setTimeout(()=> ctrl.abort('timeout'), ms);
  const merged = {...options, signal: ctrl.signal};
  return fetch(resource, merged).finally(()=> clearTimeout(id));
}
async function probeUrl(url, signal){
  if(isYouTubeUrl(url)){ return {state:'ok'}; }
  try{ const r=await timeoutFetch(url,{method:'HEAD',mode:'cors',redirect:'follow',cache:'no-store',signal},6000); if(r.ok) return {state:'ok'}; }catch(e){}
  try{ const r=await timeoutFetch(url,{method:'GET',mode:'cors',redirect:'follow',cache:'no-store',signal},7000); if(r.ok) return {state:'ok'}; return {state:'bad', reason:String(r.status||'HTTP')}; }
  catch(e){ return {state:'unk', reason:(e && e.name==='AbortError')?'Annulé/Timeout':'CORS/Opaque'}; }
}
async function verifyVisibleLinks(){
  if(!channelsData.length) return;
  if(verifyAbort){ verifyAbort.abort(); }
  verifyAbort = new AbortController();
  resetAllStatus(); updateSummary();
  const urls = channelsData.map(c=>c.url);
  const concurrency = 4; let i=0;
  async function worker(){
    while(i < urls.length){
      const idx = i++; const u = urls[idx];
      if(verifyAbort.signal.aborted) return;
      setRowStatus(u, 'unk', '…');
      const res = await probeUrl(u, verifyAbort.signal);
      setRowStatus(u, res.state, res.reason);
      updateSummary();
    }
  }
  await Promise.allSettled(Array.from({length:concurrency}, worker));
}
document.getElementById('btnCheckLinks').addEventListener('click', verifyVisibleLinks);
document.getElementById('btnCancelVerify').addEventListener('click', ()=>{ if(verifyAbort){ verifyAbort.abort(); } });
document.getElementById('btnClearStatus').addEventListener('click', resetAllStatus);

function humanBitrate(bps){
  if(!bps) return '';
  const kb = bps/1000, mb=kb/1000;
  return mb>=1 ? `${mb.toFixed(1)} Mb/s` : `${Math.round(kb)} kb/s`;
}

function applyQuality(levelIndex){
  const levels = player.qualityLevels();
  if(!levels || levels.length===0) return;

  if(levelIndex === 'auto'){
    for(let i=0;i<levels.length;i++){ levels[i].enabled = true; }
  }else{
    for(let i=0;i<levels.length;i++){ levels[i].enabled = (i===levelIndex); }
  }
  reflectSelection(levelIndex);
  qualityMenu.hidden = true;
}

function reflectSelection(selection){
  const items = qualityMenu.querySelectorAll('.qitem[data-idx]');
  items.forEach(it => {
    const idx = it.getAttribute('data-idx');
    it.setAttribute('aria-current', String(idx) === String(selection));
  });
  const auto = qualityMenu.querySelector('.qitem[data-idx="auto"]');
  if(auto) auto.setAttribute('aria-current', selection==='auto' ? 'true' : 'false');
}

function currentManualSelection(){
  const levels = player.qualityLevels();
  if(!levels || levels.length===0) return 'auto';
  let enabledCount = 0, lastIdx = 'auto';
  for(let i=0;i<levels.length;i++){ if(levels[i].enabled){ enabledCount++; lastIdx = i; } }
  return enabledCount===1 ? lastIdx : 'auto';
}

function buildQualityMenu(){
  qualityMenu.innerHTML = '';
  const isYT = (player.currentType && typeof player.currentType==='function') ? (player.currentType()==='video/youtube') : false;
  const type = player.currentType ? player.currentType() : '';
  const noABR = /mp4|mp3/i.test(type);

  if(isYT){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Géré par YouTube';
    it.setAttribute('aria-current','true'); qualityMenu.appendChild(it); return;
  }
  if(noABR){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Qualité non disponible'; it.setAttribute('aria-current','true');
    qualityMenu.appendChild(it); return;
  }

  const levels = player.qualityLevels();
  if(!levels || levels.length===0){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Analyse…'; qualityMenu.appendChild(it); return;
  }

  const auto = document.createElement('div'); auto.className='qitem'; auto.dataset.idx='auto';
  auto.innerHTML = `<span>Auto (adaptatif)</span>`;
  auto.addEventListener('click', ()=> applyQuality('auto'));
  qualityMenu.appendChild(auto);

  const sep = document.createElement('div'); sep.className='qsep'; qualityMenu.appendChild(sep);

  const list = [];
  for(let i=0;i<levels.length;i++){
    const L = levels[i];
    list.push({i, height:L.height||0, width:L.width||0, bitrate:L.bitrate||0});
  }
  list.sort((a,b)=> (b.height||b.bitrate) - (a.height||a.bitrate));

  list.forEach(entry=>{
    const label = entry.height ? `${entry.height}p` : (entry.width?`${entry.width}w`:'Niveau');
    const it=document.createElement('div'); it.className='qitem'; it.dataset.idx=entry.i;
    it.innerHTML = `<span>${label}</span><span class="qmeta">${humanBitrate(entry.bitrate)}</span>`;
    it.addEventListener('click', ()=> applyQuality(entry.i));
    qualityMenu.appendChild(it);
  });

  reflectSelection(currentManualSelection());
}

function setupQualityUI(){
  try{
    buildQualityMenu();
    const levels = player.qualityLevels && player.qualityLevels();
    if(levels){
      levels.off && levels.off('addqualitylevel', buildQualityMenu);
      levels.on && levels.on('addqualitylevel', buildQualityMenu);
    }
  }catch(e){ console.warn('Quality UI setup error', e); }
}

function buildAudioMenu(){
  audioMenu.innerHTML='';
  const isYT = (player.currentType && typeof player.currentType==='function') ? (player.currentType()==='video/youtube') : false;
  if(isYT){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Audio géré par YouTube';
    it.setAttribute('aria-current','true'); audioMenu.appendChild(it); return;
  }
  const aTracks = player.audioTracks ? player.audioTracks() : null;
  if(!aTracks || aTracks.length===0){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Aucune piste audio';
    it.setAttribute('aria-current','true'); audioMenu.appendChild(it); return;
  }
  const items = [];
  for(let i=0;i<aTracks.length;i++){
    const t = aTracks[i];
    items.push({i, label: t.label || t.language || ('Piste '+(i+1)), language: t.language||'', enabled: !!t.enabled});
  }
  items.forEach(({i,label,language,enabled})=>{
    const it=document.createElement('div'); it.className='qitem'; it.dataset.idx=i;
    it.setAttribute('aria-current', enabled ? 'true':'false');
    it.innerHTML = `<span>${label}${language?` <span class="qmeta">${language}</span>`:''}</span>`;
    it.addEventListener('click', ()=>{
      for(let j=0;j<aTracks.length;j++){ aTracks[j].enabled = (j===i); }
      buildAudioMenu();
      audioMenu.hidden = true;
    });
    audioMenu.appendChild(it);
  });
}

function buildCCMenu(){
  ccMenu.innerHTML='';
  const isYT = (player.currentType && typeof player.currentType==='function') ? (player.currentType()==='video/youtube') : false;
  const tTracks = player.textTracks ? player.textTracks() : null;

  if(isYT){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='CC gérés par YouTube';
    it.setAttribute('aria-current','true'); ccMenu.appendChild(it); return;
  }
  if(!tTracks || tTracks.length===0){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Aucune piste de sous-titres';
    it.setAttribute('aria-current','true'); ccMenu.appendChild(it); return;
  }

  const off=document.createElement('div'); off.className='qitem'; off.dataset.idx='off';
  const anyShowing = Array.from(tTracks).some(tt => tt.mode === 'showing');
  off.setAttribute('aria-current', anyShowing ? 'false' : 'true');
  off.textContent='Désactivé';
  off.addEventListener('click', ()=>{
    for(let i=0;i<tTracks.length;i++){ tTracks[i].mode='disabled'; }
    buildCCMenu(); ccMenu.hidden=true;
  });
  ccMenu.appendChild(off);

  const sep = document.createElement('div'); sep.className='qsep'; ccMenu.appendChild(sep);

  for(let i=0;i<tTracks.length;i++){
    const tt=tTracks[i];
    if(tt.kind && !/^(subtitles|captions)$/i.test(tt.kind)) continue;
    const label = tt.label || tt.language || ('Sous-titres '+(i+1));
    const it=document.createElement('div'); it.className='qitem'; it.dataset.idx=i;
    it.setAttribute('aria-current', tt.mode === 'showing' ? 'true' : 'false');
    it.innerHTML = `<span>${label}${tt.language?` <span class="qmeta">${tt.language}</span>`:''}</span>`;
    it.addEventListener('click', ()=>{
      for(let j=0;j<tTracks.length;j++){ tTracks[j].mode = (j===i) ? 'showing' : 'disabled'; }
      buildCCMenu(); ccMenu.hidden=true;
    });
    ccMenu.appendChild(it);
  }
  if(ccMenu.querySelectorAll('.qitem[data-idx]').length===0){
    const it=document.createElement('div'); it.className='qitem'; it.textContent='Aucun CC exploitable';
    it.setAttribute('aria-current','true'); ccMenu.innerHTML=''; ccMenu.appendChild(it);
  }
}

function getVideoEl(){
  const v = player && player.el && player.el().querySelector('video');
  return v || null;
}
function reflectPiPState(){
  const v=getVideoEl();
  const isYT = (player.currentType && typeof player.currentType==='function') ? (player.currentType()==='video/youtube') : false;
  const supported = !!(v && v.requestPictureInPicture) && !isYT;
  btnPiP.disabled = !supported;
  btnPiP.textContent = (document.pictureInPictureElement) ? 'Quitter PiP' : 'PiP';
  btnPiP.title = supported ? 'Picture-in-Picture' : 'PiP non disponible pour cette source';
}
btnPiP.addEventListener('click', async ()=>{
  const v=getVideoEl(); if(!v || !v.requestPictureInPicture){ return; }
  try{
    if(document.pictureInPictureElement){ await document.exitPictureInPicture(); }
    else { await v.requestPictureInPicture(); }
  }catch(e){ console.warn('PiP error', e); }
  reflectPiPState();
});
document.addEventListener('enterpictureinpicture', reflectPiPState);
document.addEventListener('leavepictureinpicture', reflectPiPState);

btnFS.addEventListener('click', ()=>{
  if(player.isFullscreen()){ player.exitFullscreen(); }
  else { player.requestFullscreen(); }
  btnFS.textContent = '⤢';
});

function toggleMenu(menu, builder){
  if(menu.hidden){ builder && builder(); menu.hidden=false; }
  else { menu.hidden=true; }
}
btnAudio.addEventListener('click', ()=> toggleMenu(audioMenu, buildAudioMenu));
btnCC.addEventListener('click', ()=> toggleMenu(ccMenu, buildCCMenu));
btnQuality.addEventListener('click', ()=> toggleMenu(qualityMenu, buildQualityMenu));

document.addEventListener('click', (e)=>{
  const targets=[btnAudio,audioMenu,btnCC,ccMenu,btnQuality,qualityMenu];
  if(!targets.some(t=> t.contains && t.contains(e.target))){
    audioMenu.hidden = true; ccMenu.hidden = true; qualityMenu.hidden = true;
  }
});

// === Toggle Mute global (player + overlay si possible) ======================
const btnMute = document.getElementById('btnMute');
const MUTE_KEY = 'player_muted_v1';
let isMuted = (localStorage.getItem(MUTE_KEY) ?? 'false') === 'true';

function reflectMuteUI(){
  if(!btnMute) return;
  btnMute.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
  btnMute.textContent = isMuted ? '🔇' : '🔊';
  btnMute.title = isMuted ? 'Son désactivé' : 'Son activé';
}
function muteMainPlayer(on){
  try{
    player.muted(on);
    const v = getVideoEl();
    if(v){ v.muted = on; v.volume = on ? 0 : (v.volume || 1); }
  }catch{}
}
function broadcastMuteToIframes(on){
  const cmdYT = on ? 'mute' : 'unMute';
  const payloadYT = JSON.stringify({ event:'command', func: cmdYT, args:''});
  document.querySelectorAll('iframe').forEach((iframe)=>{
    const src = (iframe.src||'').toLowerCase();
    try{
      if(src.includes('youtube.com') || src.includes('youtu.be')){
        iframe.contentWindow.postMessage(payloadYT, '*');
      }else if(src.includes('player.vimeo.com')){
        iframe.contentWindow.postMessage({ method:'setVolume', value: on ? 0 : 1 }, '*');
      }else{
        iframe.contentWindow.postMessage({ type: on ? 'mute' : 'unmute' }, '*');
      }
    }catch{}
  });
}
function setGlobalMute(on){
  isMuted = !!on;
  localStorage.setItem(MUTE_KEY, String(isMuted));
  muteMainPlayer(isMuted);
  document.querySelectorAll('video,audio').forEach(el=>{
    try{ el.muted = isMuted; if(isMuted) el.volume = 0; }catch{}
  });
  broadcastMuteToIframes(isMuted);
  reflectMuteUI();
}
reflectMuteUI();
setGlobalMute(isMuted);
btnMute?.addEventListener('click', ()=>{
  setGlobalMute(!isMuted);
});
player.on('loadstart', ()=>{ setTimeout(()=> setGlobalMute(isMuted), 0); });
player.on('loadedmetadata', ()=>{ setTimeout(()=> setGlobalMute(isMuted), 0); });

(function hookOverlayMuteSync(){
  const layer = document.getElementById('playerOverlayLayer');
  if(!layer) return;
  const mo = new MutationObserver(()=> broadcastMuteToIframes(isMuted));
  mo.observe(layer, { attributes:true, attributeFilter:['style','hidden'] });
  broadcastMuteToIframes(isMuted);
})();

const scrubber   = document.getElementById('scrubberBar');
const seekRange  = document.getElementById('seekRange');
const playedEl   = scrubber?.querySelector('.played');
const buffEl     = scrubber?.querySelector('.buffered');
const tCurEl     = document.getElementById('tCur');
const tDurEl     = document.getElementById('tDur');
const btnBack    = document.getElementById('seekBack');
const btnFwd     = document.getElementById('seekFwd');

function fmtTime(s){
  if(!isFinite(s)) return '—';
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return (h>0? String(h).padStart(2,'0')+':':'') + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}
function isLiveLike(){
  try{
    if(player.liveTracker && typeof player.liveTracker.isLive === 'function'){
      if(player.liveTracker.isLive()) return true;
    }
  }catch{}
  const d = player.duration();
  return !isFinite(d) || d === 0;
}
function refreshScrubberVisibility(){
  const live = isLiveLike();
  const hasSource = !!player.currentSource();
  const show = hasSource && !live;
  if(scrubber){
    scrubber.hidden = !show;
    scrubber.dataset.live = String(live);
  }
}
function updateBuffered(){
  if(!buffEl) return;
  const v = player.el().querySelector('video');
  if(!v || !v.buffered || v.buffered.length===0){ buffEl.style.width='0%'; return; }
  const end = v.buffered.end(v.buffered.length-1);
  const dur = player.duration();
  const pct = dur>0 && isFinite(dur) ? Math.min(100, (end/dur)*100) : 0;
  buffEl.style.width = pct.toFixed(2)+'%';
}
function updatePlayed(){
  if(!playedEl || !seekRange) return;
  const cur = player.currentTime();
  const dur = player.duration();
  const pct = dur>0 && isFinite(dur) ? Math.min(100, (cur/dur)*100) : 0;
  playedEl.style.width = pct.toFixed(2)+'%';
  seekRange.value = String(Math.round(pct*10));
  if(tCurEl) tCurEl.textContent = fmtTime(cur);
  if(tDurEl) tDurEl.textContent = fmtTime(dur);
}
function seekToPercent(pct){
  const dur = player.duration();
  if(!(dur>0 && isFinite(dur))) return;
  player.currentTime((pct/100)*dur);
}
let scrubbing = false;
seekRange?.addEventListener('input', (e)=>{
  scrubbing = true;
  const pct = (Number(e.target.value)||0)/10;
  playedEl.style.width = pct+'%';
});
seekRange?.addEventListener('change', (e)=>{
  const pct = (Number(e.target.value)||0)/10;
  seekToPercent(pct);
  scrubbing = false;
});
btnBack?.addEventListener('click', ()=>{ if(isLiveLike()) return; player.currentTime(Math.max(0, player.currentTime()-15)); });
btnFwd ?.addEventListener('click', ()=>{ if(isLiveLike()) return; player.currentTime(Math.min(player.duration()||0, player.currentTime()+15)); });

player.on('loadedmetadata', ()=>{ refreshScrubberVisibility(); updateBuffered(); updatePlayed(); });
player.on('durationchange', ()=>{ refreshScrubberVisibility(); updateBuffered(); updatePlayed(); });
player.on('timeupdate', ()=>{ if(!scrubbing){ updatePlayed(); } });
player.on('progress', updateBuffered);
player.on('loadstart', ()=>{ if(scrubber){ scrubber.hidden = true; } });
player.on('seeking', updatePlayed);
player.on('seeked', updatePlayed);

window.addEventListener('keydown', function(e){
  if(e.defaultPrevented) return;
  const left = e.key === 'ArrowLeft';
  const right = e.key === 'ArrowRight';
  if(!left && !right) return;
  if(isLiveLike()){ return; }
  e.preventDefault(); e.stopPropagation();
  const delta = (e.shiftKey?30:10) * (right?+1:-1);
  player.currentTime( Math.min(Math.max(0, (player.currentTime()||0)+delta), player.duration()||0) );
}, {capture:true});

// === Panneau "Paramètres" mobile ==========================================
(function(){
  const btnSettings  = document.getElementById('btnSettings');
  const settingsMenu = document.getElementById('settingsMenu');
  const zoneQ        = document.getElementById('settingsQuality');
  const zoneA        = document.getElementById('settingsAudio');
  const zoneC        = document.getElementById('settingsCC');

  if(!btnSettings || !settingsMenu) return;

  function cloneMenu(src, dest){
    dest.innerHTML = '';
    src.querySelectorAll('.qitem, .qsep').forEach(n=>{
      const c = n.cloneNode(true);
      if(c.classList.contains('qitem') && !c.hasAttribute('aria-disabled')){
        c.addEventListener('click', ()=>{
          n.dispatchEvent(new MouseEvent('click',{bubbles:true}));
          settingsMenu.hidden = true;
        });
      }
      dest.appendChild(c);
    });
  }

  function rebuildSettings(){
    try{
      buildQualityMenu();
      buildAudioMenu();
      buildCCMenu();
      cloneMenu(qualityMenu, zoneQ);
      cloneMenu(audioMenu, zoneA);
      cloneMenu(ccMenu, zoneC);
    }catch{}
  }

  btnSettings.addEventListener('click', e=>{
    e.stopPropagation();
    if(settingsMenu.hidden){
      rebuildSettings();
      settingsMenu.hidden = false;
    }else{
      settingsMenu.hidden = true;
    }
  });

  document.addEventListener('click', e=>{
    if(!settingsMenu.contains(e.target) && e.target!==btnSettings)
      settingsMenu.hidden = true;
  });

  player.on('loadstart', ()=>settingsMenu.hidden = true);
})();

// === Initialisation du player =============================================
player.ready(()=>{ setupQualityUI(); buildAudioMenu(); buildCCMenu(); reflectPiPState(); });


/* === FAST M3U LOADER — non-breaking install ==================================
   - Streaming parse, batched DOM commits, UI-friendly yields
   - Does NOT remove or modify existing functions
   - Wraps existing loadPlaylist() when present, with safe fallback
===============================================================================*/
(function(){
  if (window.__FAST_M3U_INSTALLED__) return;
  window.__FAST_M3U_INSTALLED__ = true;

  async function streamParseM3U(url, onChannel){
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    if(!reader){
      // no streaming available, fallback to full fetch
      const txt = await res.text();
      const lines = txt.split(/\\r?\\n/);
      let seenHeader=false, pending=null;
      for(const raw of lines){
        const line=(raw||'').trim();
        if(!line) continue;
        if(!seenHeader){
          if(line.startsWith('#EXTM3U')){ seenHeader=true; }
          continue;
        }
        if(line.startsWith('#EXTINF')){
          pending = parseExtInf(line);
        }else if(!line.startsWith('#') && pending){
          const media = line.trim();
          const urlAbs = toAbs(media, url);
          onChannel && onChannel(toChannel(pending, urlAbs));
          pending = null;
        }
      }
      return;
    }
    const decoder = new TextDecoder();
    let buf = '', seenHeader = false, pendingInfo = null;

    const flushLine = (line) => {
      if(!line) return;
      if(!seenHeader){
        if(line.startsWith('#EXTM3U')) { seenHeader = true; return; }
        return;
      }
      if(line.startsWith('#EXTINF')){
        pendingInfo = parseExtInf(line);
      }else if(!line.startsWith('#') && pendingInfo){
        const media = line.trim();
        const urlAbs = toAbs(media, url);
        onChannel && onChannel(toChannel(pendingInfo, urlAbs));
        pendingInfo = null;
      }
    };

    while(true){
      const { value, done } = await reader.read();
      buf += decoder.decode(value || new Uint8Array(), { stream: !done });
      let idx;
      while((idx = buf.indexOf('\\n')) >= 0){
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx+1);
        flushLine(line);
      }
      if(done) break;
    }
    if(buf.trim()) flushLine(buf.trim());

    function parseExtInf(infoLine){
      const out = { name:'', attrs:{} };
      const comma = infoLine.indexOf(',');
      if(comma >= 0) out.name = infoLine.slice(comma+1).trim();
      const attrRegex = /([a-zA-Z0-9\\-]+)="([^"]*)"/g;
      let m; while((m = attrRegex.exec(infoLine))){ out.attrs[m[1]] = m[2]; }
      return out;
    }
    function toAbs(href, base){
      try{ return new URL(href, base).toString(); }catch{ return href; }
    }
    function toChannel(pending, urlAbs){
      return {
        name: pending.name || 'Sans titre',
        url: urlAbs,
        logo: pending.attrs['tvg-logo'] || pending.attrs['logo'] || '',
        group: pending.attrs['group-title'] || ''
      };
    }
  }

  async function loadM3UFast(url){
    if(!url) throw new Error('URL manquante');
    const t0 = performance.now();
    // Ensure globals exist; fall back to legacy path if not
    const hasUI = (typeof document !== 'undefined');
    const listEl = hasUI ? (window.channelList || document.getElementById('channelList')) : null;
    const totalEl = hasUI ? (window.totalCountEl || document.getElementById('totalCount')) : null;
    if(!window.buildRow || !listEl){
      // cannot fast-render; let original do the job
      throw new Error('__FAST_SKIP__');
    }

    // reset UI quickly
    window.channelsData = Array.isArray(window.channelsData) ? [] : [];
    listEl.innerHTML = '';
    if(totalEl) totalEl.textContent = '0';

    const frag = document.createDocumentFragment();
    let batch = 0, lastYield = performance.now();

    const push = async (ch) => {
      window.channelsData.push(ch);
      frag.appendChild(window.buildRow(ch));
      batch++;
      if(batch % 120 === 0){
        listEl.appendChild(frag.cloneNode(true));
        // clear fragment
        while(frag.firstChild) frag.removeChild(frag.firstChild);
        if(totalEl) totalEl.textContent = String(window.channelsData.length);
        if(performance.now() - lastYield > 16){
          await new Promise(requestAnimationFrame);
          lastYield = performance.now();
        }
      }
    };

    await streamParseM3U(url, push);

    // commit final
    if(frag.childNodes.length) listEl.appendChild(frag);
    if(totalEl) totalEl.textContent = String(window.channelsData.length);

    // rebuild groups and filters once
    if(typeof window.rebuildFromCurrent === 'function'){
      window.rebuildFromCurrent();
    }

    // Auto-select first
    if(typeof window.playChannelAt === 'function' && window.channelsData.length){
      window.playChannelAt(0);
    }
    if(typeof window.fitAsideHeight === 'function'){
      window.fitAsideHeight();
    }

    console.log('[FAST-M3U] loaded', window.channelsData.length, 'items in', Math.round(performance.now()-t0), 'ms');
  }

  // Wrap existing loadPlaylist if present, else expose our own
  (function installWrapper(){
    const prev = window.loadPlaylist;
    window.loadPlaylist = async function(url){
      try{
        await loadM3UFast(url);
      }catch(e){
        if(String(e && e.message) === '__FAST_SKIP__' && typeof prev === 'function'){
          return prev.call(this, url);
        }
        if(typeof prev === 'function'){
          // on erreur, fallback
          return prev.call(this, url);
        }else{
          // no previous impl, rethrow real errors
          if(String(e && e.message) !== '__FAST_SKIP__') throw e;
        }
      }
    };
  })();

  // Expose for manual use too
  window.loadM3UFast = loadM3UFast;
  window.streamParseM3U = streamParseM3U;
})();
/* === /FAST M3U LOADER ======================================================*/


// === Toggle panneau CARD (surcouche au player) ================================
// → fermeture auto quand un bouton est cliqué dans panelCard
(function(){
  const layout = document.getElementById('layoutRoot') || document.body;
  const btn = document.getElementById('btnCardToggle');
  const card = document.getElementById('panelCard');
  if (!btn || !card) return;

  const setState = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    layout.classList.toggle('card-open', open);
    // Focus ergonomique
    if (open) {
      const firstInput = card.querySelector('input, button, select, textarea');
      if (firstInput) {
        try { firstInput.focus({ preventScroll:true }); } catch(e){}
      }
    }
  };

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    setState(open);
  });

  // Fermeture auto sur clic d’un bouton interne
  card.addEventListener('click', (e) => {
    const innerBtn = e.target.closest('button');
    if (!innerBtn) return;
    window.requestAnimationFrame(() => {
      setState(false);
    });
  });

  // Fermeture via Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      setState(false);
    }
  });

  // Fermer si on passe en plein écran page entière
  const btnExpandFullLocal = document.getElementById('btnExpandFull');
  if (btnExpandFullLocal){
    btnExpandFullLocal.addEventListener('click', ()=> setState(false));
  }
})();


// (old per-list wiring removed)


// (old toggle-based clearing removed)


// === Wire per-list clear buttons (idempotent) ===============================
(function(){
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{ fn(); }catch(e){} }

  var btnC = byId('btnClearFavsCustom');
  if (btnC && !btnC.__wired){
    btnC.__wired = true;
    btnC.addEventListener('click', function(){
      try{ if(!confirm('Vider les favoris de la CustomList ?')) return; }catch(e){}
      var n = (typeof clearFavsCustom==='function') ? clearFavsCustom() : 0;
      // Re-render views
      safe(function(){ if (typeof renderCustomList==='function') renderCustomList(); });
      safe(function(){ if (typeof renderChannels==='function') renderChannels(); });
      safe(function(){ if (typeof renderChannelList==='function') renderChannelList(); });
    });
  }

  var btnCh = byId('btnClearFavsChannels');
  if (btnCh && !btnCh.__wired){
    btnCh.__wired = true;
    btnCh.addEventListener('click', function(){
      try{ if(!confirm('Vider les favoris de la ChannelList ?')) return; }catch(e){}
      var n = (typeof clearFavsChannels==='function') ? clearFavsChannels() : 0;
      // Re-render views
      safe(function(){ if (typeof renderChannels==='function') renderChannels(); });
      safe(function(){ if (typeof renderChannelList==='function') renderChannelList(); });
      safe(function(){ if (typeof renderCustomList==='function') renderCustomList(); });
    });
  }
})();
// ===========================================================================


// === Favorites: per-list clearing (strong: toggle + storage sync) ==========
(function(){
  function toSet(arr){ var s=new Set(); (arr||[]).forEach(function(x){ if(x) s.add(x); }); return s; }
  function readFavs(){
    try{ var raw = localStorage.getItem('IPTV_FAV_URLS'); var arr = raw? JSON.parse(raw): []; return Array.isArray(arr)? arr: []; }
    catch(e){ return []; }
  }
  function writeFavs(arr){
    try{ localStorage.setItem('IPTV_FAV_URLS', JSON.stringify(Array.from(arr))); }catch(e){}
  }
  function getCustomUrls(){
    try{ if (Array.isArray(window.CUSTOM_LIST)) return window.CUSTOM_LIST.map(function(x){return x&&x.url;}).filter(Boolean); }catch(e){}
    return [];
  }
  function getChannelUrls(){
    var urls = [];
    try{ if (Array.isArray(window.CHANNEL_LIST)) urls = window.CHANNEL_LIST.map(function(x){return x&&x.url;}).filter(Boolean); }catch(e){}
    try{ if (!urls.length && Array.isArray(window.CHANNELS)) urls = window.CHANNELS.map(function(x){return x&&x.url;}).filter(Boolean); }catch(e){}
    try{ if (!urls.length && Array.isArray(window.ALL_CHANNELS)) urls = window.ALL_CHANNELS.map(function(x){return x&&x.url;}).filter(Boolean); }catch(e){}
    if (urls.length) return urls;
    // Fallback: favorites minus custom
    var favs = readFavs();
    var custom = toSet(getCustomUrls());
    return favs.filter(function(u){ return u && !custom.has(u); });
  }
  function drop(urls){
    if (!Array.isArray(urls) || !urls.length) return 0;
    var favs = toSet(readFavs());
    var count = 0;
    urls.forEach(function(u){
      if (!u) return;
      try {
        if (typeof isFav==='function' && isFav(u)) {
          if (typeof toggleFav==='function') toggleFav(u, false);
        }
      } catch(e){}
      if (favs.has(u)){ favs.delete(u); count++; }
    });
    writeFavs(favs);
    try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail:{ perList:true } })); } catch(e){}
    return count;
  }
  window.clearFavsCustom = function(){ return drop(getCustomUrls()); };
  window.clearFavsChannels = function(){ return drop(getChannelUrls()); };
})();
(function () {
  function setupCreditChipDrag() {
    const chip = document.getElementById('creditChip');
    if (!chip || chip.dataset.dragReady === '1') return; // évite double init
    chip.dataset.dragReady = '1';

    chip.classList.add('interactive'); // s'assure que le chip est interactif

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let rect0 = null;

    const getPoint = (e) => {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const onStart = (e) => {
      const { x, y } = getPoint(e);
      rect0 = chip.getBoundingClientRect();
      startX = x; startY = y;
      startLeft = rect0.left; startTop = rect0.top;

      chip.style.position = 'fixed';
      chip.style.left = `${startLeft}px`;
      chip.style.top = `${startTop}px`;
      chip.style.right = 'auto';
      chip.style.bottom = 'auto';

      dragging = true;
      chip.classList.add('is-dragging');
      if (e.cancelable) e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const { x, y } = getPoint(e);
      const dx = x - startX;
      const dy = y - startY;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = rect0.width;
      const h = rect0.height;

      const nextLeft = clamp(startLeft + dx, 0, vw - w);
      const nextTop  = clamp(startTop  + dy, 0, vh - h);

      chip.style.left = `${nextLeft}px`;
      chip.style.top  = `${nextTop}px`;

      if (e.cancelable) e.preventDefault();
    };

    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      chip.classList.remove('is-dragging');
      // Aucun stockage : retour à la position CSS d'origine au reload.
    };

    // Souris
    chip.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);

    // Tactile
    chip.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    // Sécurité
    window.addEventListener('resize', onEnd);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCreditChipDrag, { once: true });
  } else {
    setupCreditChipDrag();
  }
})();


// ===========================================================================



// === Toggle ControlBar (Safe & Non Intrusif) ==============================
(function () {
    const btn = document.getElementById("btnToggleControlBar");
    const bar = document.getElementById("controlBar");

    if (!btn || !bar) return;

    let isHidden = false; // visible par défaut

    const apply = () => {
        bar.style.display = isHidden ? "none" : "flex";
        btn.textContent = isHidden
            ? "🎛️ 👁️"
            : "🎛️ 🚫";
    };

    btn.addEventListener("click", () => {
        isHidden = !isHidden;
        apply();
    });

    apply(); // initialise l’état UI
})();

const btnRefresh = document.getElementById('btnRefreshPlaylist');
if (btnRefresh) {
  btnRefresh.addEventListener('click', () => {
    window.location.reload();
  });
}

