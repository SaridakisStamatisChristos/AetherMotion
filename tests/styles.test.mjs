import test from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { drawFrame } from '../dist/renderers/painter.js'
import { letters, measure } from '../dist/engines/whiteboard.js'
const keys=[{frame:0,value:0},{frame:20,value:1}]
function fixture(name,object) {
  return {engine:'canvas2d',version:'0.1',width:160,height:100,fps:24,durationFrames:21,scenes:[{
    id:'s',frames:21,background:'#ffffff',style:{name,accent:'#112233',ink:'#445566'},objects:[object]}]}
}
test('original glyph repertoire and pen lifts have finite arc lengths', () => {
  for(const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-') assert.ok(measure(letters(char,21)).total>0,char)
})
test('ink adds pixels monotonically and late seek restores the exact frame', () => {
  const film=parseFilm(fixture('whiteboard',{id:'a',kind:'handwriting',size:21,x:5,y:10,text:'INK',reveal:keys}))
  const ctx=createCanvas(160,100).getContext('2d')
  const counts=[0,10,20,10].map(index=>{
    drawFrame(ctx,film,new Map(),index)
    const rgba=ctx.getImageData(0,0,160,100).data
    let n=0
    for(let i=0;i<rgba.length;i+=4) if(rgba[i]<230) n++
    return n
  })
  assert.equal(counts[0],0); assert.ok(counts[1]>0 && counts[2]>counts[1]); assert.equal(counts[1],counts[3])
})
test('bar heights encode relative values and reject clipped data or wrong style', () => {
  const bars={kind:'bars',id:'chart',width:100,height:60,y:70,ceiling:10,size:8,data:[{label:'x',value:5},{label:'y',value:10}]}
  const film=parseFilm(fixture('infographic',bars))
  const ctx=createCanvas(160,100).getContext('2d')
  drawFrame(ctx,film,new Map(),20)
  const red=(x,y)=>ctx.getImageData(x,y,1,1).data[0]
  assert.equal(red(25,45),17); assert.equal(red(25,20),255); assert.equal(red(75,20),17)
  assert.throws(()=>parseFilm(fixture('whiteboard',bars)),/infographic style/)
  assert.throws(()=>parseFilm(fixture('infographic',{...bars,ceiling:3})),/ceiling/)
})
