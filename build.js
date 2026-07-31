// Generador estático del sitio. Uso: node build.js
// No requiere `npm install` — usa solo Node.js puro.
const fs = require('fs');
const path = require('path');
const { SITE, VENUES, TAGS, SONGS, SHOWS, VIDEOS, RELEASES, PRESS, LINKS } = require('./data');

const OUT = path.join(__dirname, 'docs');
const BASE = SITE.basePath.replace(/\/$/, '');

function u(p) { return BASE + (p.startsWith('/') ? p : '/' + p); }

function slugify(s) {
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}
function fmtDateShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

// ---------- Enriquecer datos (slugs, contadores, relaciones) ----------
const venueBySlug = Object.fromEntries(VENUES.map(v => [v.slug, v]));
const tagBySlug = Object.fromEntries(TAGS.map(t => [t.slug, t]));

const songTitles = [...new Set(SONGS)];
const songs = songTitles.map(title => ({ title, slug: slugify(title), timesPlayed: 0 }));
const songBySlug = Object.fromEntries(songs.map(s => [s.slug, s]));
const songByTitle = Object.fromEntries(songs.map(s => [s.title, s]));

const shows = SHOWS.map(s => {
  const venue = venueBySlug[s.venue];
  if (!venue) throw new Error(`Venue no encontrado: ${s.venue}`);
  const slug = slugify(`${s.date}-${venue.name}-${venue.city}`);
  const setlist = (s.setlist || []).map((title, i) => {
    const song = songByTitle[title];
    if (!song) throw new Error(`Canción no encontrada en SONGS: ${title}`);
    song.timesPlayed++;
    return { position: i + 1, title: song.title, slug: song.slug };
  });
  const tags = (s.tags || []).map(ts => {
    if (!tagBySlug[ts]) throw new Error(`Tag no encontrado en TAGS: ${ts}`);
    return tagBySlug[ts];
  });
  return { ...s, slug, venue, setlist, tags, tracks: s.tracks || [] };
}).filter(s => s.public).sort((a, b) => a.date.localeCompare(b.date));

for (const t of TAGS) {
  t.showCount = shows.filter(s => s.tags.some(x => x.slug === t.slug)).length;
}
for (const v of VENUES) {
  v.showCount = shows.filter(s => s.venue.slug === v.slug).length;
}
songs.sort((a, b) => b.timesPlayed - a.timesPlayed || a.title.localeCompare(b.title));

