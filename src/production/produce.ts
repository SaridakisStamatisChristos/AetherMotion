import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFilm } from '../scene/validate.js'
import { localAsset } from '../scene/assets.js'
import { render, type RenderOptions } from '../renderers/render.js'
import { subtitles } from '../audio/subtitles.js'
import { timeSpeech } from './timing.js'
const run=promisify(execFile)
export interface ProductionOptions extends RenderOptions {model?:string; voices?:string; python?:string; voice?:string}
async function exists(path:string) {
  try {await lstat(path);return true} catch(error) {if((error as NodeJS.ErrnoException).code==='ENOENT') return false;throw error}
}

/** Publish a self-contained film directory after all synthesis and media verification succeeds. */
export async function produce(file:string, output:string, options:ProductionOptions={}) {
  const source=await realpath(dirname(resolve(file)))
  const film=parseFilm(JSON.parse(await readFile(file,'utf8')))
  const dest=resolve(output)
  await mkdir(dirname(dest),{recursive:true})
  const lock=dest+'.produce-lock'
  await mkdir(lock).catch(error=>{if(error.code==='EEXIST') throw new Error('Another production holds '+lock);throw error})
  let tmp=''
  try {
    if(await exists(dest)) throw new Error('Output already exists: '+dest)
    tmp=await mkdtemp(join(dirname(dest),'.aether-production-'))
    await mkdir(join(tmp,'assets'))
    for(const [id,path] of Object.entries(film.assets ?? {})) {
      const rel='assets/'+id+extname(path)
      await copyFile(await localAsset(source,path,id),join(tmp,rel))
      film.assets![id]=rel
    }
    const cues=film.audio ?? []
    const jobs:{text:string;output:string}[]=[]
    for(const [i,cue] of cues.entries()) {
      const rel='clip-'+(i+1)+'.wav'
      if(cue.file.startsWith('/') || cue.file.split('/').includes('..')) throw new Error('Expected a local audio path: '+cue.file)
      if(await exists(join(source,cue.file))) await copyFile(await localAsset(source,cue.file,'audio/'+i),join(tmp,rel))
      else if(cue.role==='narration' && cue.caption?.trim()) jobs.push({text:cue.caption,output:join(tmp,rel)})
      else throw new Error('Missing audio file '+cue.file+'; speech synthesis needs a narration caption')
      cue.file=rel
    }
    if(jobs.length) {
      if(!options.model || !options.voices) throw new Error('Missing narration WAVs: set KOKORO_MODEL and KOKORO_VOICES, or provide the clips')
      const manifest=join(tmp,'speech-jobs.json')
      await writeFile(manifest,JSON.stringify(jobs))
      const script=fileURLToPath(new URL('../../scripts/narrate.py',import.meta.url))
      await run(options.python ?? 'python3',[script,'--model',options.model,'--voices',options.voices,'--voice',options.voice ?? 'af_heart','--jobs',manifest])
      await rm(manifest)
    }
    const lengths=new Map<number,number>()
    for(const [i,cue] of cues.entries()) if(cue.role==='narration') {
      const info=await run('ffprobe',['-v','error','-f','wav','-show_entries','stream=duration','-of','csv=p=0',join(tmp,cue.file)])
      lengths.set(i,Number(info.stdout.trim()))
    }
    const timed=timeSpeech(film,lengths)
    await writeFile(join(tmp,'film.json'),JSON.stringify(timed,null,2)+'\n')
    const captions=subtitles(timed)
    if(captions) await writeFile(join(tmp,'captions.srt'),captions)
    const media=await render(timed,tmp,join(tmp,'film.mp4'),options)
    const report={input:basename(file),requestedFrames:film.durationFrames,actualFrames:timed.durationFrames,
      synthesizedClips:jobs.length,speech:[...lengths].map(([index,seconds])=>({index,seconds,...timed.audio![index]})),media}
    await writeFile(join(tmp,'report.json'),JSON.stringify(report,null,2)+'\n')
    await rename(tmp,dest)
    tmp=''
    return report
  } finally {
    if(tmp) await rm(tmp,{recursive:true,force:true})
    await rm(lock,{recursive:true,force:true})
  }
}
