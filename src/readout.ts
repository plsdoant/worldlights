import type { IControl, LngLat, MapLibreMap, MapMouseEvent, Point } from 'maplibre-gl'

/**
 * A small coordinate readout: the location under the cursor while it's over the globe,
 * otherwise the map centre, plus the current zoom level.
 */
export class ReadoutControl implements IControl {
  #el = document.createElement('div')
  #map?: MapLibreMap
  #pointer: Point | null = null

  onAdd(map: MapLibreMap): HTMLElement {
    this.#map = map
    this.#el.className = 'maplibregl-ctrl readout'
    map.on('mousemove', this.#onMouseMove)
    map.on('mouseout', this.#onMouseOut)
    map.on('move', this.#render)
    this.#render()
    return this.#el
  }

  onRemove(): void {
    this.#map?.off('mousemove', this.#onMouseMove)
    this.#map?.off('mouseout', this.#onMouseOut)
    this.#map?.off('move', this.#render)
    this.#el.remove()
  }

  #onMouseMove = (e: MapMouseEvent) => {
    this.#pointer = e.point
    this.#render()
  }

  #onMouseOut = () => {
    this.#pointer = null
    this.#render()
  }

  #render = () => {
    const map = this.#map
    if (!map) return
    const zoom = map.getZoom()
    const at = ((this.#pointer && lngLatOnGlobe(map, this.#pointer)) ?? map.getCenter()).wrap()
    const digits = zoom < 3 ? 1 : zoom < 6 ? 2 : zoom < 10 ? 3 : 4
    this.#el.textContent = `${formatDegrees(at.lat, 'N', 'S', digits)}  ${formatDegrees(at.lng, 'E', 'W', digits)}   z ${zoom.toFixed(1)}`
  }
}

/** The location under a screen point, or null when the point is out in space beside the globe. */
function lngLatOnGlobe(map: MapLibreMap, point: Point): LngLat | null {
  const lngLat = map.unproject(point)
  const roundTrip = map.project(lngLat)
  return Math.hypot(roundTrip.x - point.x, roundTrip.y - point.y) < 1 ? lngLat : null
}

function formatDegrees(value: number, positive: string, negative: string, digits: number): string {
  return `${Math.abs(value).toFixed(digits)}° ${value >= 0 ? positive : negative}`
}
