# Matilde Pizarro Tapes — versión estática (GitHub Pages)

Este es un sitio **100% estático** (puro HTML/CSS/JS), pensado para vivir directo en GitHub Pages,
en `https://matildepizarro.github.io/archivo/`.

No necesita servidor, ni base de datos, ni `npm install`. El "generador" (`build.js`) usa solo Node.js puro.

## Cómo publicarlo (primera vez)

1. En tu repo `archivo` en GitHub, borra lo que subiste antes (el proyecto Node/Express no sirve acá).
2. Copia el contenido de la carpeta `docs/` de este zip a la raíz de tu repo `archivo` (o sube todo el proyecto,
   ver estructura abajo — lo importante es que la carpeta `docs/` termine en tu repo).
3. En GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   rama `main`, carpeta `/docs`. Guarda.
4. Espera 1–2 minutos y entra a `https://matildepizarro.github.io/archivo/`.

## Cómo actualizar el contenido (agregar un show, una fecha, etc.)

Todo el contenido del sitio vive en **`data.js`** — es el único archivo que necesitas editar normalmente.

1. Abre `data.js` con cualquier editor de texto.
2. Agrega/edita venues, shows, fechas, tags, canciones, etc. (hay ejemplos ya cargados, sigue el mismo formato).
3. Corre en la terminal, parado en esta carpeta:
   ```
   node build.js
   ```
   Esto regenera todo dentro de `docs/`.
4. Sube los cambios a GitHub (`git add . && git commit -m "nuevo show" && git push`). GitHub Pages se actualiza solo.

## Cómo subir audio de un show

1. Pon los archivos `.mp3` dentro de `docs/public/audio/<slug-del-show>/` (el slug es el nombre de la carpeta
   que generó `build.js` en `docs/shows/`, por ejemplo `2026-06-18-hotzenplotz-valparaiso`).
2. En `data.js`, busca ese show y agrégale un arreglo `tracks`, por ejemplo:
   ```js
   tracks: [
     { title: 'OCELO', file: '01-ocelo.mp3' },
     { title: 'OCASO CIRCULAR', file: '02-ocaso-circular.mp3' },
   ]
   ```
3. Corre `node build.js` de nuevo y sube los cambios.

## Estructura

```
data.js        <- EDITA ESTE ARCHIVO para agregar contenido
build.js       <- generador (no lo necesitas tocar)
public/        <- imágenes, CSS y JS (Howler.js para el reproductor, Dexie para favoritos)
docs/          <- salida generada (esto es lo que se sube/lee GitHub Pages)
```

## Qué SÍ funciona (100% en el navegador, sin servidor)

- Shows, setlists, venues, canciones, años, fechas — todo pre-generado como HTML.
- **Etiquetas de show** (Acústico, Festival, DJ, Rave, etc.) con sus propias páginas.
- **Pistas destacadas** (jams 20+min, curadas, votadas) en `/notables/`.
- Buscador (`/search/`) — filtra en el navegador usando `data.json`.
- Favoritos (`/favourites/`) — se guardan en el navegador de cada visitante (IndexedDB), sin cuenta.
- Reproductor de audio (Howler.js) si subes mp3s.

## Qué NO funciona igual que la versión con servidor (porque GitHub Pages no ejecuta código)

- No hay panel de administración con login para subir shows desde el celular — hay que editar `data.js` a mano
  y correr `node build.js`.
- No hay calificación de shows en vivo (con votos guardados en base de datos) — "Top Shows" queda como listado
  simple por ahora.
- Si algún día quieres esas dos cosas funcionando con backend real, te puedo armar el deploy en Render o Railway
  del proyecto Node/Express que ya tienes (ese sí necesita un hosting que ejecute Node, GitHub Pages no sirve para eso).
