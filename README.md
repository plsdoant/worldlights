# worldlights

A minimal, dark 3D globe for exploring where the world's light pollution is.

This first step is the Earth model: spin, zoom and tilt it like Google Maps, from the whole planet down to street level. NASA night-lights data comes next.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` writes a static site to `dist/`, and `npm run preview` serves it.

## Using the globe

| Action | How |
| --- | --- |
| Spin / pan | Drag |
| Zoom | Scroll, pinch, double-click, or the `+` / `−` buttons |
| Rotate and tilt | Right-drag or Ctrl-drag (two-finger drag on touch) |
| Keyboard | Arrow keys pan, Shift + arrows rotate and tilt |

The buttons at the top right are zoom, compass (click to face north and flatten the tilt), globe ⇄ flat map, reset view, and auto-rotate. The globe turns slowly when the page loads and stops as soon as you touch it.

The URL keeps the current view (`#map=zoom/lat/lng/bearing/pitch`), so any view can be bookmarked or shared.

## How it's built

- [MapLibre GL JS](https://maplibre.org/) v6 and its globe projection, which zooms smoothly from the globe into a flat street map. It needs WebGL 2.
- Basemap tiles from [OpenFreeMap](https://openfreemap.org/) (OpenMapTiles schema, OpenStreetMap data). They're free and need no API key. The dark style itself is ours, in `src/basemap.ts`.
- Vite and TypeScript, no UI framework.

```
src/
  main.ts        creates the map, its controls and the starting view
  basemap.ts     the map style: palette, layers, labels, atmosphere
  spin.ts        slow auto-rotation while zoomed out
  controls.ts    reset-view and auto-rotate buttons
  readout.ts     cursor coordinates and zoom level
  starfield.ts   background stars
  style.css      page and control styling
```

## Adding data

Data layers go between the basemap and its labels. Pass `firstLabelLayerId` from `basemap.ts` as the `beforeId` when adding a layer:

```ts
map.addLayer(lightPollutionLayer, firstLabelLayerId)
```

In dev builds the map is also available as `window.map` for experimenting from the browser console.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Tiles by [OpenFreeMap](https://openfreemap.org/), using the [OpenMapTiles](https://openmaptiles.org/) schema.
