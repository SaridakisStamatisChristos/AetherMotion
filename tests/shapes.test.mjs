import test from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { drawFrame } from '../dist/renderers/painter.js'

const shape={kind:'shape',id:'curve',commands:[
  {op:'move',x:4,y:4},{op:'cubic',x1:4,y1:4,x2:28,y2:4,x:28,y:4},
  {op:'line',x:28,y:28},{op:'line',x:4,y:28},{op:'close'}],
  fill:{kind:'linear',from:[4,0],to:[28,0],stops:[{at:0,color:'#FF0000'},{at:1,color:'#0000FF'}]}}
function film(object=shape) {
  return {version:'0.1',engine:'canvas2d',width:32,height:32,fps:24,durationFrames:4,
    scenes:[{id:'s',frames:4,background:'#FFFFFF',objects:[object]}]}
}
test('Bezier fills, gradients and seek order agree on sampled pixels',()=>{
  const input=parseFilm(film())
  const ctx=createCanvas(32,32).getContext('2d')
  const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data)
  drawFrame(ctx,input,new Map(),0)
  const first=pixel(8,16)
  assert.ok(first[0]>first[2])
  const right=pixel(24,16)
  assert.ok(right[2]>right[0])
  assert.deepEqual(pixel(1,1),[255,255,255,255])
  drawFrame(ctx,input,new Map(),3)
  drawFrame(ctx,input,new Map(),0)
  assert.deepEqual(pixel(8,16),first)
})
test('shape instructions reject missing moves, invisible shapes and invalid gradients',()=>{
  const bad=structuredClone(shape)
  bad.commands[0].op='line'
  assert.throws(()=>parseFilm(film(bad)),/start with move/)
  const invisible=structuredClone(shape)
  delete invisible.fill
  assert.throws(()=>parseFilm(film(invisible)),/fill or outline/)
  const gradient=structuredClone(shape)
  gradient.fill.stops.reverse()
  assert.throws(()=>parseFilm(film(gradient)),/stops must increase/)
  gradient.fill=structuredClone(shape.fill)
  gradient.fill.to=[4,0]
  assert.throws(()=>parseFilm(film(gradient)),/endpoints must differ/)
})
