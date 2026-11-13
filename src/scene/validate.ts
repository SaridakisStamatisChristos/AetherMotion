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
  const sceneIds = new Set<string>()
  for (const scene of input.scenes) {
    if (sceneIds.has(scene.id)) throw new Error('Duplicate scene id: ' + scene.id)
    sceneIds.add(scene.id)
    const ids = new Set<string>()
    for (const object of scene.objects) {
      if (ids.has(object.id)) throw new Error(scene.id + ': duplicate object ' + object.id)
      ids.add(object.id)
      if (object.kind==='bars' && object.data.some(d => d.value>object.ceiling))
        throw new Error(object.id + ': bar values must fit the chart ceiling')
      if ((object.kind==='handwriting' || object.kind==='arrow') && scene.style?.name!=='whiteboard')
        throw new Error(object.id + ': select whiteboard style for '+object.kind)
      if (['bars','counter','milestones'].includes(object.kind) && scene.style?.name!=='infographic')
        throw new Error(object.id + ': select infographic style for '+object.kind)
      if (object.kind === 'image' && !Object.hasOwn(input.assets ?? {}, object.asset))
        throw new Error(object.id + ': unknown image asset ' + object.asset)
    }
    for (const item of [...scene.objects, scene.camera ?? {}]) {
      for (const [property, value] of Object.entries(item)) {
        if (!Array.isArray(value) || typeof value[0]?.frame !== 'number') continue
        let previous = -1
        for (const key of value) {
          if (key.frame <= previous || key.frame >= scene.frames)
            throw new Error(scene.id + '/' + ('id' in item ? item.id : 'camera') + '/' + property + ': keys must increase within scene frames')
          previous = key.frame
        }
      }
    }
  }
  return input
}
