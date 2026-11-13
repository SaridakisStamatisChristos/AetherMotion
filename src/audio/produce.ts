import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { open, realpath } from 'node:fs/promises'
import type { Film } from '../scene/types.js'
import { localAsset } from '../scene/assets.js'
const run=promisify(execFile)
const rate=48000

/** Resolve PCM WAV inputs once. Narration must fit its assigned interval in full. */
export async function prepareAudio(film:Film,directory:string) {
  const root=await realpath(directory)
  const cache=new Map<string,number>()
  const paths:string[]=[]
  for(const [i,cue] of (film.audio ?? []).entries()) {
    const path=await localAsset(root,cue.file,'audio/'+i)
    let duration=cache.get(path)
    if(duration===undefined) {
      const file=await open(path,'r')
      try {
        const info=await file.stat()
        if(!info.isFile() || info.size>128*1024**2) throw new Error(cue.file+': invalid WAV size')
        const header=Buffer.alloc(12)
        await file.read(header,0,12,0)
        if(header.toString('ascii',0,4)!=='RIFF' || header.toString('ascii',8)!=='WAVE')
          throw new Error(cue.file+': expected RIFF/WAVE PCM audio')
      } finally {await file.close()}
      const probe=await run('ffprobe',['-v','error','-f','wav','-show_streams','-of','json',path])
      const [s]=JSON.parse(probe.stdout).streams
      duration=Number(s?.duration)
      if(!s?.codec_name.startsWith('pcm_') || !Number.isFinite(duration) || duration<=0)
        throw new Error(cue.file+': expected a measurable PCM audio stream')
      cache.set(path,duration)
    }
    if(cue.role==='narration' && duration>(cue.endFrame-cue.startFrame)/film.fps+1/rate)
      throw new Error('Narration '+cue.file+' lasts '+duration+'s; extend audio/'+i+' or shorten its text')
    paths.push(path)
  }
  return paths
}

/** Mix to a sample-accurate film-length stereo bed and copy the existing video. */
export async function mixAudio(film:Film, paths:string[], video:string, output:string) {
  const samples=(frame:number)=>Math.round(frame*rate/film.fps)
  const length=samples(film.durationFrames)
  const args=['-nostdin','-v','error','-xerror','-i',video]
  for(const path of paths) args.push('-f','wav','-i',path)
  const filters=film.audio!.map((cue,i)=>{
    const start=samples(cue.startFrame), count=samples(cue.endFrame)-start
    return '['+(i+1)+':a]aresample=48000,aformat=channel_layouts=stereo,atrim=end_sample='+count+
      ',asetpts=PTS-STARTPTS,volume='+(cue.gain ?? 1)+',adelay='+start+'S:all=1[c'+i+']'
  })
  const channels=paths.map((_,i)=>'[c'+i+']').join('')
  filters.push(channels+'amix=inputs='+paths.length+':normalize=0,alimiter=level=false:latency=true,apad,atrim=end_sample='+length+'[mixed]')
  await run('ffmpeg',[...args,'-filter_complex',filters.join(';'),'-map','0:v:0','-map','[mixed]',
    '-c:v','copy','-c:a','aac','-ar','48000','-ac','2','-b:a','128k','-movflags','+faststart',output])
}
