import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { parseFilm } from '../dist/scene/validate.js'
import { loadAssets } from '../dist/scene/assets.js'
import { parseObj } from '../dist/engines/three/obj.js'
import { WorldScene } from '../dist/engines/three/world.js'
import { openPool } from '../dist/renderers/workers.js'

const film=JSON.parse(await readFile('examples/capsule.json','utf8'))
test('closed 3D contract rejects malformed tracks, missing models and unsupported assets',()=>{
  assert.equal(parseFilm(film),film)
  for(const change of [
    f=>delete f.scenes[0].world,
    f=>f.engine='canvas2d',
    f=>f.scenes[0].world.models[2].shape.asset='absent',
    f=>f.scenes[0].world.models[0].position=[[{frame:96,value:2}],0,0],
    f=>f.scenes[0].world.models[0].material.shader='custom',
    f=>f.scenes[0].world.models[0].shape={kind:'remote',url:'https://example.org'},
  ]) {
    const f=structuredClone(film);change(f);assert.throws(()=>parseFilm(f))
  }
})
test('OBJ preflight triangulates polygons and checks invalid references',()=>{
  const quad='v 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1 2 3 4'
  assert.equal(parseObj(quad,'quad').length,18)
  for(const extra of ['mtllib material.mtl','f 1 2 9','f 1 2 0','v Infinity 0 0','f -1 -2 -3'])
    assert.throws(()=>parseObj(quad+'\n'+extra,'quad'),/quad line/)
})
test('Three.js scene uses imported geometry, animates camera and preserves seek order',async()=>{
  const assets=await loadAssets(parseFilm(film),'examples')
  const shot=film.scenes[1]
  const world=new WorldScene(shot.world,film.width/film.height,shot.background,assets)
  const model=world.scene.getObjectByName('capsule')
  assert.ok(model.geometry.attributes.normal.count>=100)
  world.seek(95)
  const end=world.camera.position.clone()
  assert.equal(model.position.y,1.08)
  world.seek(0)
  assert.equal(model.position.y,.37);assert.ok(end.distanceTo(world.camera.position)>2)
  world.seek(95);assert.ok(end.equals(world.camera.position))
  world.dispose()
  await assert.rejects(openPool('native',1,film,assets),/require --backend chromium/)
})
test('real WebGL draws lit geometry, moves the object and restores pixels after a cut',
  {skip:process.env.TEST_BACKEND!=='chromium'},async t=>{
    const pool=await openPool('chromium',1,film,await loadAssets(film,'examples'))
    t.after(()=>pool.close())
    const get=async index=>(await pool.lanes[0](index,index+1))[0]
    const first=await get(0),last=await get(191)
    const digest=data=>createHash('sha256').update(data).digest('hex')
    assert.equal(digest(first),digest(await get(0)))
    const canvas=createCanvas(film.width,film.height),ctx=canvas.getContext('2d')
    async function pixels(bytes) {
      ctx.drawImage(await loadImage(Buffer.from(bytes)),0,0)
      return ctx.getImageData(0,80,film.width,270).data
    }
    const a=await pixels(first),b=await pixels(last)
    let copper=0,changed=0
    for(let i=0;i<a.length;i+=4) {
      if(a[i]>a[i+2]*1.4 && a[i]>120) copper++
      if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>45) changed++
    }
    assert.ok(copper>500,'expected visible warm-colored mesh')
    assert.ok(changed>2500,'expected substantial motion in the 3D layer')
  })
