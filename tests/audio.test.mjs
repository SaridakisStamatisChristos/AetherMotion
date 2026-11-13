import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile,mkdtemp,rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { parseFilm } from '../dist/scene/validate.js'
import { prepareAudio } from '../dist/audio/produce.js'
import { render } from '../dist/renderers/render.js'
import { subtitles } from '../dist/audio/subtitles.js'
const signal=JSON.parse(await readFile('examples/signal.json','utf8'))
test('timed captions and measured audio reject overlap, escape and truncated narration',async()=>{
  const film=parseFilm(signal)
  assert.match(subtitles(film),/00:00:00,000 --> 00:00:03,000/)
  assert.equal((await prepareAudio(film,'examples')).length,4)
  const mutate=fn=>{const f=structuredClone(film);fn(f.audio);return f}
  assert.throws(()=>parseFilm(mutate(a=>a.push({...a[0]}))),/overlap/)
  assert.throws(()=>parseFilm(mutate(a=>a[0].endFrame=999)),/interval/)
  await assert.rejects(prepareAudio(mutate(a=>a[0].endFrame=1),'examples'),/extend/)
  await assert.rejects(prepareAudio(mutate(a=>a[0].file='../signal.wav'),'examples'),/relative/)
})
test('portrait mix has silence before the cue and an audible delayed effect',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'motion-audio-'));t.after(()=>rm(dir,{recursive:true,force:true}))
  const file=join(dir,'mix.mp4')
  const f={version:'0.1',engine:'canvas2d',width:64,height:96,fps:24,durationFrames:24,
    scenes:[{id:'bg',frames:24,background:'#153245',objects:[]}],
    audio:[{role:'effect',file:'audio/bell.wav',startFrame:12,endFrame:24,gain:1,caption:'Ring'}]}
  const report=await render(f,'examples',file,{backend:'native'})
  assert.equal(report.audioCodec,'aac')
  const pcm=execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-ac','1','-f','s16le','-'])
  function peak(start,end) {
    let n=0; for(let i=start;i<end;i++) n=Math.max(n,Math.abs(pcm.readInt16LE(i*2)))
    return n
  }
  assert.ok(peak(0,20000)<16);assert.ok(peak(25000,27000)>500)
})
