import { mixAudio, prepareAudio } from '../audio/produce.js'
import { openPool, type Backend } from './workers.js'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, stat, link } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { loadAssets } from '../scene/assets.js'
import { parseFilm } from '../scene/validate.js'
import { verify } from './verify.js'
import type {} from './browser.js'

export interface RenderOptions {workers?: number; batch?: number; backend?: Backend}
/** Render inert input and atomically publish an independently decoded MP4. */
export async function render(input: unknown, directory: string, output: string, options: RenderOptions = {}) {
  const film = parseFilm(input), file = resolve(output)
  const workers = options.workers ?? 1, batch = options.batch ?? 2
  if (![workers,batch].every(v => Number.isInteger(v) && v>=1 && v<=8)) throw new Error('workers and batch must be integers from 1 to 8')
  if (existsSync(file)) throw new Error('Output already exists: '+file)
  const start = performance.now()
  const assets = await loadAssets(film,directory)
  const audio = film.audio ? await prepareAudio(film,directory) : []
  const backend = options.backend ?? 'chromium'
  if (backend!=='chromium' && backend!=='native') throw new Error('Expected chromium or native backend')
  await mkdir(dirname(file),{recursive:true})
  const temp = await mkdtemp(join(dirname(file),'.aethermotion-'))
  const silent = join(temp,'silent.mp4')
  const partial = audio.length ? join(temp,'mixed.mp4') : silent
  try {
    const pool = await openPool(backend,Math.min(workers,film.durationFrames),film,assets)
    try {
      const ff = spawn('ffmpeg',['-hide_banner','-v','error','-f','image2pipe','-c:v','png','-framerate',String(film.fps),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',silent],{stdio:['pipe','ignore','inherit']})
      const exit = new Promise<void>((ok,fail) => {
        ff.once('error',fail)
        ff.once('close',code => code===0 ? ok() : fail(new Error('FFmpeg exited with code '+code)))
      })
      async function* frames() {
        const stride = pool.lanes.length * batch
        for (let start=0;start<film.durationFrames;start+=stride) {
          const groups = await Promise.all(pool.lanes.map((lane,i) => {
            const first = start+i*batch
            return lane(first,Math.min(first+batch,film.durationFrames))
          }))
          for (const group of groups) yield* group
        }
      }
      try { await Promise.all([exit,pipeline(frames(),ff.stdin)]) }
      finally { if (ff.exitCode===null) ff.kill() }
    } finally {await pool.close()}
    if(audio.length) await mixAudio(film,audio,silent,partial)
    const report = await verify(film,partial)
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(partial)) hash.update(chunk)
    const bytes = (await stat(partial)).size
    await link(partial,file) // Atomic no-clobber, even with concurrent publishers.
    return {...report,bytes,sha256:hash.digest('hex'),elapsedSeconds:(performance.now()-start)/1000,
      peakNodeRssKiB:process.resourceUsage().maxRSS,workers,batch,backend}
  } finally {await rm(temp,{recursive:true,force:true})}
}
