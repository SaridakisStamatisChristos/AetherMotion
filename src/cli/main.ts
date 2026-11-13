#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'
import { loadAssets } from '../scene/assets.js'
import { parseFilm } from '../scene/validate.js'
import { render } from '../renderers/render.js'
import { verify } from '../renderers/verify.js'
const help = 'aethermotion validate SCENE.json | render SCENE.json OUT.mp4 [--workers N --batch N --backend chromium|native] | verify SCENE.json OUT.mp4'
async function main() {
  const {values,positionals} = parseArgs({options:{backend:{type:'string'},workers:{type:'string'},batch:{type:'string'},help:{type:'boolean'}},allowPositionals:true})
  if (values.help) return console.log(help)
  const [mode,spec,file] = positionals
  if (!['validate','render','verify'].includes(mode) || positionals.length!==(mode==='validate'?2:3)) throw new Error(help)
  const film = parseFilm(JSON.parse(await readFile(spec,'utf8')))
  if (mode === 'validate') {
    await loadAssets(film,dirname(spec))
    return console.log('Valid: '+film.durationFrames+' frames')
  }
  const result = mode === 'verify' ? await verify(film,file) : await render(film,dirname(spec),file,{
    backend:values.backend as 'chromium'|'native'|undefined,workers:values.workers===undefined?undefined:Number(values.workers),batch:values.batch===undefined?undefined:Number(values.batch)})
  console.log(JSON.stringify(result,null,2))
}
main().catch(error => {console.error(error.message); process.exitCode=1})
