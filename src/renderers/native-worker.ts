import { parentPort, workerData } from 'node:worker_threads'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Film } from '../scene/types.js'
import { drawFrame } from './painter.js'
const { film, assets } = workerData as {film: Film; assets: Record<string,string>}
const canvas = createCanvas(film.width,film.height)
// The painter uses only Canvas 2D methods shared by Skia and Chromium.
const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
const images = new Map<string,CanvasImageSource>()
for (const [id,src] of Object.entries(assets)) {
  const image = await loadImage(Buffer.from(src.slice(src.indexOf(',')+1),'base64'))
    .catch(() => {throw new Error('Cannot decode image asset '+id)})
  images.set(id,image as unknown as CanvasImageSource)
}
parentPort!.on('message', ([start,end]: [number,number]) => {
  const frames = []
  for(let index=start;index<end;index++) {
    drawFrame(ctx,film,images,index)
    frames.push(canvas.toBuffer('image/png'))
  }
  parentPort!.postMessage(frames)
})
parentPort!.postMessage('ready')
