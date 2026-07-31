(function () {
  const db = new Dexie('MatildePizarroTapes');
  db.version(1).stores({ favourites: 'slug, title, subtitle, addedAt' });
  window.MPFavourites = db;

  async function refreshButtons() {
    const buttons = document.querySelectorAll('[data-fav-slug]');
    for (const btn of buttons) {
      const slug = btn.getAttribute('data-fav-slug');
      const existing = await db.favourites.get(slug);
      btn.textContent = existing ? '★ En favoritos' : '☆ Agregar a favoritos';
      btn.classList.toggle('text-mp-accent2', !!existing);
    }
  }

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-fav-slug]');
    if (!btn) return;
    const slug = btn.getAttribute('data-fav-slug');
    const title = btn.getAttribute('data-fav-title');
    const subtitle = btn.getAttribute('data-fav-subtitle') || '';
    const existing = await db.favourites.get(slug);
    if (existing) {
      await db.favourites.delete(slug);
    } else {
      await db.favourites.add({ slug, title, subtitle, addedAt: Date.now() });
    }
    refreshButtons();
  });

  async function renderFavouritesList() {
    const container = document.getElementById('favourites-list');
    if (!container) return;
    const all = await db.favourites.orderBy('addedAt').reverse().toArray();
    if (all.length === 0) {
      container.innerHTML = '<p class="text-mp-muted">Todavía no tienes shows favoritos. Explora los shows y toca la estrella para guardarlos aquí (se guardan en tu navegador, sin necesidad de cuenta).</p>';
      return;
    }
    var base = (window.MP_BASE_PATH || '');
    container.innerHTML = all.map(f => `
      <a href="${base}/shows/${f.slug}/" class="block bg-mp-surface rounded-lg p-4 hover:bg-mp-surface2 transition mb-2">
        <div class="font-semibold">${f.title}</div>
        <div class="text-xs text-mp-muted">${f.subtitle}</div>
      </a>
    `).join('');
  }

  function init() {
    refreshButtons();
    renderFavouritesList();
  }
  window.MPInitFavourites = init;
  document.addEventListener('DOMContentLoaded', init);
})();
