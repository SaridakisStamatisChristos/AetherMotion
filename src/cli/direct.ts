import { parseArgs } from 'node:util'
import { readFile, mkdir, mkdtemp, lstat, writeFile, rm, link } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { compileStoryboard, direct, type Brief } from '../ai/director.js'
import { gemini } from '../ai/gemini.js'

export async function runDirector(args:string[]) {
  const {values:v,positionals}=parseArgs({args,allowPositionals:true,options:{
    layout:{type:'string',default:'labels'},model:{type:'string'},tokens:{type:'string',default:'2048'},retries:{type:'string',default:'1'},
    seconds:{type:'string',default:'30'},format:{type:'string',default:'landscape'},style:{type:'string',default:'infographic'},narration:{type:'boolean',default:false}}})
  if(positionals.length!==2) throw new Error('direct TOPIC OUT.json --model MODEL [--seconds N --format portrait|landscape --style whiteboard|infographic --layout labels|motion --tokens N --retries N --narration]')
  const [topic,output]=positionals, model=v.model ?? process.env.GEMINI_MODEL ?? ''
  const provider=gemini(model,process.env.GEMINI_API_KEY ?? '',Number(v.tokens))
  const brief={topic,layout:v.layout as Brief['layout'],seconds:Number(v.seconds),style:v.style as Brief['style'],format:v.format as Brief['format'],narration:v.narration}
  const dest=resolve(output)
  const exists=await lstat(dest).then(()=>true,(error:NodeJS.ErrnoException)=>{
    if(error.code==='ENOENT') return false
    throw error
  })
  if(exists) throw new Error('Output already exists: '+dest)
  const result=await direct(brief,provider,Number(v.retries))
  await publishFilm(dest,result.film)
  console.log(JSON.stringify({model,attempts:result.attempts,usage:result.usage,narration:result.narration,
    storyboard:{version:'1',brief,board:result.board}},null,2))
}

/** Compile an editable storyboard bundle, including one saved from a director report. */
export async function runCompile(args:string[]) {
  if(args.length!==2) throw new Error('compile-board STORYBOARD.json OUT.json')
  const input=JSON.parse(await readFile(args[0],'utf8'))
  const bundle=input?.storyboard ?? input
  if(bundle?.version!=='1' || !bundle.brief || !bundle.board) throw new Error('Expected storyboard version 1, brief and board')
  const {film}=compileStoryboard(bundle.brief,bundle.board)
  await publishFilm(resolve(args[1]),film)
  console.log(JSON.stringify({frames:film.durationFrames,shots:film.scenes.length}))
}

async function publishFilm(dest:string,film:ReturnType<typeof compileStoryboard>['film']) {
  await mkdir(dirname(dest),{recursive:true})
  const dir=await mkdtemp(join(dirname(dest),'.director-'))
  try {
    const staged=join(dir,'film.json')
    await writeFile(staged,JSON.stringify(film,null,2)+'\n')
    await link(staged,dest)
  } finally {await rm(dir,{recursive:true,force:true})}
}
