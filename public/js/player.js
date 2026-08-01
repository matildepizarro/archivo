(function () {
  const STORAGE_KEY = 'mp_player_state_v1';
  let queue = [];
  let currentIndex = -1;
  let sound = null;
  let shuffleOn = false;

  const bar = document.getElementById('player-bar');
  const toggleBtn = document.getElementById('player-toggle');
  const titleEl = document.getElementById('player-title');
  const subtitleEl = document.getElementById('player-subtitle');
  const seekEl = document.getElementById('player-seek');
  const timeEl = document.getElementById('player-time');
  const speedEl = document.getElementById('player-speed');
  const prevBtn = document.getElementById('player-prev');
  const nextBtn = document.getElementById('player-next');
  const shuffleBtn = document.getElementById('player-shuffle');

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function saveState(playing) {
    const track = queue[currentIndex];
    if (!track) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      queue, currentIndex, position: sound ? sound.seek() : 0, playing, speed: speedEl.value,
    }));
  }

  function loadTrack(index, autoplay) {
    if (index < 0 || index >= queue.length) return;
    if (sound) { sound.unload(); }
    currentIndex = index;
    const track = queue[index];
    sound = new Howl({
      src: [track.src],
      html5: true,
      rate: parseFloat(speedEl.value),
      onplay: () => { toggleBtn.textContent = '⏸'; requestAnimationFrame(updateSeek); window.dispatchEvent(new CustomEvent('mp:playstate', { detail: { playing: true, index: currentIndex } })); },
      onpause: () => { toggleBtn.textContent = '▶'; window.dispatchEvent(new CustomEvent('mp:playstate', { detail: { playing: false, index: currentIndex } })); },
      onend: () => { playNext(); },
      onload: () => { seekEl.max = Math.floor(sound.duration()); },
    });
    titleEl.textContent = track.title;
    subtitleEl.textContent = track.subtitle || '';
    bar.classList.remove('hidden');
    if (autoplay) sound.play();
    saveState(autoplay);
    window.dispatchEvent(new CustomEvent('mp:track', { detail: { index, track, queue } }));
  }

  function updateSeek() {
    if (!sound || !sound.playing()) return;
    const cur = sound.seek() || 0;
    seekEl.value = Math.floor(cur);
    timeEl.textContent = `${fmt(cur)} / ${fmt(sound.duration())}`;
    requestAnimationFrame(updateSeek);
  }

  function playNext() {
    if (queue.length === 0) return;
    let idx;
    if (shuffleOn) {
      idx = Math.floor(Math.random() * queue.length);
    } else {
      idx = (currentIndex + 1) % queue.length;
    }
    loadTrack(idx, true);
  }
  function playPrev() {
    if (queue.length === 0) return;
    const idx = (currentIndex - 1 + queue.length) % queue.length;
    loadTrack(idx, true);
  }

  toggleBtn?.addEventListener('click', () => {
    if (!sound) return;
    if (sound.playing()) { sound.pause(); saveState(false); }
    else { sound.play(); saveState(true); }
  });
  nextBtn?.addEventListener('click', playNext);
  prevBtn?.addEventListener('click', playPrev);
  shuffleBtn?.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    shuffleBtn.classList.toggle('text-mp-accent', shuffleOn);
  });
  seekEl?.addEventListener('input', () => {
    if (sound) sound.seek(parseInt(seekEl.value, 10));
  });
  speedEl?.addEventListener('change', () => {
    if (sound) sound.rate(parseFloat(speedEl.value));
    saveState(sound && sound.playing());
  });

  window.addEventListener('beforeunload', () => saveState(sound && sound.playing()));

  // Panel "⋯" de opciones secundarias (prev/velocidad/shuffle) en mobile.
  const moreBtn = document.getElementById('player-more');
  const morePanel = document.getElementById('player-more-panel');
  moreBtn?.addEventListener('click', () => {
    const open = morePanel.classList.toggle('mp-panel-open');
    moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // El alto de la barra puede cambiar (panel abierto/cerrado, texto largo
  // en mobile, orientación, etc.) — se mide en vivo para que el padding
  // inferior del body nunca se desincronice y tape u oculte contenido.
  if (bar && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--player-h', bar.offsetHeight + 'px');
    });
    ro.observe(bar);
  }

  // Public API used by show pages to build a queue and play a given track
  window.MPPlayer = {
    playQueue(tracks, startIndex) {
      queue = tracks;
      loadTrack(startIndex || 0, true);
    },
    addAndPlay(track) {
      queue = [track];
      loadTrack(0, true);
    },
  };

  // Resume last session (best effort; browsers block true cross-page audio continuity,
  // so we resume position/track rather than literally keep the same <audio> alive)
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.queue && saved.queue.length) {
      queue = saved.queue;
      speedEl.value = saved.speed || '1';
      loadTrack(saved.currentIndex || 0, false);
      if (sound) {
        sound.once('load', () => {
          sound.seek(saved.position || 0);
          seekEl.value = Math.floor(saved.position || 0);
        });
      }
    }
  } catch (e) { /* ignore */ }
})();
