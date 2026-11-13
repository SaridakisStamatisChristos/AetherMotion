import type { Camera, Film, Scalar } from '../scene/types.js'

/** Sample a scalar at a local frame. The starting key controls each segment. */
export function sample(track: Scalar | undefined, frame: number, fallback: number): number {
  if (track === undefined) return fallback
  if (typeof track === 'number') return track
  if (frame <= track[0].frame) return track[0].value
  for (let i = 1; i < track.length; i++) {
    const left = track[i-1], right = track[i]
    if (frame >= right.frame) continue
    const u = (frame - left.frame) / (right.frame - left.frame)
    const weight = left.ease === 'hold' ? 0 : left.ease === 'smooth' ? u*u*(3-2*u) : u
    return left.value + (right.value - left.value) * weight
  }
  return track[track.length-1].value
}

/** Scenes occupy adjacent half-open frame intervals. */
export function locate(film: Film, frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= film.durationFrames)
    throw new RangeError('Frame outside film: ' + frame)
  for (const scene of film.scenes) {
    if (frame < scene.frames) return {scene, frame}
    frame -= scene.frames
  }
  throw new Error('Scene lengths do not cover durationFrames')
}

/** Screen = world * zoom + translation, with pan expressed in world pixels. */
export function cameraMatrix(camera: Camera | undefined, frame: number) {
  const zoom = sample(camera?.zoom, frame, 1)
  return {zoom, dx: -sample(camera?.x, frame, 0)*zoom, dy: -sample(camera?.y, frame, 0)*zoom}
}
