import test from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { drawFrame } from '../dist/renderers/painter.js'
import { travelPose } from '../dist/animation/travel.js'
import { timeSpeech } from '../dist/production/timing.js'

const actor={kind:'actor',id:'actor',design:'illustrated',height:161,skin:'#E4B18B',shirt:'#607F84',
  trousers:'#485361',hair:'#4A3D3C',shoes:'#5E4943'}
function film(o=actor) {
  return {version:'0.1',engine:'canvas2d',width:320,height:240,fps:24,durationFrames:120,
    scenes:[{id:'s',frames:120,background:'#FFFFFF',style:{name:'cartoon'},objects:[o]}]}
}
const travel={fromX:40,toX:260,ground:220,startFrame:10,endFrame:100,stride:20}
test('travel clamps endpoints, settles the gait and rejects conflicting controls',()=>{
  const o={...actor,travel}
  assert.equal(travelPose(o,0).x,40)
  assert.equal(travelPose(o,119).x,260)
  assert.equal(travelPose(o,119).stride,0)
  assert.equal(travelPose(o,10).stride,0)
  assert.equal(travelPose(o,55).stride,20)
  assert.equal(travelPose(o,55).x,150)
  assert.equal(travelPose({...o,travel:{...travel,fromX:260,toX:40}},55).facing,'left')
  assert.throws(()=>parseFilm(film({...o,x:10})),/travel controls/)
  assert.throws(()=>parseFilm(film({...o,travel:{...travel,endFrame:130}})),/interval/)
  const input=film(o)
  input.audio=[{role:'narration',file:'voice.wav',startFrame:0,endFrame:120}]
  const timed=timeSpeech(parseFilm(input),new Map([[0,10]]))
  assert.equal(timed.scenes[0].objects[0].travel.endFrame,201)
})
test('held geometry moves with the hand, survives seek and validates its children',()=>{
  const marker={kind:'circle',id:'marker',x:0,y:16,radius:3,color:'#FF0000'}
  const o={...actor,x:100,y:220,held:[marker],wave:[{frame:0,value:0},{frame:119,value:1}]}
  const input=parseFilm(film(o))
  const ctx=createCanvas(320,240).getContext('2d')
  function markerCenter(frame) {
    drawFrame(ctx,input,new Map(),frame)
    const data=ctx.getImageData(0,0,320,240).data
    let count=0,x=0,y=0
    for(let i=0;i<data.length;i+=4) if(data[i]>240 && data[i+1]<15 && data[i+2]<15) {
      x+=(i/4)%320;y+=Math.floor(i/4/320);count++
    }
    assert.ok(count>10)
    return [x/count,y/count]
  }
  const rest=markerCenter(0),raised=markerCenter(119)
  assert.ok(raised[1]<rest[1]-60)
  assert.ok(Math.abs(rest[0]-112.5)<1)
  assert.deepEqual(markerCenter(0),rest)
  assert.throws(()=>parseFilm(film({...o,held:[{...marker,id:'actor'}]})),/duplicate/)
  assert.throws(()=>parseFilm(film({...o,held:[{kind:'image',id:'missing',asset:'absent',width:10,height:10}]})),/unknown image/)
  assert.throws(()=>parseFilm(film({...o,design:'classic'})),/illustrated/)
})
