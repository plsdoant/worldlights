import { GlobeControl, GPUInitializationError, MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import { basemapStyle } from './basemap.ts'
import { ViewControl } from './controls.ts'
import { ReadoutControl } from './readout.ts'
import { GlobeSpin } from './spin.ts'
import { drawStarfield } from './starfield.ts'

setWorkerUrl(workerUrl)

// Tilt the northern hemisphere, where most people (and most lights) are, toward the viewer.
const HOME_LATITUDE = 20
const FIELD_OF_VIEW = 36.87 // MapLibre's default vertical field of view, in degrees

const container = document.querySelector<HTMLDivElement>('#map')!
drawStarfield(document.querySelector<HTMLCanvasElement>('#stars')!)

try {
  createGlobe()
} catch (error) {
  if (!(error instanceof GPUInitializationError)) throw error
  showFatalError('This globe needs WebGL 2, which isn’t available in this browser.')
}

function createGlobe(): void {
  const map = new MapLibreMap({
    container,
    style: basemapStyle,
    // Start facing the viewer's own side of the planet: each hour of UTC offset ≈ 15° of longitude.
    center: [-new Date().getTimezoneOffset() / 4, HOME_LATITUDE],
    zoom: globeFitZoom(),
    maxZoom: 18,
    hash: 'map',
    attributionControl: { compact: true },
    canvasContextAttributes: { antialias: true }, // smooth edge where the globe meets space
  })

  const spin = new GlobeSpin(map)
  spin.enabled = !matchMedia('(prefers-reduced-motion: reduce)').matches

  const resetView = () =>
    map.flyTo({ center: [map.getCenter().lng, HOME_LATITUDE], zoom: globeFitZoom(), bearing: 0, pitch: 0 })

  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
  map.addControl(new GlobeControl(), 'top-right')
  map.addControl(new ViewControl(spin, resetView), 'top-right')
  map.addControl(new ReadoutControl(), 'bottom-left')
  map.addControl(new ScaleControl({ maxWidth: 96 }), 'bottom-left')

  if (import.meta.env.DEV) Object.assign(window, { map }) // handy for poking at the map from devtools
}

/**
 * The zoom at which the globe's outline spans `fraction` of the viewport's shorter side.
 * MapLibre sizes the globe as radius = worldSize / 2π / cos(lat), where worldSize = 512 · 2^zoom,
 * but the camera's perspective makes the visible outline smaller than that radius, so solve
 * for the radius that produces the outline we want first.
 */
function globeFitZoom(fraction = 0.8): number {
  const { clientWidth: width, clientHeight: height } = container
  if (!width || !height) return 2 // not laid out yet (e.g. opened in a hidden frame)
  const outline = (fraction * Math.min(width, height)) / 2
  const cameraDistance = height / 2 / Math.tan((FIELD_OF_VIEW * Math.PI) / 360)
  const radius = (outline ** 2 + outline * Math.hypot(outline, cameraDistance)) / cameraDistance
  return Math.log2((2 * Math.PI * radius * Math.cos((HOME_LATITUDE * Math.PI) / 180)) / 512)
}

function showFatalError(message: string): void {
  const el = document.createElement('p')
  el.className = 'fatal'
  el.textContent = message
  document.body.append(el)
}
