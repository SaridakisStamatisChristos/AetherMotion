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
