import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp,readFile,rm,writeFile,readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createCanvas } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { drawFrame } from '../dist/renderers/painter.js'
import { timeSpeech } from '../dist/production/timing.js'
const read=async p=>JSON.parse(await readFile(p,'utf8'))
const example=await read('examples/eclipse.json')
test('nested poses compose and fade exactly at shot boundaries',()=>{
  const group={kind:'group',id:'root',x:5,y:4,scale:2,opacity:.5,children:[{
    kind:'polygon',id:'p',x:2,y:3,color:'#ffffff',points:[[0,0],[8,0],[8,8],[0,8]]}]}
  const shot={id:'s',frames:8,background:'#000000',objects:[group],fade:{color:'#990000',inFrames:2,outFrames:2}}
  const film=parseFilm({version:'0.1',engine:'canvas2d',width:32,height:32,fps:8,durationFrames:8,scenes:[shot]})
  const ctx=createCanvas(32,32).getContext('2d')
  function pixel(frame,x,y) {drawFrame(ctx,film,new Map(),frame);return Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3)}
  assert.deepEqual(pixel(0,15,12),[153,0,0])
  assert.ok(Math.abs(pixel(3,15,12)[0]-128)<=1)
  assert.deepEqual(pixel(3,5,8),[0,0,0]);assert.deepEqual(pixel(7,15,12),[153,0,0])
  assert.throws(()=>parseFilm({...film,scenes:[{...shot,objects:[group,group.children[0]]}]}),/duplicate/)
})
test('measured narration extends only the affected shot and maps effects and nested keys',()=>{
  const film=structuredClone(example)
  film.audio.push({role:'effect',file:'bell.wav',startFrame:252,endFrame:260})
  const timed=timeSpeech(film,new Map([[0,12],[1,4],[2,5]]))
  assert.equal(timed.durationFrames,780);assert.equal(timed.scenes[0].frames,300)
  assert.equal(timed.audio[1].startFrame,312);assert.equal(timed.audio[1].endFrame,408)
  assert.equal(timed.audio[3].startFrame,312)
  assert.equal(timed.scenes[0].objects.find(x=>x.id==='transit').x.at(-1).frame,299)
  assert.equal(film.durationFrames,720)
})
test('production CLI publishes a replayable bundle from existing clips and cleans failed work',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'motion-produce-'));t.after(()=>rm(dir,{recursive:true,force:true}))
  const out=join(dir,'release')
  function invoke(input,output) {return execFileSync(process.execPath,['dist/cli/main.js','produce',input,output,'--backend','native'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})}
  const report=JSON.parse(invoke('examples/signal.json',out))
  assert.equal(report.synthesizedClips,0);assert.equal(report.actualFrames,192)
  const film=await read(join(out,'film.json'));assert.equal(film.audio[0].endFrame,72)
  assert.equal((await readdir(out)).includes('captions.srt'),true)
  assert.throws(()=>invoke('examples/signal.json',out),/already exists/)
  film.audio[0].file='absent.wav';film.audio[0].role='effect'
  await writeFile(join(dir,'broken.json'),JSON.stringify(film))
  assert.throws(()=>invoke(join(dir,'broken.json'),join(dir,'failure')),/Missing audio/)
  assert.deepEqual((await readdir(dir)).sort(),['broken.json','release'])
})
