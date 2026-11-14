import type { Drawable } from '../scene/types.js'

type Actor = Extract<Drawable,{kind:'actor'}>

/** Coordinate travel and gait from absolute frame time, with eased starts and stops. */
export function travelPose(actor: Actor, frame: number) {
  const travel=actor.travel!
  const t=Math.max(0,Math.min(1,(frame-travel.startFrame)/(travel.endFrame-travel.startFrame)))
  const u=t*t*(3-2*t)
  const distance=travel.toX-travel.fromX
  const pixelsPerCycle=2*travel.stride/.6*actor.height/161
  const ramp=Math.max(0,Math.min(1,t/.1,(1-t)/.1))
  const activity=ramp*ramp*(3-2*ramp)
  return {
    x:travel.fromX+distance*u,
    y:travel.ground,
    phase:Math.abs(distance)*u/pixelsPerCycle,
    stride:travel.stride*activity,
    facing:distance<0?'left' as const:'right' as const
  }
}
