import { WebGLPass } from './webgl.js'
import { locate } from '../timeline/sample.js'
import { drawFrame } from './painter.js'
import type { Film } from '../scene/types.js'
export interface CanvasRuntime {
  init(film: Film, assets: Record<string,string>): Promise<void>
  frame(index: number): string
}
declare global {interface Window {motion: CanvasRuntime}}
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d', {alpha:false})!
let world: WebGLPass | undefined
let film: Film
const images = new Map<string, HTMLImageElement>()

window.motion = {
  async init(spec, assets) {
    film = spec
    canvas.width = spec.width; canvas.height = spec.height
    world?.dispose()
    world = spec.engine==='three' ? new WebGLPass(spec.width,spec.height,assets) : undefined
    images.clear()
    for (const [id,src] of Object.entries(assets)) {
      if (spec.assets?.[id].endsWith('.obj')) continue
      const img = new Image()
      img.src = src
      await img.decode().catch(() => {throw new Error('Cannot decode image asset ' + id)})
      images.set(id,img)
    }
  },
  frame(index) {
    const shot=locate(film,index)
    drawFrame(ctx,film,images,index,world?.draw(shot.scene,shot.frame))
    return canvas.toDataURL('image/png').split(',')[1]
  }
}
