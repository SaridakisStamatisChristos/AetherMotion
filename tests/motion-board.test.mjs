import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileStoryboard, direct } from '../dist/ai/director.js'
import { sample } from '../dist/timeline/sample.js'

const bundle=JSON.parse(await readFile('examples/night-post/board.json','utf8'))

test('motion layers compile to weighted shots in both aspect ratios',()=>{
  for(const format of ['portrait','landscape']) {
    const {film}=compileStoryboard({...bundle.brief,format},bundle.board)
    assert.deepEqual(film.scenes.map(s=>s.frames),[240,216,264])
    assert.deepEqual(film.audio.map(c=>c.startFrame),[0,240,456])
    const stage=film.scenes[0].objects.find(o=>o.id==='stage')
    const train=stage.children.find(o=>o.id==='layer-mail-train')
    assert.ok(sample(train.x,239,0)>sample(train.x,100,0))
    assert.equal(train.children[0].kind,'rect')
    assert.equal(film.width,format==='portrait'?540:960)
  }
})

test('provider and offline compiler enforce the same choreography constraints',async()=>{
  const board=structuredClone(bundle.board)
  const layer=board.scenes[0].layers[0]
  layer.poses.push({at:.001,x:2,y:4})
  assert.throws(()=>compileStoryboard(bundle.brief,board),/overlap/)
  layer.poses.pop()
  layer.marks[0].kind='run'
  assert.throws(()=>compileStoryboard(bundle.brief,board))
  const prompts=[]
  const result=await direct(bundle.brief,{async generate(prompt,schema){
    prompts.push(prompt)
    assert.ok(schema.properties.scenes.items.properties.layers)
    return {text:JSON.stringify(prompts.length===1?board:bundle.board)}
  }},1)
  assert.equal(result.attempts,2)
  assert.match(prompts[1],/validation error/)
  assert.deepEqual(result.film,compileStoryboard(bundle.brief,result.board).film)
})

test('offline CLI accepts saved director reports and preserves existing output',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'motion-board-'))
  t.after(()=>rm(dir,{recursive:true,force:true}))
  const input=join(dir,'report.json'), dest=join(dir,'compiled.json')
  await writeFile(input,JSON.stringify({storyboard:bundle,model:'fixture'}))
  const compile=()=>execFileSync(process.execPath,['dist/cli/main.js','compile-board',input,dest],{stdio:'pipe'})
  compile()
  assert.deepEqual(JSON.parse(await readFile(dest,'utf8')),compileStoryboard(bundle.brief,bundle.board).film)
  assert.throws(compile,/EEXIST/)
})

test('explicit portrait stage preserves equal axis scale and reserves caption space',()=>{
  const board=structuredClone(bundle.board)
  board.stage={width:60,height:90}
  const {film}=compileStoryboard({...bundle.brief,format:'portrait'},board)
  const objects=film.scenes[0].objects
  const stage=objects.find(o=>o.id==='stage')
  const bottom=objects.find(o=>o.id==='bottom-edge')
  assert.ok(bottom.y-stage.y>700)
  assert.ok(bottom.y<=film.height-100)
  const train=stage.children.find(o=>o.id==='layer-mail-train')
  assert.equal(train.children[0].width/45,train.children[0].height/1.4)
  board.stage.height=0
  assert.throws(()=>compileStoryboard(bundle.brief,board))
})