const years = [...new Set(shows.map(s => s.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));

// ---------- Layout ----------
function layout({ title, active, content, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="es" data-theme="mp-dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · ${SITE.name}</title>
<meta name="description" content="${SITE.description}">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="${u('/feed.xml')}">
<link rel="icon" href="${u('/public/images/logo.png')}">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
<script src="https://unpkg.com/dexie@3/dist/dexie.js"></script>
<script>
  tailwind.config = { theme: { extend: { colors: { mp: {
    bg:'#0f1220', surface:'#171b2e', surface2:'#1f2440', accent:'#7fb1e0', accent2:'#e08fae', text:'#e9ecf7', muted:'#8991b0'
  } } }, fontFamily: { display: ['Georgia','serif'] } } }
</script>
<style>
  body{background:#0f1220;color:#e9ecf7}
  .light-mode body{background:#f4f5fb;color:#171b2e}
  ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-thumb{background:#2b3155;border-radius:4px}
  .waves{background:radial-gradient(circle at 20% 20%,rgba(127,177,224,.15),transparent 40%),radial-gradient(circle at 80% 60%,rgba(224,143,174,.12),transparent 45%)}
</style>
<link rel="stylesheet" href="${u('/public/css/style.css')}">
<script>window.MP_BASE_PATH = ${JSON.stringify(BASE)};</script>
${extraHead}
</head>
<body class="min-h-screen flex flex-col waves pb-24">
${nav(active)}
<main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
${content}
</main>
${footer()}
<script src="${u('/public/js/player.js')}"></script>
<script src="${u('/public/js/archive-player.js')}"></script>
<script src="${u('/public/js/favourites.js')}"></script>
</body>
</html>`;
}

function navLink(href, label, active, key) {
  const cls = active === key ? 'text-mp-accent' : 'hover:text-mp-accent transition';
  return `<a href="${href}" class="${cls}">${label}</a>`;
}

function nav(active) {
  const tagLinks = TAGS.map(t => `<a href="${u('/tags/' + t.slug + '/')}" class="block px-4 py-1.5 hover:bg-mp-surface hover:text-mp-accent">${t.name}</a>`).join('\n');
  return `<header class="border-b border-mp-surface2/60 bg-mp-surface/60 backdrop-blur sticky top-0 z-40">
  <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
    <a href="${u('/')}" class="flex items-center gap-3 group">
      <img src="${u('/public/images/logo.png')}" alt="Matilde Pizarro" class="w-10 h-10 rounded-full object-cover shadow-lg">
      <span class="font-display text-xl tracking-wide group-hover:text-mp-accent transition">Matilde Pizarro <span class="text-mp-accent2">Tapes</span></span>
    </a>
    <nav class="flex flex-wrap items-center gap-4 text-sm text-mp-muted relative">
      ${navLink(u('/shows/'), 'Shows', active, 'shows')}
      ${navLink(u('/years/'), 'Años', active, 'years')}
      ${navLink(u('/venues/'), 'Venues', active, 'venues')}
      ${navLink(u('/songs/'), 'Canciones', active, 'songs')}
      ${navLink(u('/dates/'), 'Fechas', active, 'dates')}
      <details class="relative">
        <summary class="cursor-pointer list-none hover:text-mp-accent transition flex items-center gap-1">Etiquetas de show <span class="text-[10px]">▾</span></summary>
        <div class="absolute left-0 mt-2 w-64 bg-mp-surface2 border border-mp-surface rounded-lg shadow-xl py-2 z-50 max-h-80 overflow-y-auto">
          <a href="${u('/tags/')}" class="block px-4 py-1.5 text-mp-text hover:bg-mp-surface font-semibold">Ver todas →</a>
          ${tagLinks}
        </div>
      </details>
      <details class="relative">
        <summary class="cursor-pointer list-none hover:text-mp-accent transition flex items-center gap-1">Pistas destacadas <span class="text-[10px]">▾</span></summary>
        <div class="absolute left-0 mt-2 w-64 bg-mp-surface2 border border-mp-surface rounded-lg shadow-xl py-2 z-50">
          <a href="${u('/notables/#jams')}" class="block px-4 py-1.5 hover:bg-mp-surface hover:text-mp-accent">Jams de 20+ minutos</a>
          <a href="${u('/notables/#curados')}" class="block px-4 py-1.5 hover:bg-mp-surface hover:text-mp-accent">Curadas por el equipo</a>
          <a href="${u('/notables/#votados')}" class="block px-4 py-1.5 hover:bg-mp-surface hover:text-mp-accent">Votadas por usuarios</a>
        </div>
      </details>
      ${navLink(u('/top-shows/'), 'Top Shows', active, 'top')}
      ${navLink(u('/favourites/'), 'Shows Favoritos', active, 'fav')}
      ${navLink(u('/settings/'), 'Configuración', active, 'settings')}
      ${navLink(u('/about/'), 'Acerca de', active, 'about')}
      <form action="${u('/search/')}" method="get" class="flex items-center gap-1">
        <input type="text" name="q" placeholder="Buscar…" class="bg-mp-surface2 rounded px-2 py-1 text-mp-text text-sm w-32 focus:w-48 transition-all outline-none focus:ring-1 focus:ring-mp-accent">
      </form>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="border-t border-mp-surface2/60 text-center text-xs text-mp-muted py-6">
  <p>${SITE.name} — archivo no oficial de grabaciones en vivo. Hecho con cariño en Villa Alemana, Valparaíso.</p>
  <p class="mt-2 flex items-center justify-center gap-3 flex-wrap">
    <a href="${LINKS.spotify}" target="_blank" rel="noopener" class="hover:text-mp-accent">Spotify</a>
    <a href="${LINKS.appleMusic}" target="_blank" rel="noopener" class="hover:text-mp-accent">Apple Music</a>
    <a href="${LINKS.instagram}" target="_blank" rel="noopener" class="hover:text-mp-accent">Instagram</a>
    <a href="${LINKS.youtube}" target="_blank" rel="noopener" class="hover:text-mp-accent">YouTube</a>
    <a href="${LINKS.bandcamp}" target="_blank" rel="noopener" class="hover:text-mp-accent">Bandcamp</a>
    <a href="${LINKS.setlistfm}" target="_blank" rel="noopener" class="hover:text-mp-accent">Setlist.fm</a>
  </p>
  <p class="mt-1"><a href="${u('/feed.xml')}" class="hover:text-mp-accent">RSS</a> · <a href="${u('/data.json')}" class="hover:text-mp-accent">Datos (JSON)</a> · <a href="${u('/about/')}" class="hover:text-mp-accent">Acerca de</a></p>
</footer>
<div id="player-bar" class="fixed bottom-0 left-0 right-0 bg-mp-surface border-t border-mp-surface2 z-50 hidden">
  <div class="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
    <button id="player-toggle" class="w-10 h-10 rounded-full bg-mp-accent text-mp-bg flex items-center justify-center font-bold text-lg shrink-0">▶</button>
    <div class="min-w-0 flex-1">
      <div id="player-title" class="text-sm font-semibold truncate">—</div>
      <div id="player-subtitle" class="text-xs text-mp-muted truncate">—</div>
      <input id="player-seek" type="range" min="0" max="100" value="0" class="w-full accent-mp-accent h-1 mt-1">
    </div>
    <div class="flex items-center gap-2 text-xs text-mp-muted shrink-0">
      <span id="player-time">0:00 / 0:00</span>
      <select id="player-speed" class="bg-mp-surface2 rounded px-1 py-0.5 text-xs">
        <option value="0.75">0.75x</option><option value="1" selected>1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option>
      </select>
      <button id="player-prev" title="Anterior">⏮</button>
      <button id="player-next" title="Siguiente">⏭</button>
      <button id="player-shuffle" title="Shuffle">🔀</button>
    </div>
  </div>
</div>`;
}

function showCard(s) {
  const img = s.poster ? `<img src="${u('/public/images/' + s.poster)}" class="w-full h-full object-cover group-hover:scale-105 transition" alt="">`
    : `<div class="h-full flex items-center justify-center text-mp-muted text-sm">Sin imagen</div>`;
  return `<a href="${u('/shows/' + s.slug + '/')}" class="bg-mp-surface rounded-xl overflow-hidden border border-mp-surface2 hover:border-mp-accent transition group">
    <div class="h-40 overflow-hidden bg-mp-surface2">${img}</div>
    <div class="p-4">
      <div class="text-mp-accent text-sm mb-1">${fmtDate(s.date)}</div>
      <div class="font-semibold">${s.venue.name}</div>
      <div class="text-mp-muted text-sm">${s.venue.city}</div>
    </div>
  </a>`;
}

function showRow(s) {
  return `<a href="${u('/shows/' + s.slug + '/')}" class="flex items-center justify-between bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 gap-3 flex-wrap">
    <span>${s.venue.name}, ${s.venue.city} — ${fmtDateShort(s.date)}</span>
    ${s.tags.length ? `<span class="flex gap-1 flex-wrap">${s.tags.map(t => `<span class="text-[10px] bg-mp-surface2 text-mp-muted px-2 py-0.5 rounded-full">${t.name}</span>`).join('')}</span>` : ''}
  </a>`;
}

// ---------- Escritura de archivos ----------
function write(routePath, html) {
  const dir = path.join(OUT, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// public assets
fs.cpSync(path.join(__dirname, 'public'), path.join(OUT, 'public'), { recursive: true });
// audio uploads folder (empty placeholder, admin drops mp3s here per show)
fs.mkdirSync(path.join(OUT, 'public', 'audio'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'public', 'audio', '.gitkeep'), '');

// .nojekyll so GitHub Pages serves files/folders starting with _ etc. correctly
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// ---------- Home ----------
{
  const recent = shows.slice(-6).reverse();
  const heroImg = recent[0] && recent[0].poster ? recent[0].poster : null;
  const content = `
  <section class="rounded-2xl overflow-hidden relative mb-10 bg-mp-surface border border-mp-surface2">
    <div class="grid md:grid-cols-2 gap-0">
      <div class="p-8 md:p-12 flex flex-col justify-center">
        <p class="uppercase tracking-widest text-mp-accent2 text-xs mb-3">Archivo en vivo</p>
        <h1 class="font-display text-4xl md:text-5xl mb-4 leading-tight">Matilde Pizarro <span class="text-mp-accent">Tapes</span></h1>
        <p class="text-mp-muted mb-6">Un archivo de grabaciones en vivo — shows, setlists y cintas, todo en un solo lugar. Sin cuenta, sin anuncios, hecho por y para la comunidad.</p>
        <div class="flex flex-wrap gap-3">
          <a href="${u('/shows/')}" class="bg-mp-accent text-mp-bg px-5 py-2 rounded-full font-semibold hover:opacity-90 transition">Ver todos los shows</a>
          <a href="${u('/about/')}" class="border border-mp-accent text-mp-accent px-5 py-2 rounded-full font-semibold hover:bg-mp-accent hover:text-mp-bg transition">Acerca de Matilde</a>
        </div>
        <div class="flex gap-6 mt-8 text-sm text-mp-muted">
          <div><span class="text-2xl font-display text-mp-text">${shows.length}</span><br>shows</div>
          <div><span class="text-2xl font-display text-mp-text">${songs.length}</span><br>canciones</div>
          <div><span class="text-2xl font-display text-mp-text">${VENUES.length}</span><br>venues</div>
        </div>
      </div>
      <div class="relative min-h-[280px] bg-mp-surface2">
        <img src="${u('/public/images/' + (heroImg || 'matilde-1.jpg'))}" class="w-full h-full object-cover opacity-90" alt="Matilde Pizarro">
        <div class="absolute inset-0 bg-gradient-to-t from-mp-surface via-transparent to-transparent"></div>
      </div>
    </div>
  </section>
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-2xl">Shows recientes</h2>
      <a href="${u('/shows/')}" class="text-sm text-mp-accent hover:underline">Ver todos →</a>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${recent.map(showCard).join('')}</div>
  </section>
  <section class="grid sm:grid-cols-3 gap-4 mb-10">
    <a href="${u('/years/')}" class="bg-mp-surface2 rounded-xl p-5 text-center hover:bg-mp-surface transition"><div class="text-2xl mb-2">📅</div>Por año</a>
    <a href="${u('/venues/')}" class="bg-mp-surface2 rounded-xl p-5 text-center hover:bg-mp-surface transition"><div class="text-2xl mb-2">📍</div>Por venue</a>
    <a href="${u('/songs/')}" class="bg-mp-surface2 rounded-xl p-5 text-center hover:bg-mp-surface transition"><div class="text-2xl mb-2">🎵</div>Por canción</a>
  </section>`;
  write('', layout({ title: 'Inicio', active: 'home', content }));
}

// ---------- Shows index ----------
write('shows', layout({
  title: 'Todos los shows', active: 'shows',
  content: `<h1 class="font-display text-3xl mb-6">Todos los shows</h1>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${shows.slice().reverse().map(showCard).join('')}</div>`,
}));

// ---------- Show detail ----------
for (let i = 0; i < shows.length; i++) {
  const s = shows[i];
  const prev = shows[i - 1];
  const next = shows[i + 1];
  const poster = s.poster ? `<img src="${u('/public/images/' + s.poster)}" class="w-full rounded-xl border border-mp-surface2" alt="">` : '';
  const setlist = s.setlist.length
    ? `<ol class="space-y-1">${s.setlist.map(t => `<li class="flex gap-3"><span class="text-mp-muted w-6 text-right">${t.position}.</span><a href="${u('/songs/' + t.slug + '/')}" class="hover:text-mp-accent">${t.title}</a></li>`).join('')}</ol>`
    : `<p class="text-mp-muted text-sm">Setlist no disponible todavía.</p>`;
  const tracksHtml = s.archive
    ? `<div id="ia-player" class="rounded-xl border border-mp-surface2 bg-mp-surface overflow-hidden" data-archive="${s.archive}" data-title="${s.venue.name}, ${s.venue.city}" data-subtitle="${fmtDateShort(s.date)}" data-cover="${s.poster ? u('/public/images/' + s.poster) : u('/public/images/logo.png')}">
        <div class="p-4 text-sm text-mp-muted">Cargando grabación desde archive.org…</div>
      </div>
      <p class="text-xs text-mp-muted mt-2">Grabación alojada en <a href="https://archive.org/details/${s.archive}" target="_blank" rel="noopener" class="text-mp-accent hover:underline">archive.org</a>.</p>`
    : s.tracks.length
      ? `<div class="space-y-1">${s.tracks.map((tr, idx) => `<button onclick='MPPlayer.playQueue(${JSON.stringify(s.tracks.map((t2, i2) => ({ src: u('/public/audio/' + s.slug + '/' + t2.file), title: t2.title, subtitle: s.venue.name })))},${idx})' class="w-full text-left flex justify-between bg-mp-surface2 hover:bg-mp-surface rounded px-3 py-2 text-sm"><span>${idx + 1}. ${tr.title}</span><span class="text-mp-muted">▶</span></button>`).join('')}</div>`
      : `<p class="text-mp-muted text-sm">Todavía no hay audio subido para este show. Para agregarlo: pon los mp3 en <code>public/audio/${s.slug}/</code> y agrégalos en <code>data.js</code> dentro de <code>tracks</code> de este show.</p>`;
  const tagsHtml = s.tags.length ? `<div class="flex gap-2 flex-wrap mb-4">${s.tags.map(t => `<a href="${u('/tags/' + t.slug + '/')}" class="text-xs bg-mp-surface2 hover:bg-mp-accent hover:text-mp-bg text-mp-muted px-3 py-1 rounded-full transition">${t.name}</a>`).join('')}</div>` : '';
  const content = `
  <div class="flex justify-between items-center mb-4 text-sm">
    ${prev ? `<a href="${u('/shows/' + prev.slug + '/')}" class="text-mp-accent hover:underline">← ${fmtDateShort(prev.date)}</a>` : '<span></span>'}
    <a href="${u('/shows/')}" class="text-mp-muted hover:text-mp-accent">Todos los shows</a>
    ${next ? `<a href="${u('/shows/' + next.slug + '/')}" class="text-mp-accent hover:underline">${fmtDateShort(next.date)} →</a>` : '<span></span>'}
  </div>
  <div class="flex items-start gap-4 mb-6 flex-wrap">
    ${s.poster ? `<img src="${u('/public/images/' + s.poster)}" class="w-20 h-20 rounded-lg object-cover border border-mp-surface2 shrink-0" alt="">` : ''}
    <div class="min-w-0">
      <p class="text-mp-accent text-sm mb-0.5">${fmtDate(s.date)}</p>
      <h1 class="font-display text-3xl mb-0.5">${s.venue.name}</h1>
      <p class="text-mp-muted text-sm mb-2">${s.venue.city}${s.venue.address ? ', ' + s.venue.address : ''}</p>
      ${tagsHtml}
    </div>
    <button data-fav-slug="${s.slug}" data-fav-title="${s.venue.name}" data-fav-subtitle="${fmtDateShort(s.date)} · ${s.venue.city}" class="ml-auto text-sm border border-mp-surface2 rounded-full px-4 py-1.5 hover:border-mp-accent transition shrink-0">☆ Agregar a favoritos</button>
  </div>
  ${s.notes ? `<p class="text-sm mb-6 bg-mp-surface border border-mp-surface2 rounded-lg p-4">${s.notes}</p>` : ''}
  <div class="grid lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2">
      <h2 class="font-display text-2xl mb-3">Grabación</h2>
      ${tracksHtml}
    </div>
    <div class="text-sm">
      <h2 class="font-display text-base text-mp-muted mb-2 uppercase tracking-widest">Setlist</h2>
      <div class="opacity-90 text-sm">${setlist}</div>
    </div>
  </div>`;
  write('shows/' + s.slug, layout({ title: `${fmtDateShort(s.date)} - ${s.venue.name}`, active: 'shows', content }));
}

// ---------- Years ----------
write('years', layout({
  title: 'Años', active: 'years',
  content: `<h1 class="font-display text-3xl mb-6">Años</h1>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">${years.map(y => `<a href="${u('/years/' + y + '/')}" class="bg-mp-surface hover:bg-mp-surface2 border border-mp-surface2 rounded-xl p-6 text-center font-display text-2xl">${y}</a>`).join('')}</div>`,
}));
for (const y of years) {
  const yShows = shows.filter(s => s.date.startsWith(y)).slice().reverse();
  write('years/' + y, layout({
    title: y, active: 'years',
    content: `<h1 class="font-display text-3xl mb-6">${y}</h1><div class="space-y-2">${yShows.map(showRow).join('')}</div>`,
  }));
}

// ---------- Venues ----------
write('venues', layout({
  title: 'Venues', active: 'venues',
  content: `<h1 class="font-display text-3xl mb-6">Venues</h1>
  <div class="grid sm:grid-cols-2 gap-3">${VENUES.map(v => `<a href="${u('/venues/' + v.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 border border-mp-surface2 rounded-xl p-5 flex justify-between"><span><span class="font-semibold">${v.name}</span><br><span class="text-mp-muted text-sm">${v.city}, ${v.country}</span></span><span class="text-mp-muted text-sm self-center">${v.showCount} show${v.showCount === 1 ? '' : 's'}</span></a>`).join('')}</div>`,
}));
for (const v of VENUES) {
  const vShows = shows.filter(s => s.venue.slug === v.slug).slice().reverse();
  write('venues/' + v.slug, layout({
    title: v.name, active: 'venues',
    content: `<h1 class="font-display text-3xl mb-1">${v.name}</h1><p class="text-mp-muted mb-6">${v.city}, ${v.country}${v.address ? ' · ' + v.address : ''}</p>
    <div class="space-y-2">${vShows.map(showRow).join('') || '<p class="text-mp-muted text-sm">Sin shows registrados todavía.</p>'}</div>`,
  }));
}

// ---------- Songs ----------
write('songs', layout({
  title: 'Canciones', active: 'songs',
  content: `<h1 class="font-display text-3xl mb-6">Canciones</h1>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${songs.map(s => `<a href="${u('/songs/' + s.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 flex justify-between"><span>${s.title}</span><span class="text-mp-muted text-xs">${s.timesPlayed}x</span></a>`).join('')}</div>`,
}));
for (const s of songs) {
  const perf = shows.filter(sh => sh.setlist.some(t => t.slug === s.slug)).slice().reverse();
  write('songs/' + s.slug, layout({
    title: s.title, active: 'songs',
    content: `<h1 class="font-display text-3xl mb-1">${s.title}</h1><p class="text-mp-muted mb-6">Tocada ${s.timesPlayed} veces</p>
    <div class="space-y-2">${perf.map(showRow).join('') || '<p class="text-mp-muted text-sm">Aún no aparece en ningún setlist cargado.</p>'}</div>`,
  }));
}

// ---------- Tags ----------
write('tags', layout({
  title: 'Etiquetas de show', active: 'tags',
  content: `<h1 class="font-display text-3xl mb-2">Etiquetas de show</h1><p class="text-mp-muted text-sm mb-6">Explora los shows según su formato o tipo de evento.</p>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${TAGS.map(t => `<a href="${u('/tags/' + t.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 flex items-center justify-between"><span>${t.name}</span><span class="text-mp-muted text-xs">${t.showCount} show${t.showCount === 1 ? '' : 's'}</span></a>`).join('')}</div>`,
}));
for (const t of TAGS) {
  const tShows = shows.filter(s => s.tags.some(x => x.slug === t.slug)).slice().reverse();
  write('tags/' + t.slug, layout({
    title: t.name, active: 'tags',
    content: `<a href="${u('/tags/')}" class="text-mp-accent text-sm hover:underline">← Etiquetas</a>
    <h1 class="font-display text-3xl my-4">Etiqueta: ${t.name}</h1>
    <div class="space-y-2">${tShows.map(showRow).join('') || '<p class="text-mp-muted text-sm">Todavía no hay shows con esta etiqueta.</p>'}</div>`,
  }));
}

// ---------- Notables ----------
{
  const mostPlayed = songs.slice(0, 10);
  const teamCurated = songs.filter(s => s.teamCurated);
  const userUpvoted = songs.filter(s => s.userUpvoted);
  const longJams = shows.flatMap(s => s.tracks.filter(t => t.durationSeconds >= 1200).map(t => ({ ...t, show: s })));
  const content = `
  <h1 class="font-display text-3xl mb-2">Destacados</h1>
  <p class="text-mp-muted text-sm mb-6">Incluye "Pistas destacadas": jams de 20+ minutos, curadas por el equipo y votadas por usuarios.</p>
  <h2 id="jams" class="font-display text-xl mb-3">🕒 Jams de 20+ minutos</h2>
  <div class="space-y-2 mb-8">${longJams.map(j => `<a href="${u('/shows/' + j.show.slug + '/')}" class="flex justify-between bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2"><span>${j.title} — ${j.show.venue.name}</span></a>`).join('') || '<p class="text-mp-muted text-sm">Aún no hay pistas de 20+ minutos cargadas.</p>'}</div>
  <h2 id="curados" class="font-display text-xl mb-3">✅ Curadas por el equipo</h2>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">${teamCurated.map(s => `<a href="${u('/songs/' + s.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2">${s.title}</a>`).join('') || '<p class="text-mp-muted text-sm">Aún no hay canciones curadas por el equipo.</p>'}</div>
  <h2 id="votados" class="font-display text-xl mb-3">👍 Votadas por usuarios</h2>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">${userUpvoted.map(s => `<a href="${u('/songs/' + s.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2">${s.title}</a>`).join('') || '<p class="text-mp-muted text-sm">Aún no hay votos de usuarios.</p>'}</div>
  <h2 class="font-display text-xl mb-3">Canciones más tocadas</h2>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${mostPlayed.map(s => `<a href="${u('/songs/' + s.slug + '/')}" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 flex justify-between"><span>${s.title}</span><span class="text-mp-muted text-xs">${s.timesPlayed}x</span></a>`).join('')}</div>`;
  write('notables', layout({ title: 'Destacados', active: 'notables', content }));
}

// ---------- Dates ----------
write('dates', layout({
  title: 'Fechas', active: 'dates',
  content: `<h1 class="font-display text-3xl mb-6">Fechas</h1><p class="text-mp-muted text-sm mb-6">Listado cronológico completo de todas las fechas de shows.</p>
  <div class="space-y-2">${shows.map(showRow).join('')}</div>`,
}));

// ---------- Top Shows ----------
write('top-shows', layout({
  title: 'Top Shows', active: 'top',
  content: `<h1 class="font-display text-3xl mb-6">Top Shows</h1><p class="text-mp-muted text-sm mb-6">Los shows destacados por la comunidad. Vota tu favorito en Instagram o cuéntanos directamente — el ranking por estrellas se activará cuando el sitio tenga backend propio.</p>
  <div class="space-y-2">${shows.slice().reverse().map(showRow).join('')}</div>`,
}));

// ---------- About ----------
write('about', layout({
  title: 'Acerca de', active: 'about',
  content: `
  <section class="grid md:grid-cols-2 gap-8 mb-10 items-center">
    <div>
      <p class="uppercase tracking-widest text-mp-accent2 text-xs mb-3">Acerca de</p>
      <h1 class="font-display text-4xl mb-4">Matilde Pizarro</h1>
      <p class="text-mp-muted mb-4">Cantautora chilena originaria de Quilpué. Rock alternativo / dream pop / indie rock / shoegaze.</p>
      <p class="text-sm text-mp-muted">Villa Alemana, Valparaíso, Chile.</p>
    </div>
    <div class="rounded-xl overflow-hidden border border-mp-surface2">
      <img src="${u('/public/images/matilde-2.jpg')}" class="w-full h-full object-cover" alt="Matilde Pizarro en vivo">
    </div>
  </section>
  <section class="mb-10 bg-mp-surface border border-mp-surface2 rounded-xl p-6 md:p-8 space-y-4 text-sm leading-relaxed">
    <h2 class="font-display text-2xl mb-2">Historia del proyecto</h2>
    <p>Su recorrido musical comenzó mucho antes de su proyecto solista: entre 2011 y 2019 se desempeñó como guitarrista en las bandas Time y Miopía, llevando su música a distintos escenarios y festivales a lo largo de Chile, experiencia que consolidó su trabajo en vivo.</p>
    <p>Entre 2018 y 2025 desarrolló su proyecto solista bajo el nombre Timbuka, etapa en la que publicó un EP en 2019, un disco en 2020 y distintas canciones que la proyectaron hacia nuevos públicos, incluyendo participaciones en festivales online en México y España, presentaciones en universidades y distintos espacios de Chile. Durante ese periodo también se destacaron notas de prensa en diversos medios. Su trabajo se movió entre el indie/folk y la psicodelia, siempre desde una mirada introspectiva y personal.</p>
    <p>En 2026 inicia una nueva etapa artística bajo su nombre real, marcando un renacimiento creativo que acompaña una transformación musical y personal. Este nuevo ciclo abrió con presentaciones en vivo durante el año y tomó forma en abril con el lanzamiento de los singles "TEXTURAS" y "VUELO", preparando lo que será su primer disco como Matilde Pizarro.</p>
  </section>
  <section class="grid md:grid-cols-2 gap-4 mb-10">
    <div class="bg-mp-surface2 rounded-xl p-5"><h3 class="font-display text-lg mb-2">🎸 Acústico</h3><p class="text-sm text-mp-muted">Guitarra electroacústica acompañada de dos voces amplificadas.</p></div>
    <div class="bg-mp-surface2 rounded-xl p-5"><h3 class="font-display text-lg mb-2">⚡ Eléctrico</h3><p class="text-sm text-mp-muted">Formato adaptable a dúo o trío.</p></div>
  </section>
  <section class="mb-10">
    <h2 class="font-display text-2xl mb-4">Lanzamientos</h2>
    <div class="space-y-2 text-sm">${RELEASES.map(r => `<div class="flex justify-between bg-mp-surface rounded-lg px-4 py-3 border border-mp-surface2"><span>${r.title}</span><span class="text-mp-muted">${fmtDate(r.date)}</span></div>`).join('')}</div>
  </section>
  <section class="mb-10">
    <h2 class="font-display text-2xl mb-4">Videos oficiales</h2>
    <div class="grid sm:grid-cols-2 gap-3 text-sm">${VIDEOS.map(v => `<a href="${v.url}" target="_blank" rel="noopener" class="bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2">${v.title}</a>`).join('')}</div>
  </section>
  <section class="mb-10">
    <h2 class="font-display text-2xl mb-4">Prensa</h2>
    ${PRESS.map(p => `<a href="${p.url}" target="_blank" rel="noopener" class="block bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 text-sm">${p.title}</a>`).join('')}
  </section>
  <section class="mb-10">
    <h2 class="font-display text-2xl mb-4">Contacto</h2>
    <div class="bg-mp-surface border border-mp-surface2 rounded-xl p-6 text-sm space-y-1">
      <p><span class="text-mp-muted">Representante:</span> Matilde Pizarro</p>
      <p><span class="text-mp-muted">Correo:</span> <a class="text-mp-accent hover:underline" href="mailto:${LINKS.email}">${LINKS.email}</a></p>
      <p><span class="text-mp-muted">WhatsApp:</span> <a class="text-mp-accent hover:underline" href="${LINKS.whatsapp}">+56 9 7171 0225</a></p>
      <p><span class="text-mp-muted">Ciudad:</span> Villa Alemana, Valparaíso, Chile</p>
    </div>
  </section>`,
}));

// ---------- Favourites (client-side via Dexie/IndexedDB) ----------
write('favourites', layout({
  title: 'Shows Favoritos', active: 'fav',
  content: `<h1 class="font-display text-3xl mb-6">Shows Favoritos</h1>
  <div id="favourites-list"></div>
  <script>document.addEventListener('DOMContentLoaded', function(){ /* favourites.js maneja el render */ });</script>`,
}));

// ---------- Settings ----------
write('settings', layout({
  title: 'Configuración', active: 'settings',
  content: `<h1 class="font-display text-3xl mb-6">Configuración</h1>
  <div class="bg-mp-surface rounded-xl p-6 border border-mp-surface2 max-w-md space-y-6">
    <div><label class="block text-sm text-mp-muted mb-2">Tema</label>
      <select id="theme-select" class="w-full bg-mp-surface2 rounded px-3 py-2"><option value="dark">Oscuro (por defecto)</option><option value="light">Claro</option></select></div>
    <div><label class="block text-sm text-mp-muted mb-2">Calidad de streaming preferida</label>
      <select id="quality-select" class="w-full bg-mp-surface2 rounded px-3 py-2"><option value="auto">Automática</option><option value="high">Alta</option><option value="low">Baja (ahorro de datos)</option></select></div>
  </div>
  <script>
    var themeSelect=document.getElementById('theme-select'),qualitySelect=document.getElementById('quality-select');
    themeSelect.value=localStorage.getItem('mp_theme')||'dark'; qualitySelect.value=localStorage.getItem('mp_quality')||'auto';
    themeSelect.addEventListener('change',function(){localStorage.setItem('mp_theme',themeSelect.value);document.body.parentElement.classList.toggle('light-mode',themeSelect.value==='light');});
    qualitySelect.addEventListener('change',function(){localStorage.setItem('mp_quality',qualitySelect.value);});
    if(themeSelect.value==='light')document.body.parentElement.classList.add('light-mode');
  </script>`,
}));

// ---------- Search (client-side, uses data.json) ----------
write('search', layout({
  title: 'Buscar', active: 'search',
  content: `<h1 class="font-display text-3xl mb-6">Buscar</h1>
  <div id="search-results" class="space-y-2"></div>
  <script>
  (function(){
    var params = new URLSearchParams(location.search);
    var q = (params.get('q')||'').trim().toLowerCase();
    var out = document.getElementById('search-results');
    if (!q) { out.innerHTML = '<p class="text-mp-muted text-sm">Escribe algo en el buscador de arriba.</p>'; return; }
    fetch('${u('/data.json')}').then(function(r){return r.json();}).then(function(data){
      var shows = data.shows.filter(function(s){ return (s.venue.name+' '+s.venue.city+' '+(s.notes||'')).toLowerCase().indexOf(q) !== -1; });
      var songs = data.songs.filter(function(s){ return s.title.toLowerCase().indexOf(q) !== -1; });
      var venues = data.venues.filter(function(v){ return (v.name+' '+v.city).toLowerCase().indexOf(q) !== -1; });
      var html = '';
      if (shows.length) { html += '<h2 class="font-display text-xl mb-2">Shows</h2>' + shows.map(function(s){ return '<a href="${u('/shows/')}'+s.slug+'/" class="block bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 mb-2">'+s.venue.name+', '+s.venue.city+' — '+s.date+'</a>'; }).join(''); }
      if (songs.length) { html += '<h2 class="font-display text-xl mb-2 mt-4">Canciones</h2>' + songs.map(function(s){ return '<a href="${u('/songs/')}'+s.slug+'/" class="block bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 mb-2">'+s.title+'</a>'; }).join(''); }
      if (venues.length) { html += '<h2 class="font-display text-xl mb-2 mt-4">Venues</h2>' + venues.map(function(v){ return '<a href="${u('/venues/')}'+v.slug+'/" class="block bg-mp-surface hover:bg-mp-surface2 rounded-lg px-4 py-3 border border-mp-surface2 mb-2">'+v.name+', '+v.city+'</a>'; }).join(''); }
      out.innerHTML = html || '<p class="text-mp-muted text-sm">Sin resultados para "'+q+'".</p>';
    });
  })();
  </script>`,
}));

// ---------- 404 ----------
fs.writeFileSync(path.join(OUT, '404.html'), layout({
  title: 'No encontrado', active: '',
  content: `<h1 class="font-display text-3xl mb-4">404 — No encontrado</h1><p class="text-mp-muted"><a href="${u('/')}" class="text-mp-accent hover:underline">Volver al inicio</a></p>`,
}));

// ---------- data.json (para el buscador y otros usos) ----------
fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify({ shows, songs, venues: VENUES, tags: TAGS }, null, 2));

// ---------- feed.xml (RSS estático simple) ----------
{
  const items = shows.slice().reverse().slice(0, 20).map(s => `
  <item>
    <title>${fmtDateShort(s.date)} - ${s.venue.name}, ${s.venue.city}</title>
    <link>https://matildepizarro.github.io${u('/shows/' + s.slug + '/')}</link>
    <guid>https://matildepizarro.github.io${u('/shows/' + s.slug + '/')}</guid>
    <description>${(s.notes || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</description>
    <pubDate>${new Date(s.date).toUTCString()}</pubDate>
  </item>`).join('');
  fs.writeFileSync(path.join(OUT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${SITE.name}</title>
  <description>${SITE.description}</description>
  <link>https://matildepizarro.github.io${BASE}/</link>
  ${items}
</channel></rss>`);
}

console.log(`Sitio generado en ${OUT}`);
console.log(`${shows.length} shows, ${songs.length} canciones, ${VENUES.length} venues, ${TAGS.length} etiquetas.`);
