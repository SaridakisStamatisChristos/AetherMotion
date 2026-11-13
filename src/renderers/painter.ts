import type { Film, Drawable, Point } from '../scene/types.js'
import { cameraMatrix, locate, sample } from '../timeline/sample.js'

/** Stroke a prefix by arc length, including a partial final segment. */
function stroke(ctx: CanvasRenderingContext2D, points: Point[], fraction: number) {
  let length = 0
  for (let i=1;i<points.length;i++) length += Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1])
  let remaining = length*fraction
  ctx.beginPath()
  ctx.moveTo(...points[0])
  for (let i=1;i<points.length && remaining>0;i++) {
    const [x,y] = points[i-1], dx = points[i][0]-x, dy = points[i][1]-y
    const segment = Math.hypot(dx,dy)
    if (!segment) continue
    const k = Math.min(1,remaining/segment)
    ctx.lineTo(x+dx*k,y+dy*k)
    remaining -= segment
  }
  ctx.stroke()
}
function paint(ctx: CanvasRenderingContext2D, images: ReadonlyMap<string,CanvasImageSource>, o: Drawable, t: number) {
  ctx.save()
  ctx.translate(sample(o.x,t,0),sample(o.y,t,0))
  ctx.rotate(sample(o.rotation,t,0)*Math.PI/180)
  const scale = sample(o.scale,t,1)
  ctx.scale(scale,scale)
  ctx.globalAlpha = sample(o.opacity,t,1)
  if ('color' in o) ctx.fillStyle = ctx.strokeStyle = o.color
  switch (o.kind) {
    case 'rect': ctx.fillRect(0,0,o.width,o.height); break
    case 'circle':
      ctx.beginPath(); ctx.arc(0,0,o.radius,0,Math.PI*2); ctx.fill(); break
    case 'path':
      ctx.lineWidth = o.stroke; ctx.lineJoin = ctx.lineCap = 'round'
      stroke(ctx,o.points,sample(o.reveal,t,1)); break
    case 'text':
      ctx.font = (o.bold?'bold ':'') + o.size + 'px ' + ({serif:'Georgia, serif',mono:'monospace',sans:'Arial, sans-serif'}[o.face ?? 'sans'])
      ctx.fillText(o.text,0,0); break
    case 'image': ctx.drawImage(images.get(o.asset)!,0,0,o.width,o.height); break
  }
  ctx.restore()
}
/** Paint one complete frame into a Canvas 2D context. */
export function drawFrame(ctx: CanvasRenderingContext2D, film: Film, images: ReadonlyMap<string,CanvasImageSource>, index: number) {
    const {scene,frame} = locate(film,index)
    ctx.resetTransform()
    ctx.fillStyle = scene.background
    ctx.fillRect(0,0,film.width,film.height)
    const {zoom,dx,dy} = cameraMatrix(scene.camera,frame)
    ctx.setTransform(zoom,0,0,zoom,dx,dy)
    for (const o of scene.objects) paint(ctx,images,o,frame)
}
