import { parseArgs } from 'node:util'
import { mkdir, mkdtemp, lstat, writeFile, rm, link } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { direct, type Brief } from '../ai/director.js'
import { gemini } from '../ai/gemini.js'

export async function runDirector(args:string[]) {
  const {values:v,positionals}=parseArgs({args,allowPositionals:true,options:{
    model:{type:'string'},tokens:{type:'string',default:'2048'},retries:{type:'string',default:'1'},
    seconds:{type:'string',default:'30'},format:{type:'string',default:'landscape'},style:{type:'string',default:'infographic'},narration:{type:'boolean',default:false}}})
  if(positionals.length!==2) throw new Error('direct TOPIC OUT.json --model MODEL [--seconds N --format portrait|landscape --style whiteboard|infographic --tokens N --retries N --narration]')
  const [topic,output]=positionals, model=v.model ?? process.env.GEMINI_MODEL ?? ''
  const provider=gemini(model,process.env.GEMINI_API_KEY ?? '',Number(v.tokens))
  const brief={topic,seconds:Number(v.seconds),style:v.style as Brief['style'],format:v.format as Brief['format'],narration:v.narration}
  const dest=resolve(output)
  const exists=await lstat(dest).then(()=>true,(error:NodeJS.ErrnoException)=>{
    if(error.code==='ENOENT') return false
    throw error
  })
  if(exists) throw new Error('Output already exists: '+dest)
  await mkdir(dirname(dest),{recursive:true})
  const dir=await mkdtemp(join(dirname(dest),'.director-'))
  try {
    const result=await direct(brief,provider,Number(v.retries))
    const staged=join(dir,'film.json')
    await writeFile(staged,JSON.stringify(result.film,null,2)+'\n')
    await link(staged,dest)
    console.log(JSON.stringify({model,attempts:result.attempts,usage:result.usage,narration:result.narration},null,2))
  } finally {await rm(dir,{recursive:true,force:true})}
}
