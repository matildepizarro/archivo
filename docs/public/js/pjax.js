// Navegación sin recargar la página completa.
// El reproductor de audio vive en el <footer> (fuera de <main>). En un sitio
// estático normal, cada clic en un link recarga la página entera y el
// <audio> muere — por eso la música se cortaba al navegar. Acá interceptamos
// los clics en links internos, traemos el HTML de la página destino por
// fetch, y solo reemplazamos <header> y <main>. El footer/reproductor nunca
// se destruye, así que el audio sigue sonando mientras se navega el sitio.
(function () {
  const BASE = window.MP_BASE_PATH || '';

  function isInternalLink(a) {
    if (!a || !a.href) return false;
    if (a.hasAttribute('download')) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    let url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    if (BASE && url.pathname.indexOf(BASE) !== 0) return false;
    return true;
  }

  function rerunScripts(container) {
    container.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      for (const attr of old.attributes) s.setAttribute(attr.name, attr.value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  async function swap(url, push) {
    let html;
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) { location.href = url; return; }
      html = await res.text();
    } catch (e) { location.href = url; return; }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newHeader = doc.querySelector('header');
    const newMain = doc.querySelector('main');
    const curHeader = document.querySelector('header');
    const curMain = document.querySelector('main');
    if (!newMain || !curMain) { location.href = url; return; }

    document.title = doc.title;
    if (newHeader && curHeader) curHeader.outerHTML = newHeader.outerHTML;
    curMain.innerHTML = newMain.innerHTML;
    rerunScripts(document.querySelector('main'));

    if (push) history.pushState({ mp: true }, '', url);
    window.scrollTo(0, 0);

    if (window.MPInitArchivePlayer) window.MPInitArchivePlayer();
    if (window.MPInitFavourites) window.MPInitFavourites();
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isInternalLink(a)) return;
    const url = new URL(a.href, location.href);
    // deja que los anchors dentro de la misma página (ej. #jams) se comporten normal
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    e.preventDefault();
    if (url.href === location.href) return;
    swap(a.href, true);
  });

  // formulario de búsqueda (GET a /search/?q=...) también debe navegar sin recargar
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.method.toLowerCase() !== 'get') return;
    let url;
    try { url = new URL(form.action, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    url.search = params.toString();
    swap(url.href, true);
  });

  window.addEventListener('popstate', () => { swap(location.href, false); });
})();
