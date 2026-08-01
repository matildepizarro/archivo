// Reproductor de grabaciones alojadas en archive.org, con el mismo look & feel
// que el resto del sitio (lista de pistas numerada, duración, fila resaltada
// mientras suena, botón de play grande). Los archivos de audio reales se
// obtienen en el navegador del usuario desde la API pública de archive.org
// (no requiere subir nada al repo).
(function () {
  function fmtTime(sec) {
    sec = Math.round(sec || 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = String(sec % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  // archive.org's `length` field is sometimes plain seconds ("177.34") and
  // sometimes a "MM:SS" / "H:MM:SS" string ("2:57") depending on the item —
  // parseFloat alone truncates at the colon and silently returns garbage.
  function toSeconds(length) {
    if (length == null) return 0;
    const str = String(length).trim();
    if (str.includes(':')) {
      return str.split(':').map(Number).reduce((acc, p) => acc * 60 + (isNaN(p) ? 0 : p), 0);
    }
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }

  // Limpia títulos de archivo tipo "03 - Fondo.mp3" -> "Fondo"
  function cleanTitle(name, metaTitle) {
    if (metaTitle && metaTitle.trim()) return metaTitle.trim();
    let t = name.replace(/\.[a-z0-9]+$/i, '');
    t = t.replace(/^[\d._\-\s]+/, ''); // saca números de pista al inicio
    t = t.replace(/[_]+/g, ' ').trim();
    return t || name;
  }

  function trackNumber(file, idx) {
    if (file.track) {
      const n = parseInt(String(file.track).split('/')[0], 10);
      if (!isNaN(n)) return n;
    }
    const m = file.name.match(/^0*(\d+)/);
    if (m) return parseInt(m[1], 10);
    return idx + 1;
  }

  async function loadPlayer(container) {
    const identifier = container.dataset.archive;
    const showTitle = container.dataset.title;
    const showSubtitle = container.dataset.subtitle;
    const cover = container.dataset.cover;
    const isPartial = container.dataset.partial === '1';
    let titleOverrides = [];
    try { titleOverrides = JSON.parse(container.dataset.trackTitles || '[]'); } catch (e) { /* ignore */ }

    let data;
    try {
      const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
      if (!res.ok) throw new Error('bad response');
      data = await res.json();
    } catch (e) {
      container.innerHTML = `<div class="p-4 text-sm text-mp-muted">No se pudo cargar la grabación en este momento. Puedes escucharla directo en <a class="text-mp-accent hover:underline" href="https://archive.org/details/${identifier}" target="_blank" rel="noopener">archive.org</a>.</div>`;
      return;
    }

    const files = (data.files || []).filter(f => /mp3$/i.test(f.name) && /mp3/i.test(f.format || ''));
    // preferir VBR MP3 sobre MP3 normal si hay duplicados por pista
    const byBase = {};
    files.forEach(f => {
      const base = f.name.replace(/\.[a-z0-9]+$/i, '');
      const isVbr = /vbr/i.test(f.format || '');
      if (!byBase[base] || (isVbr && !/vbr/i.test(byBase[base].format || ''))) byBase[base] = f;
    });
    let list = Object.values(byBase);
    list.forEach((f, i) => { f._track = trackNumber(f, i); });
    list.sort((a, b) => a._track - b._track || a.name.localeCompare(b.name));

    if (!list.length) {
      container.innerHTML = `<div class="p-4 text-sm text-mp-muted">Todavía no hay pistas de audio en este ítem. Escúchalo en <a class="text-mp-accent hover:underline" href="https://archive.org/details/${identifier}" target="_blank" rel="noopener">archive.org</a>.</div>`;
      return;
    }

    const baseUrl = `https://archive.org/download/${identifier}/`;
    const tracks = list.map((f, i) => ({
      src: baseUrl + encodeURIComponent(f.name),
      title: titleOverrides[i] || cleanTitle(f.name, f.title),
      subtitle: `${showTitle} · ${showSubtitle}`,
      duration: toSeconds(f.length),
    }));

    container.innerHTML = `
      <div class="flex items-center gap-4 px-6 py-5 border-b border-mp-surface2 bg-mp-surface2/40">
        <img src="${cover}" class="w-16 h-16 rounded-lg object-cover border border-mp-surface2 shrink-0" alt="">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-widest text-mp-muted">${isPartial ? 'Grabación parcial' : 'Grabación completa'}</p>
          <p class="font-display text-lg truncate">${showTitle}</p>
          <p class="text-mp-muted text-sm">${showSubtitle} · ${tracks.length} pista${tracks.length === 1 ? '' : 's'}${isPartial ? ' (única grabada de este show)' : ''}</p>
        </div>
        <button id="ia-play-all" class="ml-auto w-16 h-16 rounded-full bg-mp-accent text-mp-bg flex items-center justify-center hover:opacity-90 transition text-2xl shrink-0" title="Reproducir todo">▶</button>
      </div>
      <div id="ia-tracklist">
        ${tracks.map((t, i) => `
          <button data-idx="${i}" class="ia-row w-full flex items-center justify-between gap-4 px-6 py-4 text-lg hover:bg-mp-surface2 transition text-left border-b border-mp-surface2/60 last:border-b-0">
            <span class="flex items-center gap-4 min-w-0">
              <span class="ia-row-num text-mp-muted w-7 text-right shrink-0 text-base">${i + 1}</span>
              <span class="ia-row-title truncate font-medium">${t.title}</span>
            </span>
            <span class="text-mp-muted text-sm shrink-0">${t.duration ? fmtTime(t.duration) : ''}</span>
          </button>`).join('')}
      </div>`;

    const rows = container.querySelectorAll('.ia-row');
    function highlight(idx, playing) {
      rows.forEach((row, i) => {
        row.classList.toggle('bg-mp-accent', i === idx);
        row.classList.toggle('text-mp-bg', i === idx);
        const num = row.querySelector('.ia-row-num');
        num.textContent = (i === idx && playing) ? '♪' : String(i + 1);
      });
    }

    rows.forEach((row, idx) => {
      row.addEventListener('click', () => {
        window.MPPlayer.playQueue(tracks, idx);
        highlight(idx, true);
      });
    });
    document.getElementById('ia-play-all').addEventListener('click', () => {
      window.MPPlayer.playQueue(tracks, 0);
      highlight(0, true);
    });

    // Mantiene la fila resaltada sincronizada con la barra inferior
    window.addEventListener('mp:track', (e) => {
      if (e.detail.queue === tracks) highlight(e.detail.index, true);
    });
    window.addEventListener('mp:playstate', (e) => {
      const active = container.querySelector('.ia-row.bg-mp-accent');
      if (!active) return;
      const idx = parseInt(active.dataset.idx, 10);
      if (idx === e.detail.index) highlight(idx, e.detail.playing);
    });
  }

  function init() {
    const containers = document.querySelectorAll('#ia-player:not([data-mp-inited])');
    containers.forEach(c => { c.setAttribute('data-mp-inited', '1'); loadPlayer(c); });
  }

  window.MPInitArchivePlayer = init;
  init();
})();
