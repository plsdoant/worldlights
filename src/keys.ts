import type { MapLibreMap } from 'maplibre-gl'

// Physical key → the key code MapLibre already handles. Matching on `code` (the key's position)
// keeps the WASD cluster in the same place on AZERTY and other layouts.
const EQUIVALENT_KEY_CODES: Record<string, number> = {
  KeyW: 38, // ↑
  KeyA: 37, // ←
  KeyS: 40, // ↓
  KeyD: 39, // →
  KeyQ: 189, // − (zoom out)
  KeyE: 187, // + (zoom in)
}

/**
 * W/A/S/D move the map like the arrow keys (with Shift they rotate and tilt), and Q/E zoom out
 * and in like − and +. Each press goes to MapLibre's own keyboard handler as the equivalent key,
 * so step sizes and easing match the built-in keys exactly.
 */
export function addWasdControls(map: MapLibreMap): void {
  map.getCanvasContainer().addEventListener('keydown', (e) => {
    const keyCode = EQUIVALENT_KEY_CODES[e.code]
    // Leave browser shortcuts such as ⌘W and ⌘Q alone.
    if (keyCode === undefined || e.altKey || e.ctrlKey || e.metaKey || !map.keyboard.isEnabled()) return
    map.keyboard.keydown(new KeyboardEvent('keydown', { keyCode, shiftKey: e.shiftKey }))?.cameraAnimation(map)
  })
}
