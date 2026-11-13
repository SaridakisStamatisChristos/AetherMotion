import { drawFrame } from './painter.js'
import type { Film } from '../scene/types.js'
export interface CanvasRuntime {
  init(film: Film, assets: Record<string,string>): Promise<void>
  frame(index: number): string
}
declare global {interface Window {motion: CanvasRuntime}}
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d', {alpha:false})!
let film: Film
const images = new Map<string, HTMLImageElement>()

window.motion = {
  async init(spec, assets) {
    film = spec
    canvas.width = spec.width; canvas.height = spec.height
    images.clear()
    for (const [id,src] of Object.entries(assets)) {
      const img = new Image()
      img.src = src
      await img.decode().catch(() => {throw new Error('Cannot decode image asset ' + id)})
      images.set(id,img)
    }
  },
  frame(index) {
    drawFrame(ctx,film,images,index)
    return canvas.toDataURL('image/png').split(',')[1]
  }
}
