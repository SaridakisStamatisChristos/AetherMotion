import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseFilm } from '../dist/scene/validate.js'
import { loadAssets } from '../dist/scene/assets.js'
import { sample, locate, cameraMatrix } from '../dist/timeline/sample.js'
import { createCanvas } from '@napi-rs/canvas'
import { drawFrame } from '../dist/renderers/painter.js'
export const example = {version:'0.1',engine:'canvas2d',width:64,height:64,fps:12,durationFrames:12,
  scenes:[{id:'a',frames:6,background:'#ffffff',objects:[]},{id:'b',frames:6,background:'#000000',objects:[]}]}
const rect = {id:'box',kind:'rect',width:8,height:8,color:'#ff0000'}
test('closed schema and semantic errors', () => {
  assert.deepEqual(parseFilm(example),example)
  for(const patch of [{engine:'script'},{width:31},{actions:['shell']},{durationFrames:11},{fps:0}])
    assert.throws(()=>parseFilm({...example,...patch}))
  for(const obj of [{...rect,action:'launch'},{...rect,kind:'rocket'},{...rect,opacity:1.2},{...rect,x:[{frame:6,value:1}]},
    {...rect,y:[{frame:2,value:1},{frame:2,value:2}]},{...rect,color:'red'}, {kind:'image',id:'x',asset:'missing',width:1,height:1}]) {
    const film=structuredClone(example); film.scenes[0].objects=[obj]
    assert.throws(()=>parseFilm(film))
  }
})
test('key boundaries, easing, endpoint holds and absolute seek', () => {
  for(const [ease,expected] of [['linear',2],['smooth',1.25],['hold',0]]) {
    const track=[{frame:2,value:0,ease},{frame:10,value:8}]
    assert.deepEqual([1,4,10,20,4].map(f=>sample(track,f,9)),[0,expected,8,8,expected])
  }
  assert.deepEqual([11,0,5,6].map(i=>locate(example,i).frame),[5,0,5,0])
  for(const frame of [12,-1,.5]) assert.throws(()=>locate(example,frame))
  assert.deepEqual(cameraMatrix({x:2,y:-4,zoom:3},0),{zoom:3,dx:-6,dy:12})
})
test('pixel composition, transforms, occlusion and background reset', () => {
  const film=structuredClone(example), ctx=createCanvas(64,64).getContext('2d')
  const scene=film.scenes[0]
  scene.camera={x:2,zoom:2}
  scene.objects=[{...rect,x:4,y:3},{...rect,id:'overlay',width:2,height:2,x:4,y:3,color:'#00ff00'}]
  const rgb=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3)
  drawFrame(ctx,film,new Map(),2)
  assert.deepEqual(rgb(4,6),[0,255,0]); assert.deepEqual(rgb(9,6),[255,0,0])
  assert.deepEqual(rgb(3,5),[255,255,255])
  drawFrame(ctx,film,new Map(),6); assert.deepEqual(rgb(4,6),[0,0,0])
  drawFrame(ctx,film,new Map(),2); assert.deepEqual(rgb(4,6),[0,255,0])
})
test('missing, escaping, symlinked and invalid image files fail preflight', async t => {
  const dir=await mkdtemp(join(tmpdir(),'aether-assets-'))
  t.after(()=>rm(dir,{recursive:true,force:true}))
  await writeFile(join(dir,'invalid.png'),'invalid')
  await symlink('/etc/hosts',join(dir,'link.png'))
  for(const path of ['absent.png','../outside.png','/outside.png','link.png','invalid.png'])
    await assert.rejects(loadAssets({...example,assets:{art:path}},dir))
})
