import { parseFilm } from '../scene/validate.js'
import type { Film } from '../scene/types.js'

/** Extend a shot when its measured speech needs more time, and re-time its animation. */
export function timeSpeech(original:Film, lengths:Map<number,number>) {
  const film=structuredClone(original)
  const starts:number[]=[0], revised:number[]=[0]
  for(const shot of film.scenes) starts.push(starts.at(-1)!+shot.frames)
  const cues=film.audio ?? []
  const needed=film.scenes.map(s=>s.frames)
  for(const [i,seconds] of lengths) {
    if(!Number.isFinite(seconds)||seconds<=0) throw new Error('Invalid speech duration')
    const cue=cues[i]
    const shot=starts.findIndex((start,j)=>j<needed.length && start<=cue.startFrame && cue.startFrame<starts[j+1])
    if(shot<0 || cue.endFrame>starts[shot+1]) throw new Error('Production narration must belong to one shot')
    if([...lengths.keys()].some(j=>j!==i && cues[j].startFrame>=starts[shot] && cues[j].startFrame<starts[shot+1]))
      throw new Error('Use one narration cue per shot when producing a measured timeline')
    needed[shot]=Math.max(needed[shot],cue.startFrame-starts[shot]+Math.ceil(seconds*film.fps))
  }
  for(const [i,shot] of film.scenes.entries()) {
    const old=shot.frames, next=needed[i]
    if(old!==next) {
      const ratio=(next-1)/Math.max(1,old-1)
      stretchKeys(shot.objects,ratio);stretchKeys(shot.camera,ratio);stretchKeys(shot.world,ratio)
      shot.frames=next
    }
    revised.push(revised[i]+next)
  }
  function boundary(frame:number) {
    if(frame===original.durationFrames) return revised.at(-1)!
    const i=starts.findIndex((start,j)=>start<=frame && frame<starts[j+1])
    return revised[i]+Math.round((frame-starts[i])*needed[i]/original.scenes[i].frames)
  }
  cues.forEach((cue,i)=>{
    const speech=lengths.get(i)
    if(speech===undefined) {
      cue.endFrame=boundary(cue.endFrame);cue.startFrame=boundary(cue.startFrame)
    } else {
      const j=starts.findIndex((start,k)=>start<=cue.startFrame && cue.startFrame<starts[k+1])
      cue.startFrame+=revised[j]-starts[j]
      cue.endFrame=cue.startFrame+Math.ceil(speech*film.fps)
    }
  })
  film.durationFrames=revised.at(-1)!
  return parseFilm(film)
}
function stretchKeys(value:unknown,ratio:number) {
  if(!value || typeof value!=='object') return
  const travel=(value as {travel?:{startFrame:number;endFrame:number}}).travel
  if(travel) {
    travel.startFrame=Math.round(travel.startFrame*ratio)
    travel.endFrame=Math.round(travel.endFrame*ratio)
  }
  if(Array.isArray(value) && typeof value[0]?.frame==='number') {
    for(const key of value) key.frame=Math.round(key.frame*ratio)
  } else for(const child of Object.values(value)) stretchKeys(child,ratio)
}
