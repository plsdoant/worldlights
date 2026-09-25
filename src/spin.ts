import type { MapLibreMap } from 'maplibre-gl'

const DEGREES_PER_SECOND = 360 / 150 // one lap every 2.5 minutes
const FULL_SPEED_BELOW_ZOOM = 3
const STOPPED_ABOVE_ZOOM = 5

/**
 * Slowly turns the globe eastward, like the real Earth, while zoomed out. It eases to a
 * stop as you zoom in, pauses during camera animations, and switches itself off as soon
 * as the user moves the map. Fires `change` whenever it is switched on or off.
 */
export class GlobeSpin extends EventTarget {
  #map: MapLibreMap
  #frame = 0
  #lastTime = 0

  constructor(map: MapLibreMap) {
    super()
    this.#map = map
    const stop = () => {
      this.enabled = false
    }
    // Stop on raw input, the moment the globe is grabbed or scrolled. MapLibre's movestart
    // isn't enough: jumpTo() cancels in-progress gestures, so a drag would never register
    // while we keep spinning, and scroll-zooms don't report an originalEvent.
    const canvas = map.getCanvasContainer()
    canvas.addEventListener('pointerdown', stop)
    canvas.addEventListener('wheel', stop, { passive: true })
    // Keyboard and the zoom/compass buttons move the map with an originalEvent attached;
    // our own jumpTo calls and flyTo don't.
    map.on('movestart', (e) => {
      if (e.originalEvent) stop()
    })
  }

  get enabled(): boolean {
    return this.#frame !== 0
  }

  set enabled(on: boolean) {
    if (on === this.enabled) return
    if (on) {
      this.#lastTime = performance.now()
      this.#frame = requestAnimationFrame(this.#tick)
    } else {
      cancelAnimationFrame(this.#frame)
      this.#frame = 0
    }
    this.dispatchEvent(new Event('change'))
  }

  #tick = (time: number) => {
    // Clamp so a backgrounded tab doesn't jump the globe when it becomes visible again.
    const seconds = Math.min(Math.max(time - this.#lastTime, 0) / 1000, 0.1)
    this.#lastTime = time
    this.#frame = requestAnimationFrame(this.#tick)

    const map = this.#map
    if (map.isMoving()) return

    const zoomFade = clamp01((STOPPED_ABOVE_ZOOM - map.getZoom()) / (STOPPED_ABOVE_ZOOM - FULL_SPEED_BELOW_ZOOM))
    if (zoomFade === 0) return

    const { lng, lat } = map.getCenter()
    map.jumpTo({ center: [lng - DEGREES_PER_SECOND * zoomFade * seconds, lat] })
  }
}

function clamp01(x: number): number {
  return Math.min(Math.max(x, 0), 1)
}
