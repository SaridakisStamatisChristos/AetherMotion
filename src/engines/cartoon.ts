import { illustratedActor } from './illustrated.js'
import { sample } from '../timeline/sample.js'
import type { Drawable } from '../scene/types.js'

type Actor = Extract<Drawable,{kind:'actor'}>
type Joint = [number,number]
/** A phase measured in turns allows independent control of walking and travel. */
export function gait(phase:number, stride:number) {
  const angle = phase * Math.PI * 2
  const lift = (leg:number) => stride*Math.max(0,Math.sin(angle+leg*Math.PI))
  return [0,1].map((leg) => {
    const reach = stride === 0 ? 0 : stride*Math.cos(angle+leg*Math.PI)
    return {knee:[reach*.56+7,31-lift(leg)*.26] as Joint, foot:[reach,58-lift(leg)*.52] as Joint}
  })
}
export function actor(ctx:CanvasRenderingContext2D, o:Actor, frame:number, drawHeld?:()=>void) {
  if(o.design==='illustrated') return illustratedActor(ctx,o,frame,drawHeld)
  const factor=o.height/152, phase=sample(o.phase,frame,0), stride=sample(o.stride,frame,0)
  const direction=o.facing==='left'?-1:1
  ctx.scale(factor*direction,factor)
  // Object origin is the ground point between the feet.
  ctx.translate(0,-58)
  ctx.lineCap=ctx.lineJoin='round'
  function limb(points:Joint[],color:string,width:number) {
    ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(...points[0])
    for(const p of points.slice(1)) ctx.lineTo(...p)
    ctx.stroke()
  }
  function oval(x:number,y:number,rx:number,ry:number,color:string) {
    ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill()
  }
  const legs=gait(phase,stride)
  for (const leg of legs) {
    limb([[0,0],leg.knee,leg.foot],o.trousers,10)
    limb([leg.foot,[leg.foot[0]+8,leg.foot[1]]],o.shoes,7)
  }
  const swing = stride*.55*Math.cos(phase*Math.PI*2)
  limb([[-6,-40],[-13-swing,-24],[-13-swing,-10]],o.skin,7)
  limb([[0,-39],[0,-4]],o.shirt,26)
  const gesture=sample(o.gesture,frame,0)
  const hand:Joint=[11+swing+(45-swing)*gesture,-8-36*gesture]
  limb([[6,-40],[14+swing*.5+14*gesture,-24-17*gesture],hand],o.skin,8)
  oval(hand[0],hand[1],5,5,o.skin)
  oval(1,-68,19,23,o.skin)
  ctx.fillStyle=o.hair; ctx.beginPath(); ctx.ellipse(0,-74,19,17,0,Math.PI,Math.PI*2); ctx.fill()
  oval(10,-70,2.1,2.4,o.shoes)
  const brow=o.expression==='curious'?-4:o.expression==='concerned'?3:0
  limb([[6,-77],[13,-77+brow]],o.hair,2)
  const open=sample(o.mouth,frame,0)
  if(open>.06) oval(12,-58,4,1+open*4,o.shoes)
  else limb([[8,-59],[12,-58],[16,o.expression==='happy'?-61:-58]],o.shoes,1.7)
}
