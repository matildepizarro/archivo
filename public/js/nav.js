// Menú de navegación mobile (hamburguesa). Usa delegación de eventos sobre
// `document` en vez de bindear el botón directamente, porque pjax.js
// reemplaza el <header> entero (outerHTML) en cada navegación interna —
// un listener puesto directo sobre el botón viejo dejaría de existir.
(function () {
  function closeMenu() {
    const links = document.getElementById('nav-links');
    const toggle = document.getElementById('nav-toggle');
    if (links) links.classList.remove('mp-nav-open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '☰'; }
  }

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('#nav-toggle');
    if (toggle) {
      const links = document.getElementById('nav-links');
      if (!links) return;
      const open = links.classList.toggle('mp-nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
      return;
    }
    // Cerrar el menú al tocar un link de navegación (no los <summary> de
    // los desplegables, que deben poder abrirse sin cerrar todo el menú).
    if (e.target.closest('#nav-links a')) closeMenu();
  });

  // Si el usuario rota el teléfono o agranda la ventana hasta el
  // breakpoint de escritorio, el menú debe volver a su estado "cerrado"
  // por defecto para no quedar en un estado inconsistente.
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMenu();
  });
})();
