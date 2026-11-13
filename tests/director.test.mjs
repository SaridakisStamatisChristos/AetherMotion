import test from 'node:test'
import assert from 'node:assert/strict'
import { direct } from '../dist/ai/director.js'
import { gemini } from '../dist/ai/gemini.js'
const brief={topic:'counting',seconds:15,style:'whiteboard',format:'portrait',narration:true}
const beat={title:'Count the dots',explanation:'Each new row adds one dot.',labels:['Row','Total'],narration:'Count every dot.'}
test('Gemini request uses configured schema and budget, repairs invalid JSON and preserves usage',async()=>{
  let calls=0
  const provider=gemini('test-model','dummy',1024,async(url,opts)=>{
    assert.ok(url.endsWith('/test-model:generateContent'));assert.equal(opts.headers['x-goog-api-key'],'dummy')
    const g=JSON.parse(opts.body).generationConfig
    assert.equal(g.maxOutputTokens,1024);assert.equal(g.responseJsonSchema.additionalProperties,false)
    calls++
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:calls===1?'{}':JSON.stringify({scenes:[beat,beat]})}]}}],usageMetadata:{totalTokenCount:40}})
  })
  const {film,attempts,usage,narration}=await direct(brief,provider,1)
  assert.equal(attempts,2);assert.equal(usage.length,2);assert.equal(film.width,540)
  assert.equal(film.durationFrames,360);assert.equal(film.audio[1].startFrame,180);assert.equal(narration.length,2)
})
test('authorization failures and exhausted repair limits terminate',async()=>{
  let calls=0
  const provider=gemini('test','dummy',256,async()=>{calls++;return new Response(null,{status:403})})
  await assert.rejects(direct(brief,provider,3),/403/);assert.equal(calls,1)
  await assert.rejects(direct(brief,{generate:async()=>({text:'[]'})},0),/invalid storyboard/)
  await assert.rejects(direct({...brief,seconds:-1},provider),/Invalid brief/)
})
test('compiled provider output renders offline through the normal production API',async t=>{
  const {render}=await import('../dist/renderers/render.js')
  const {mkdtemp,rm}=await import('node:fs/promises')
  const {tmpdir}=await import('node:os')
  const {join}=await import('node:path')
  const dir=await mkdtemp(join(tmpdir(),'aether-board-'));t.after(()=>rm(dir,{recursive:true,force:true}))
  const silent={title:beat.title,explanation:beat.explanation,labels:beat.labels}
  const result=await direct({...brief,narration:false,seconds:6,format:'landscape'},
    {generate:async()=>({text:JSON.stringify({scenes:[silent,silent]})})},0)
  const info=await render(result.film,dir,join(dir,'board.mp4'),{backend:'native'})
  assert.equal(info.frames,144);assert.equal(info.duration,6);assert.equal(info.decoded,true)
})
