#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { prepareAudio } from '../audio/produce.js'
import { subtitles } from '../audio/subtitles.js'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'
import { loadAssets } from '../scene/assets.js'
import { parseFilm } from '../scene/validate.js'
import { render } from '../renderers/render.js'
import { verify } from '../renderers/verify.js'
const help = 'aethermotion validate SCENE.json | render SCENE.json OUT.mp4 [--workers N --batch N --backend chromium|native] | verify SCENE.json OUT.mp4 | subtitles SCENE.json OUT.srt | produce SCENE.json NEW_DIRECTORY | direct TOPIC OUT.json --model MODEL'
async function main() {
  if(process.argv[2]==='produce') {
    const {positionals,values}=parseArgs({args:process.argv.slice(3),allowPositionals:true,options:{backend:{type:'string'},workers:{type:'string'}}})
    if(positionals.length!==2) throw new Error('produce SCENE.json NEW_DIRECTORY [--backend native|chromium --workers N]')
    const {produce}=await import('../production/produce.js')
    const report=await produce(positionals[0],positionals[1],{backend:values.backend as 'native'|'chromium'|undefined,
      workers:values.workers===undefined?undefined:Number(values.workers),python:process.env.KOKORO_PYTHON,
      model:process.env.KOKORO_MODEL,voices:process.env.KOKORO_VOICES,voice:process.env.KOKORO_VOICE})
    return console.log(JSON.stringify(report,null,2))
  }
  if(process.argv[2]==='direct') return (await import('./direct.js')).runDirector(process.argv.slice(3))
  const {values,positionals} = parseArgs({options:{backend:{type:'string'},workers:{type:'string'},batch:{type:'string'},help:{type:'boolean'}},allowPositionals:true})
  if (values.help) return console.log(help)
  const [mode,spec,file] = positionals
  if (!['validate','render','verify','subtitles'].includes(mode) || positionals.length!==(mode==='validate'?2:3)) throw new Error(help)
  const film = parseFilm(JSON.parse(await readFile(spec,'utf8')))
  if (mode==='subtitles') {
    const srt=subtitles(film)
    if(!srt) throw new Error('Film has no caption cues')
    await writeFile(file,srt,{flag:'wx'})
    return
  }
  if (mode === 'validate') {
    if(film.audio) await prepareAudio(film,dirname(spec))
    await loadAssets(film,dirname(spec))
    return console.log('Valid: '+film.durationFrames+' frames')
  }
  const result = mode === 'verify' ? await verify(film,file) : await render(film,dirname(spec),file,{
    backend:values.backend as 'chromium'|'native'|undefined,workers:values.workers===undefined?undefined:Number(values.workers),batch:values.batch===undefined?undefined:Number(values.batch)})
  console.log(JSON.stringify(result,null,2))
}
main().catch(error => {console.error(error.message); process.exitCode=1})
