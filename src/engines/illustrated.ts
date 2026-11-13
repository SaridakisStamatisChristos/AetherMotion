import type { Drawable } from '../scene/types.js'
import { sample } from '../timeline/sample.js'
import { gait } from './cartoon.js'

type Actor = Extract<Drawable,{kind:'actor'}>
/** Shaded profile rig. The origin is the same ground anchor used by the classic actor. */
export function illustratedActor(ctx:CanvasRenderingContext2D, o:Actor, frame:number) {
  const stride=sample(o.stride,frame,0), phase=sample(o.phase,frame,0)
  const gesture=sample(o.gesture,frame,0), mouth=sample(o.mouth,frame,0)
  const legs=gait(phase,stride)
  const swing=stride*.4*Math.cos(phase*Math.PI*2)
  const factor=o.height/161
  ctx.scale(factor*(o.facing==='left'?-1:1),factor)
  ctx.translate(0,-67)
  ctx.lineCap=ctx.lineJoin='round'
  function line(points:number[][],color:string,width:number) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1])
    for(const [x,y] of points.slice(1)) ctx.lineTo(x,y)
    ctx.stroke()
  }
  function oval(x:number,y:number,rx:number,ry:number,color:string) {
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()
  }
  function limb(points:number[][],color:string,width:number) {
    line(points,color,width)
    line(points.map(([x,y])=>[x-1.5,y]),'#FFFFFF18',width*.25)
  }
  for(const [i,leg] of legs.entries()) {
    const offset=i===0?-5:5
    limb([[offset,-1],[leg.knee[0]+offset,leg.knee[1]],[leg.foot[0]+offset,leg.foot[1]-3]],o.trousers,11)
    ctx.save();ctx.translate(leg.foot[0]+offset,leg.foot[1]-3)
    ctx.fillStyle=o.shoes;ctx.beginPath();ctx.moveTo(-5,0);ctx.bezierCurveTo(-6,9,-3,9,3,9)
    ctx.lineTo(14,9);ctx.bezierCurveTo(17,3,8,2,5,-1);ctx.closePath();ctx.fill()
    line([[-3,8],[13,8]],'#F4DFC078',1.3);ctx.restore()
  }
  limb([[-11,-36],[-19-swing,-19],[-16-swing,-2]],o.shirt,11)
  oval(-16-swing,-1,4.2,5,o.skin)
  // Coat silhouette, shaded side, lapel and seam.
  ctx.fillStyle=o.shirt;ctx.beginPath();ctx.moveTo(-9,-48)
  ctx.bezierCurveTo(-19,-43,-15,-22,-18,4)
  ctx.bezierCurveTo(-4,9,10,8,18,3)
  ctx.bezierCurveTo(13,-20,17,-41,8,-47);ctx.closePath();ctx.fill()
  ctx.fillStyle='#142B3F25';ctx.beginPath();ctx.moveTo(-12,-43)
  ctx.bezierCurveTo(-5,-29,-6,-6,-5,6);ctx.lineTo(-18,4)
  ctx.bezierCurveTo(-15,-22,-19,-43,-12,-43);ctx.fill()
  ctx.fillStyle='#FFFFFF28';ctx.beginPath();ctx.moveTo(3,-44);ctx.lineTo(10,-33)
  ctx.lineTo(8,-26);ctx.lineTo(0,-39);ctx.closePath();ctx.fill()
  line([[4,-27],[5,1]],'#182D4028',.8)
  line([[-11,-8],[-5,-8]],'#F8E4C768',1)
  for(const y of [-18,-8]) oval(6,y,.9,.9,'#E6C59C')
  limb([[10,-37],[18+swing*.35+10*gesture,-22-15*gesture],
    [13+swing+40*gesture,-3-36*gesture]],o.shirt,10)
  oval(13+swing+40*gesture,-2-36*gesture,4,5,o.skin)
  // Neck, ear and shaped face retain the clothing palette supplied by the scene.
  line([[1,-45],[1,-58]],o.skin,10)
  ctx.fillStyle=o.skin;ctx.beginPath();ctx.moveTo(-12,-79)
  ctx.bezierCurveTo(-5,-94,15,-91,18,-77)
  ctx.lineTo(19,-70);ctx.lineTo(24,-65);ctx.lineTo(19,-63)
  ctx.bezierCurveTo(20,-50,6,-48,-2,-56)
  ctx.bezierCurveTo(-12,-61,-16,-70,-12,-79);ctx.fill()
  ctx.fillStyle='#B65E4725';ctx.beginPath();ctx.moveTo(-7,-75)
  ctx.bezierCurveTo(-6,-58,1,-57,6,-54);ctx.bezierCurveTo(-7,-53,-16,-65,-7,-75);ctx.fill()
  oval(-5,-68,4,5,o.skin)
  line([[-6,-69],[-4,-67]],'#A15F4B75',.9)
  ctx.fillStyle=o.hair;ctx.beginPath();ctx.moveTo(-9,-61)
  ctx.bezierCurveTo(-24,-69,-19,-91,-3,-94)
  ctx.bezierCurveTo(10,-98,24,-88,19,-79)
  ctx.bezierCurveTo(10,-74,7,-85,-2,-82)
  ctx.lineTo(-3,-69);ctx.lineTo(-7,-71);ctx.closePath();ctx.fill()
  line([[-11,-81],[-7,-87],[2,-89]],'#FFFFFF20',1.3)
  const brow=o.expression==='concerned'?2:o.expression==='curious'?-2:0
  line([[11,-76],[17,-76+brow]],o.hair,1.4)
  oval(15,-71,1.3,1.7,o.shoes)
  oval(15.4,-71.5,.4,.5,'#FFFFFF')
  if(mouth>.06) oval(17,-57,2,1+mouth*2.8,o.shoes)
  else {
    ctx.strokeStyle='#854D46';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(13,-57)
    ctx.quadraticCurveTo(17,-55,20,o.expression==='happy'?-58:-57);ctx.stroke()
  }
}
