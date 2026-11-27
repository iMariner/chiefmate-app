# Chief Mate Study app

A mobile-first, offline version of the orals guide and the MCA digital written guide. No PDFs and no backend. Content is generated from the existing sources.

## Layout

- `app/`: the app (open `index.html`, or host the folder over https)
  - `index.html`, `styles.css`, `app.js`: screens and styling
  - `content.js`: generated content (do not edit by hand)
  - `sw.js`, `manifest.json`, `icon.svg`: offline cache and home-screen install
- `source/build_content.py`: rebuilds `app/content.js` from `chief-mate-orals/source/data.py` and `mca-digital-guide/source/guide.html`

## Rebuild after editing content

    python3 source/build_content.py

Then change `CACHE` in `app/sw.js` (for example `chiefmate-app-v2`) so phones pick up the new version.

## Put it on a phone

- Host the `app/` folder on any https server (GitHub Pages, or Webyne). Open the link in Chrome on Android and choose "Install app" or "Add to Home screen".
- Or package it as an Android APK with Microsoft's PWABuilder (no Android Studio needed).
