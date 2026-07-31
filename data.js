// Todos los datos del sitio viven acá. Para actualizar el sitio:
// 1) edita este archivo (agrega un show, una canción, cambia una fecha, etc.)
// 2) corre:  node build.js
// 3) sube los cambios (git add, commit, push) — GitHub Pages se actualiza solo.

const SITE = {
  name: 'Matilde Pizarro Tapes',
  basePath: '/archivo',        // <-- cámbialo si algún día cambias el nombre del repo en GitHub
  description: 'Archivo no oficial de grabaciones en vivo de Matilde Pizarro.',
};

const VENUES = [
  { slug: 'maka-house-valparaiso', name: 'Maka House', city: 'Valparaíso', country: 'Chile' },
  { slug: 'la-sesion-cafe-villa-alemana', name: 'La Sesión Café', city: 'Villa Alemana', country: 'Chile', address: 'Buenos Aires 897' },
  { slug: 'cafe-journal-vina-del-mar', name: 'Café Journal', city: 'Viña del Mar', country: 'Chile' },
  { slug: 'bar-la-puerta-amarilla-santiago', name: 'Bar La Puerta Amarilla', city: 'Santiago', country: 'Chile' },
  { slug: 'hotzenplotz-valparaiso', name: 'Hotzenplotz', city: 'Valparaíso', country: 'Chile', address: 'Héctor Calvo 331, Cerro Bellavista' },
  { slug: 'plaza-sucre-vina-del-mar', name: 'Plaza Sucre', city: 'Viña del Mar', country: 'Chile' },
  { slug: 'cerveceria-popular-valparaiso', name: 'Cervecería Popular', city: 'Valparaíso', country: 'Chile' },
  { slug: 'el-pimenton-restaurant-valparaiso', name: 'El Pimentón Restaurant', city: 'Valparaíso', country: 'Chile' },
  { slug: 'cafe-misp-villa-alemana', name: 'Café Misp', city: 'Villa Alemana', country: 'Chile' },
  { slug: 'marcha-lgbt-vina-del-mar', name: 'Marcha LGBT', city: 'Viña del Mar', country: 'Chile' },
];

// Categorías fijas de "Etiquetas de show" (equivalentes a las de tapes.kglw.net, en español).
// Quedan siempre listadas en el menú aunque todavía no tengan shows asignados.
const TAGS = [
  { slug: 'acustico', name: 'Acústico' },
  { slug: 'show-de-cumpleanos', name: 'Show de cumpleaños' },
  { slug: 'dj', name: 'DJ' },
  { slug: 'festival', name: 'Festival' },
  { slug: 'maraton', name: 'Maratón' },
  { slug: 'banda-sonora-de-pelicula', name: 'Banda sonora de película' },
  { slug: 'orquesta', name: 'Orquesta' },
  { slug: 'sesion-de-radio', name: 'Sesión de radio' },
  { slug: 'rave', name: 'Rave' },
  { slug: 'aparicion-en-tv', name: 'Aparición en TV' },
  { slug: 'entrada-liberada', name: 'Entrada liberada' },
  { slug: 'evento-tributo', name: 'Evento tributo' },
  { slug: 'marcha', name: 'Marcha / evento comunitario' },
];

const ORIGINALS = ['LUNAR', 'VUELO', 'LLAMAS', 'OCELO', 'OCASO CIRCULAR', 'LOS CAMINOS', 'INCOGNITO', 'FONDO', 'EL FINAL', 'LETARGO', 'TEXTURAS', 'SOMOS IGUALES', 'ETERNIDAD', 'Theia', 'The Silver Cord', 'Sad Pilot'];
const COVERS = ['River of Deceit', 'Slowdive', '40 Days', 'Myth', 'Black Tooth', 'Mattel Special Projects Band – Big Band Beat'];
const SONGS = [...ORIGINALS, ...COVERS];

