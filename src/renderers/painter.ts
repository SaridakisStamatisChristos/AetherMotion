import { drawCaption } from '../audio/subtitles.js'
import type { Film, Drawable, Shot } from '../scene/types.js'
import { cameraMatrix, locate, sample } from '../timeline/sample.js'

import { arrow, letters, measure, write, type Ink } from '../engines/whiteboard.js'
import { actor } from '../engines/cartoon.js'
import { bars, milestones } from '../engines/infographic.js'
const cache = new WeakMap<Drawable,Ink>()
function strokes(o: Extract<Drawable,{kind:'path'|'arrow'|'handwriting'}>) {
  let ink = cache.get(o)
  if (!ink) {
    const paths = o.kind==='path' ? [o.points] : o.kind==='arrow' ? arrow(o.dx,o.dy,o.head) : letters(o.text,o.size)
    ink = measure(paths)
    cache.set(o,ink)
  }
  return ink
}
function paint(ctx: CanvasRenderingContext2D, images: ReadonlyMap<string,CanvasImageSource>, o: Drawable, t: number, style: Shot['style']) {
  ctx.save()
  ctx.translate(sample(o.x,t,0),sample(o.y,t,0))
  ctx.rotate(sample(o.rotation,t,0)*Math.PI/180)
  const scale = sample(o.scale,t,1)
  ctx.scale(scale,scale)
  ctx.globalAlpha *= sample(o.opacity,t,1)
  const ink = style?.ink ?? '#193038'
  ctx.fillStyle = ctx.strokeStyle = ('color' in o && o.color) || style?.accent || (style?.name==='whiteboard' ? '#235577' : '#007C79')
  switch (o.kind) {
    case 'shape': {
      ctx.beginPath()
      for (const command of o.commands) {
        switch (command.op) {
          case 'move': ctx.moveTo(command.x,command.y); break
          case 'line': ctx.lineTo(command.x,command.y); break
          case 'cubic': ctx.bezierCurveTo(command.x1,command.y1,command.x2,command.y2,command.x,command.y); break
          case 'close': ctx.closePath(); break
        }
      }
      if (o.shadow) {
        ctx.shadowColor=o.shadow.color
        ctx.shadowBlur=o.shadow.blur
        ctx.shadowOffsetX=o.shadow.x
        ctx.shadowOffsetY=o.shadow.y
      }
      if (o.fill) {
        if (typeof o.fill==='string') ctx.fillStyle=o.fill
        else {
          const gradient=ctx.createLinearGradient(...o.fill.from,...o.fill.to)
          for (const stop of o.fill.stops) gradient.addColorStop(stop.at,stop.color)
          ctx.fillStyle=gradient
        }
        ctx.fill()
      }
      if (o.outline) {
        ctx.strokeStyle=o.outline.color
        ctx.lineWidth=o.outline.width
        ctx.lineJoin=ctx.lineCap='round'
        ctx.stroke()
      }
      break
    }
    case 'group':
      for(const child of o.children) paint(ctx,images,child,t,style)
      break
    case 'polygon':
      ctx.beginPath();ctx.moveTo(...o.points[0])
      for(let i=1;i<o.points.length;i++) ctx.lineTo(...o.points[i])
      ctx.closePath();ctx.fill();break
    case 'glow': {
      const gradient=ctx.createRadialGradient(0,0,0,0,0,o.radius)
      gradient.addColorStop(0,o.color);gradient.addColorStop(1,o.color+'00')
      ctx.fillStyle=gradient
      ctx.fillRect(-o.radius,-o.radius,2*o.radius,2*o.radius)
      break
    }
    case 'rect': ctx.fillRect(0,0,o.width,o.height); break
    case 'circle':
      ctx.beginPath(); ctx.arc(0,0,o.radius,0,Math.PI*2); ctx.fill(); break
    case 'arrow':
    case 'handwriting':
    case 'path':
      ctx.lineWidth = o.kind==='path' ? o.stroke : style?.penWidth ?? 3; ctx.lineJoin = ctx.lineCap = 'round'
      write(ctx,strokes(o),sample(o.reveal,t,1)); break
    case 'bars':
      bars(ctx,o.data,o.width,o.height,o.ceiling,sample(o.reveal,t,1),ink,o.size); break
    case 'milestones':
      milestones(ctx,o.labels,o.width,sample(o.reveal,t,1),ink,o.size); break
    case 'actor': actor(ctx,o,t); break
    case 'counter':
      ctx.font = 'bold '+o.size+'px monospace'
      ctx.fillText(sample(o.value,t,0).toFixed(o.decimals)+(o.suffix ?? ''),0,0); break
    case 'text':
      ctx.font = (o.bold?'bold ':'') + o.size + 'px ' + ({serif:'Georgia, serif',mono:'monospace',sans:'Arial, sans-serif'}[o.face ?? 'sans'])
      ctx.fillText(o.text,0,0); break
    case 'image': ctx.drawImage(images.get(o.asset)!,0,0,o.width,o.height); break
  }
  ctx.restore()
}
/** Paint one complete frame into a Canvas 2D context. */
export function drawFrame(ctx: CanvasRenderingContext2D, film: Film, images: ReadonlyMap<string,CanvasImageSource>, index: number, backdrop?: CanvasImageSource) {
    const {scene,frame} = locate(film,index)
    ctx.resetTransform()
    ctx.fillStyle = scene.background
    ctx.fillRect(0,0,film.width,film.height)
    if (backdrop) ctx.drawImage(backdrop,0,0)
    const {zoom,dx,dy} = cameraMatrix(scene.camera,frame)
    ctx.setTransform(zoom,0,0,zoom,dx,dy)
    for (const o of scene.objects) paint(ctx,images,o,frame,scene.style)
    if(scene.fade) {
      const fade=scene.fade
      const enter=fade.inFrames ? 1-frame/(fade.inFrames-1) : 0
      const exit=fade.outFrames ? 1-(scene.frames-1-frame)/(fade.outFrames-1) : 0
      ctx.save();ctx.resetTransform()
      ctx.globalAlpha=Math.max(0,enter,exit)
      ctx.fillStyle=fade.color;ctx.fillRect(0,0,film.width,film.height)
      ctx.restore()
    }
    drawCaption(ctx,film,index)
}
