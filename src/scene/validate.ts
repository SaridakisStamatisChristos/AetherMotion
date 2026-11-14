import { Ajv } from 'ajv'
import { readFileSync } from 'node:fs'
import type { Film } from './types.js'

const schema = JSON.parse(readFileSync(new URL('../../schemas/scene-v0.1.json', import.meta.url), 'utf8'))
const validate = new Ajv({allErrors:true, ownProperties:true, discriminator:true}).compile<Film>(schema)

/** Validate the closed schema and timeline invariants, without mutating input. */
export function parseFilm(input: unknown): Film {
  if (!validate(input)) {
    throw new Error('Invalid scene JSON: ' + (validate.errors ?? []).slice(0,12)
      .map(e => (e.instancePath || '/') + ' ' + e.message + ' ' + JSON.stringify(e.params)).join('\n'))
  }
  if (input.scenes.reduce((n,s) => n+s.frames,0) !== input.durationFrames)
    throw new Error('/durationFrames must equal the sum of scene frames')
  if (input.engine==='canvas2d' && Object.values(input.assets ?? {}).some(path=>path.endsWith('.obj')))
    throw new Error('OBJ assets require the three engine')
  const sceneIds = new Set<string>()
  for (const scene of input.scenes) {
    if (sceneIds.has(scene.id)) throw new Error('Duplicate scene id: ' + scene.id)
    sceneIds.add(scene.id)
    if ((input.engine==='three') !== Boolean(scene.world)) throw new Error(scene.id+': three requires a world in every shot; canvas2d accepts only 2D shots')
    const ids = new Set<string>()
    if((scene.fade?.inFrames ?? 0)+(scene.fade?.outFrames ?? 0)>scene.frames)
      throw new Error(scene.id+': fades exceed the shot duration')
    const pending=scene.objects.map(object=>({object,depth:1}))
    while(pending.length) {
      const {object,depth}=pending.pop()!
      if(depth>12 || ids.size>=2048) throw new Error(scene.id+': maximum 12 levels and 2048 drawable objects per shot')
      if(object.kind==='group') for(const child of object.children) pending.push({object:child,depth:depth+1})
      if (ids.has(object.id)) throw new Error(scene.id + ': duplicate object ' + object.id)
      ids.add(object.id)
      if (object.kind==='shape') {
        if(object.commands[0].op!=='move') throw new Error(object.id+': shape must start with move')
        if(!object.fill && !object.outline) throw new Error(object.id+': shape needs fill or outline')
        if(object.fill && typeof object.fill!=='string') {
          if(object.fill.from[0]===object.fill.to[0] && object.fill.from[1]===object.fill.to[1])
            throw new Error(object.id+': gradient endpoints must differ')
          if(object.fill.stops.some((stop,i,stops)=>i>0 && stop.at<=stops[i-1].at))
            throw new Error(object.id+': gradient stops must increase')
        }
      }
      if(object.kind==='actor' && object.wave!==undefined && object.design!=='illustrated')
        throw new Error(object.id+': wave requires illustrated design')
      if (object.kind==='actor' && scene.style?.name!=='cartoon') throw new Error(object.id + ': select cartoon style for actor')
      if (object.kind==='bars' && object.data.some(d => d.value>object.ceiling))
        throw new Error(object.id + ': bar values must fit the chart ceiling')
      if ((object.kind==='handwriting' || object.kind==='arrow') && scene.style?.name!=='whiteboard')
        throw new Error(object.id + ': select whiteboard style for '+object.kind)
      if (['bars','counter','milestones'].includes(object.kind) && scene.style?.name!=='infographic')
        throw new Error(object.id + ': select infographic style for '+object.kind)
      if (object.kind === 'image' && (!Object.hasOwn(input.assets ?? {}, object.asset) || input.assets![object.asset].endsWith('.obj')))
        throw new Error(object.id + ': unknown image asset ' + object.asset)
    }
    if(scene.world) {
      for(const model of scene.world.models) {
        if(ids.has(model.id)) throw new Error(scene.id+': duplicate model or overlay '+model.id)
        ids.add(model.id)
        const shape=model.shape
        if(shape.kind==='obj' && (!Object.hasOwn(input.assets ?? {},shape.asset) || !input.assets![shape.asset].endsWith('.obj')))
          throw new Error(model.id+': expected declared local OBJ asset '+shape.asset)
        if(shape.kind==='cylinder' && shape.radiusTop===0 && shape.radiusBottom===0)
          throw new Error(model.id+': cylinder needs a nonzero radius')
      }
    }
    validateKeys(scene,scene.frames,scene.id)
  }
  const captions: NonNullable<Film['audio']> = []
  for (const [index,cue] of (input.audio ?? []).entries()) {
    if(cue.endFrame<=cue.startFrame || cue.endFrame>input.durationFrames)
      throw new Error('/audio/'+index+': expected a nonempty frame interval inside the film')
    if(cue.caption) captions.push(cue)
  }
  captions.sort((a,b)=>a.startFrame-b.startFrame)
  if(captions.some((cue,i)=>i>0 && cue.startFrame<captions[i-1].endFrame))
    throw new Error('/audio: caption intervals overlap')
  return input
}

function validateKeys(value:unknown, frames:number, path:string) {
  if(!value || typeof value!=='object') return
  if(Array.isArray(value) && typeof value[0]?.frame==='number') {
    let last=-1
    for(const key of value) {
      if(key.frame<=last || key.frame>=frames) throw new Error(path+': keys must increase within scene frames')
      last=key.frame
    }
  } else {
    for(const [name,child] of Object.entries(value)) validateKeys(child,frames,path+'/'+name)
  }
}
