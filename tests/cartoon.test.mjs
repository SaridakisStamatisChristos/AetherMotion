import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { drawFrame } from '../dist/renderers/painter.js'
import { gait } from '../dist/engines/cartoon.js'
test('rig has alternating feet, a stable rest pose and seekable poses',() => {
  assert.deepEqual(gait(.25,0),gait(.75,0))
  assert.ok(gait(.25,24)[0].foot[1]<gait(.25,24)[1].foot[1])
  assert.ok(gait(.75,24)[0].foot[1]>gait(.75,24)[1].foot[1])
  const f=parseFilm(JSON.parse(readFileSync('examples/pier.json','utf8')))
  const c=createCanvas(f.width,f.height),g=c.getContext('2d')
  const paint=i=>{drawFrame(g,f,new Map(),i);return c.toBuffer('image/png')}
  const a=paint(14), b=paint(151)
  assert.ok(!a.equals(b)); assert.ok(a.equals(paint(14)))
})

test('illustrated rig honours palette, facing and deterministic gesture seeking',()=>{
  const palette={height:152,skin:'#E4B18B',shirt:'#607F84',trousers:'#485361',hair:'#4A3D3C',shoes:'#5E4943'}
  const actor={kind:'actor',id:'a',design:'illustrated',x:100,y:180,...palette,
    gesture:[{frame:0,value:0},{frame:23,value:1}]}
  const film={version:'0.1',engine:'canvas2d',width:240,height:200,fps:24,durationFrames:24,
    scenes:[{id:'s',frames:24,background:'#FFFFFF',style:{name:'cartoon'},objects:[actor]}]}
  const ctx=createCanvas(240,200).getContext('2d')
  function pixels(frame) {drawFrame(ctx,parseFilm(film),new Map(),frame);return Buffer.from(ctx.getImageData(0,0,240,200).data)}
  const rest=pixels(0),reach=pixels(23)
  assert.notDeepEqual(rest,reach)
  assert.deepEqual(pixels(0),rest)
  assert.ok(rest.includes(Buffer.from([96,127,132,255])))
  actor.facing='left'
  assert.notDeepEqual(pixels(0),rest)
})

test('illustrated stance keeps a level sole, relaxes at rest and repeats across cycles',async()=>{
  const {illustratedGait}=await import('../dist/engines/illustrated.js')
  const left=illustratedGait(.1,20)[0],right=illustratedGait(.4,20)[0]
  assert.equal(left.foot[1],right.foot[1])
  // World travel cancels the stance foot moving backward under the actor.
  assert.ok(Math.abs(left.foot[0]+.1*40/.6-right.foot[0]-.4*40/.6)<1e-9)
  assert.ok(illustratedGait(.8,20)[0].foot[1]<61)
  assert.deepEqual(illustratedGait(.2,0),illustratedGait(.8,0))
  assert.deepEqual(illustratedGait(.25,20),illustratedGait(1.25,20))
})

test('head and torso reactions preserve feet, blink pixels and seek identity',()=>{
  const f=parseFilm(JSON.parse(readFileSync('examples/curiosity.json','utf8')))
  const actor=f.scenes[0].objects.find(o=>o.kind==='actor')
  const canvas=createCanvas(f.width,f.height),ctx=canvas.getContext('2d')
  function region(x,y,w,h) {return Buffer.from(ctx.getImageData(x,y,w,h).data)}
  drawFrame(ctx,f,new Map(),0)
  const feet=region(280,1015,120,30),body=region(270,680,220,300)
  drawFrame(ctx,f,new Map(),140)
  assert.deepEqual(region(280,1015,120,30),feet)
  assert.notDeepEqual(region(270,680,220,300),body)
  actor.headTilt=0;actor.lean=0;actor.gesture=0;actor.blink=0
  drawFrame(ctx,f,new Map(),0)
  const open=region(300,690,100,110)
  actor.blink=1
  drawFrame(ctx,f,new Map(),0)
  assert.notDeepEqual(region(300,690,100,110),open)
  actor.blink=0
  drawFrame(ctx,f,new Map(),0)
  assert.deepEqual(region(300,690,100,110),open)
})
