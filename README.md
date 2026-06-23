# AmazFlash Plugin — Extensión Chrome

Extensión de navegador que muestra las **mejores ofertas verificadas de AmazFlash** en un popup, con filtro por nichos configurable.

## Funciones

- **Popup**: últimas ofertas según tus nichos (5 iniciales + «Cargar más» de 5 en 5)
- **Recargar**: vuelve a descargar el feed JSON desde amazflash.com
- **Opciones**: activar/desactivar nichos (tecnología, gaming, hogar, moda, etc.)
- **Enlaces**: clics trackeados con `?f=e&from=amazflash-extension` en URLs amazflash.com

## Requisitos

- Google Chrome o Chromium (Manifest V3)
- Feed público en `https://amazflash.com/offers-feed.json` (generado por el pipeline web de AmazFlash)

## Instalación en desarrollo

1. Generar iconos (solo la primera vez):

   ```bash
   python3 scripts/generate_icons.py
   ```

2. Chrome → `chrome://extensions` → **Modo desarrollador** → **Cargar descomprimida**
3. Seleccionar la carpeta raíz de este repo (donde está `manifest.json`)

## Configuración

Clic derecho en el icono → **Opciones**, o botón ⚙ en el popup.

Por defecto están activos: generales, tecnología, gaming PC, PS5, Switch y hogar.

## Estructura

```
manifest.json
icons/
src/
  lib/          niches, filtros, API, storage
  popup/        ventana del plugin
  options/      página de configuración
scripts/
  generate_icons.py
```

## Feed de datos

La extensión consume el mismo JSON que la web (`ofertas.json`), publicado como:

`https://amazflash.com/offers-feed.json`

El script `web/scripts/refresh_ofertas.sh` del repo **amazflash** copia el feed a `web/public/offers-feed.json` en cada refresh.

## Publicar en Chrome Web Store

1. Empaquetar: `chrome://extensions` → **Empaquetar extensión**
2. Subir el `.zip` en [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Licencia

Proyecto personal Korpres / AmazFlash.
