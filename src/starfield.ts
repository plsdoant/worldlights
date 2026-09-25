/**
 * Paints a faint, static starfield on a canvas behind the map. The map canvas is
 * transparent wherever the globe isn't, so the stars show through around it.
 */
export function drawStarfield(canvas: HTMLCanvasElement): void {
  const paint = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const { clientWidth: width, clientHeight: height } = canvas
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    ctx.scale(pixelRatio, pixelRatio)

    const random = seededRandom(1969) // same sky on every visit
    const count = Math.round((width * height) / 4000)
    for (let i = 0; i < count; i++) {
      const brightness = random() ** 3 // mostly faint, a few bright
      ctx.globalAlpha = 0.12 + brightness * 0.75
      ctx.fillStyle = random() < 0.12 ? '#ffe2b8' : '#dfe8ff'
      ctx.beginPath()
      ctx.arc(random() * width, random() * height, 0.35 + brightness * 0.85, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  paint()
  window.addEventListener('resize', paint)
}

/** mulberry32: a tiny seeded PRNG returning floats in [0, 1). */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
