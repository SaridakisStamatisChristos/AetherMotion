import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { render } from '../dist/renderers/render.js'
import { verify } from '../dist/renderers/verify.js'
import { createCanvas } from '@napi-rs/canvas'
test('render and decode portrait, compare parallel schedules, reject invalid media', async t => {
  const dir=await mkdtemp(join(tmpdir(),'aether-e2e-'))
  t.after(()=>rm(dir,{recursive:true,force:true}))
  const canvas=createCanvas(4,4), g=canvas.getContext('2d')
  g.fillStyle='orange'; g.fillRect(0,0,4,4)
  await writeFile(join(dir,'star.png'),canvas.toBuffer('image/png'))
  const film={version:'0.1',engine:'canvas2d',width:64,height:96,fps:12,durationFrames:13,assets:{star:'star.png'},
    scenes:[{id:'s',background:'#10202f',frames:13,objects:[{id:'a',kind:'image',asset:'star',width:20,height:24,x:[{frame:0,value:0},{frame:12,value:42}]}]}]}
  const backend=process.env.TEST_BACKEND || 'native'
  const f=join(dir,'a.mp4')
  const a=await render(film,dir,f,{backend,workers:1,batch:1})
  const b=await render(film,dir,join(dir,'b.mp4'),{backend,workers:2,batch:4})
  assert.equal(a.frames,13); assert.equal(a.sha256,b.sha256); assert.equal(b.decoded,true)
  await assert.rejects(render(film,dir,f,{backend}),/exists/)
  await assert.rejects(verify({...film,height:98},f),/differs/)
  await writeFile(join(dir,'broken.mp4'),(await readFile(f)).subarray(0,100))
  await assert.rejects(verify(film,join(dir,'broken.mp4')))
  assert.ok(!(await readdir(dir)).some(p=>p.startsWith('.aethermotion-')))
})