// Cada show: fecha, venue (slug de VENUES), notas, poster (imagen en public/images), etiquetas (slugs de TAGS),
// setlist (lista de títulos en orden) y pistas de audio (vacío hasta que subas archivos mp3 a public/audio/<slug-del-show>/).
const SHOWS = [
  {
    date: '2026-01-03', venue: 'cerveceria-popular-valparaiso', poster: null,
    notes: 'Matilde Pizarro en vivo, Cervecería Popular, Valparaíso.',
    tags: [], setlist: [], tracks: [],
  },
  {
    date: '2026-02-28', venue: 'maka-house-valparaiso', poster: 'GIZZDAY_3.png',
    notes: 'Set de Matilde Pizarro en el marco de Gizzday Vol. III, evento tributo a King Gizzard & The Lizard Wizard en Valparaíso.',
    tags: ['evento-tributo', 'festival'],
    setlist: ['Theia', 'The Silver Cord', 'Sad Pilot', 'LUNAR'],
    tracks: [],
  },
  {
    date: '2026-03-28', venue: 'la-sesion-cafe-villa-alemana', poster: 'LA_SESION_CAFE.jpg',
    notes: 'Show acústico, entrada liberada, 18:00 hrs. Cafetería La Sesión, Villa Alemana.',
    tags: ['acustico', 'entrada-liberada'],
    setlist: ['OCASO CIRCULAR', 'LOS CAMINOS', 'FONDO', 'LUNAR', 'LETARGO', 'Slowdive', '40 Days', 'Myth', 'EL FINAL'],
    tracks: [],
  },
  {
    date: '2026-05-20', venue: 'cafe-journal-vina-del-mar', poster: 'JOURNAL.jpeg',
    notes: 'Semillero del Rock en Journal Viña, junto a Jeshu y Cono Ramone. Entrada $1.000.',
    tags: [],
    setlist: ['LUNAR', 'LOS CAMINOS', 'INCOGNITO', 'OCELO', 'FONDO', 'TEXTURAS', 'OCASO CIRCULAR', 'VUELO', 'LLAMAS', 'EL FINAL'],
    tracks: [],
  },
  {
    date: '2026-05-30', venue: 'bar-la-puerta-amarilla-santiago', poster: null,
    notes: 'Bar La Puerta Amarilla, Santiago.',
    tags: [],
    setlist: ['Mattel Special Projects Band – Big Band Beat', 'OCELO', 'OCASO CIRCULAR', 'VUELO', 'LOS CAMINOS', 'LUNAR', 'INCOGNITO', 'FONDO', 'EL FINAL', 'LLAMAS', 'TEXTURAS', 'Black Tooth'],
    tracks: [],
  },
  {
    date: '2026-06-18', venue: 'hotzenplotz-valparaiso', poster: 'HOTZENPLOTZ.jpeg',
    notes: 'Matilde Pizarro en vivo, Hotzenplotz Bar & Restaurant, 21:00 hrs.',
    tags: [],
    setlist: ['OCELO', 'OCASO CIRCULAR', 'VUELO', 'LOS CAMINOS', 'LUNAR', 'INCOGNITO', 'River of Deceit', 'FONDO', 'EL FINAL', 'LETARGO', 'LLAMAS'],
    tracks: [],
  },
  {
    date: '2026-06-27', venue: 'marcha-lgbt-vina-del-mar', poster: null,
    notes: 'Marcha LGBT, Viña del Mar.',
    tags: ['marcha'],
    setlist: ['LUNAR', 'VUELO', 'LLAMAS'],
    tracks: [],
  },
  {
    date: '2026-08-14', venue: 'cafe-misp-villa-alemana', poster: null,
    notes: 'Matilde Pizarro en vivo, Café Misp, Villa Alemana.',
    tags: [], setlist: [], tracks: [],
  },
  {
    date: '2026-08-15', venue: 'el-pimenton-restaurant-valparaiso', poster: null,
    notes: 'Matilde Pizarro en vivo, El Pimentón Restaurant, Valparaíso.',
    tags: [], setlist: [], tracks: [],
  },
];

// Videos oficiales (para /about y /notables)
const VIDEOS = [
  { title: 'TEXTURAS (Lyric Video)', url: 'https://youtu.be/xlsTwHgWxio' },
  { title: 'VUELO (Lyric Video)', url: 'https://youtu.be/Q4lnRH8x3vU' },
  { title: 'Semillero del Rock | Journal, Viña del Mar (En vivo 21/05/26)', url: 'https://youtu.be/IBmaB0Gpflw' },
  { title: 'Black Tooth (King Gizzard & The Lizard Wizard Cover) | LPA, Santiago (En vivo 30/05/26)', url: 'https://www.youtube.com/watch?v=maMwQp_qxC8' },
];

const RELEASES = [
  { title: 'TEXTURAS (Single)', date: '2026-04-10' },
  { title: 'VUELO (Single)', date: '2026-04-10' },
  { title: 'SOMOS IGUALES (Single)', date: '2026-07-24' },
  { title: 'ETERNIDAD (Single)', date: '2026-07-24' },
  { title: 'Primer disco (8 canciones)', date: '2026-10-23' },
];

const PRESS = [
  { title: 'Ritmo Culto — "Matilde Pizarro: Texturas y Vuelo, los singles que abren una nueva etapa"', url: 'https://ritmoculto.cl/blogs/noticias/matilde-pizarro-texturas-y-vuelo-los-singles-que-abren-una-nueva-etapa' },
];

const LINKS = {
  spotify: 'https://open.spotify.com/intl-es/artist/61uAvgWnuDMNYrj2gpKxrg',
  appleMusic: 'https://music.apple.com/cl/artist/matilde-pizarro/1893449309',
  instagram: 'https://www.instagram.com/matildepizarro_/',
  youtube: 'https://www.youtube.com/@canalmatildepizarro',
  bandcamp: 'https://matildepizarro.bandcamp.com/album/texturas-vuelo',
  setlistfm: 'https://www.setlist.fm/setlists/matilde-pizarro-7b868e54.html',
  whatsapp: 'https://wa.me/56971710225',
  email: 'matildepizarrotoro@gmail.com',
};

module.exports = { SITE, VENUES, TAGS, SONGS, SHOWS, VIDEOS, RELEASES, PRESS, LINKS };
