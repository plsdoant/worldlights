import type { IControl } from 'maplibre-gl'
import type { GlobeSpin } from './spin.ts'

const ICON_HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v8.5h11V10"/></svg>'
const ICON_SPIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v3.8h-3.8"/></svg>'

/** Map buttons for flying back to the whole-globe view and toggling auto-rotation. */
export class ViewControl implements IControl {
  #container = document.createElement('div')
  #spin: GlobeSpin
  #onHome: () => void
  #syncSpinButton = () => {}

  constructor(spin: GlobeSpin, onHome: () => void) {
    this.#spin = spin
    this.#onHome = onHome
  }

  onAdd(): HTMLElement {
    const home = makeButton('Reset view', ICON_HOME, this.#onHome)
    const spin = makeButton('Auto-rotate', ICON_SPIN, () => {
      this.#spin.enabled = !this.#spin.enabled
    })
    this.#syncSpinButton = () => spin.setAttribute('aria-pressed', String(this.#spin.enabled))
    this.#syncSpinButton()
    this.#spin.addEventListener('change', this.#syncSpinButton)

    this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group view-ctrl'
    this.#container.append(home, spin)
    return this.#container
  }

  onRemove(): void {
    this.#spin.removeEventListener('change', this.#syncSpinButton)
    this.#container.remove()
  }
}

function makeButton(label: string, icon: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.innerHTML = icon
  button.addEventListener('click', onClick)
  return button
}
