import { Ajv } from 'ajv'
import type { Film, Drawable, Scalar } from '../scene/types.js'
import { parseFilm } from '../scene/validate.js'

import { compileMotion, motionSchema, type MotionBoard } from './motion.js'

export interface Brief {
  layout?:'labels'|'motion'
  topic:string
  seconds:number
  style:'whiteboard'|'infographic'
  format:'portrait'|'landscape'
  narration:boolean
}
interface Beat {title:string; explanation:string; labels:string[]; narration?:string}
export interface Storyboard {scenes:Beat[]}
export interface Director {
  generate(prompt:string,schema:object):Promise<{text:string;usage?:Record<string,unknown>}>
}
export class RetryableDirectorError extends Error {}
const short=(limit:number)=>({type:'string',minLength:1,maxLength:limit})
function boardSchema(narration:boolean) {
  const fields:Record<string,object>={title:short(32),explanation:short(88),labels:{type:'array',items:short(16),minItems:2,maxItems:3}}
  if(narration) fields.narration=short(180)
  return {type:'object',additionalProperties:false,required:['scenes'],properties:{scenes:{type:'array',minItems:2,maxItems:6,
    items:{type:'object',additionalProperties:false,properties:fields,required:Object.keys(fields)}}}}
}
function wrapWords(value:string,max:number) {
  const lines:string[]=[]
  let line=''
  for(const word of value.trim().split(/\s+/)) {
    if(word.length>max) throw new Error('A word exceeds the layout width: '+word)
    if(line.length+word.length+1>max && line) {lines.push(line); line=''}
    line=line?line+' '+word:word
  }
  if(line) lines.push(line)
  return lines
}
/** Convert compact provider data to an independently validated executable film. */
export function compileBoard(brief:Brief,board:Storyboard) {
  const portrait=brief.format==='portrait'
  const width=portrait?540:960,height=portrait?960:540, fps=24, durationFrames=brief.seconds*fps
  const paper=brief.style==='whiteboard'?'#F8F3E7':'#172E3B',ink=brief.style==='whiteboard'?'#183341':'#F6F2E8'
  const accent=brief.style==='whiteboard'?'#227872':'#F7B765'
  const narration:{file:string;text:string;startFrame:number;endFrame:number}[]=[]
  const scenes=board.scenes.map((beat,i)=>{
    const startFrame=Math.round(i*durationFrames/board.scenes.length)
    const endFrame=Math.round((i+1)*durationFrames/board.scenes.length)
    const frames=endFrame-startFrame
    const reveal:Scalar=[{frame:0,value:0,ease:'smooth'},{frame:Math.floor(frames*.7),value:1}]
    const text=(id:string,value:string,x:number,y:number,size:number,color=ink,face:'sans'|'serif'='sans'):Drawable=>({id,kind:'text',text:value,x,y,size,color,face})
    const objects: Drawable[]=[text('section',String(i+1)+' / '+board.scenes.length,32,46,18,accent)]
    const title=wrapWords(beat.title,portrait?17:29)
    title.forEach((line,j)=>objects.push(text('title'+j,line,32,portrait?140+j*48:122+j*45,42,ink,'serif')))
    const body=wrapWords(beat.explanation,portrait?34:58)
    body.forEach((line,j)=>objects.push(text('body'+j,line,32,(portrait?310:224)+j*30,23)))
    const y=portrait?550:355
    if(brief.style==='infographic') {
      objects.push({kind:'milestones',id:'timeline',x:42,y,width:width-84,size:portrait?15:20,labels:beat.labels,reveal})
    } else {
      beat.labels.forEach((label,j)=>{
        const x=portrait?38:36+j*(width-72)/beat.labels.length, cy=portrait?y+j*68:y
        const start=Math.floor(j*frames*.55/beat.labels.length)
        const end=Math.min(frames-1,start+Math.floor(frames*.3))
        objects.push({kind:'arrow',id:'pointer'+j,dx:38,dy:0,head:10,x,y:cy-6,reveal:[{frame:start,value:0},{frame:end,value:1}]},
          text('concept'+j,label,x+50,cy,portrait?23:19))
      })
    }
    if(brief.narration) narration.push({file:'voice/shot-'+(i+1)+'.wav',text:beat.narration!,startFrame,endFrame})
    return {id:'shot'+(i+1),frames,background:paper,style:{name:brief.style,accent,ink},objects}
  })
  const film:Film={version:'0.1',engine:'canvas2d',width,height,fps,durationFrames,scenes}
  if(narration.length) film.audio=narration.map(c=>({file:c.file,role:'narration',startFrame:c.startFrame,endFrame:c.endFrame,caption:c.text}))
  return {film:parseFilm(film),narration}
}

function validateBrief(brief:Brief) {
  if(!brief || typeof brief.topic!=='string' || !brief.topic.trim() || brief.topic.length>2000 ||
    !Number.isInteger(brief.seconds) || brief.seconds<6 || brief.seconds>180 ||
    !['whiteboard','infographic'].includes(brief.style) || !['portrait','landscape'].includes(brief.format) ||
    !['labels','motion'].includes(brief.layout ?? 'labels') || typeof brief.narration!=='boolean')
    throw new Error('Invalid brief')
}

function compiler(brief:Brief) {
  validateBrief(brief)
  const motion=brief.layout==='motion'
  const schema=motion ? motionSchema(brief.narration) : boardSchema(brief.narration)
  const validator=new Ajv({allErrors:true})
  const check=validator.compile<MotionBoard | Storyboard>(schema)
  function compile(board:unknown) {
    if(!check(board)) throw new Error(validator.errorsText(check.errors?.slice(0,10)))
    return motion ? compileMotion(brief,board as MotionBoard) : compileBoard(brief,board as Storyboard)
  }
  return {schema,compile}
}

/** Validate provider-independent storyboard data and compile it without network access. */
export function compileStoryboard(brief:Brief, board:unknown) {
  return compiler(brief).compile(board)
}

/** Each attempt emits usage when the provider supplies it. Validation failures get a bounded repair. */
export async function direct(brief:Brief,provider:Director,retries=1) {
  if(!Number.isInteger(retries) || retries<0 || retries>3) throw new Error('Invalid retry limit')
  const {schema,compile}=compiler(brief)
  const usage:(Record<string,unknown>|null)[]=[]
  let feedback=''
  const direction=brief.layout==='motion'
    ? 'Design distinct illustrated shots. Set stage width and height to fit the requested format, for example 100 by 48 landscape or 60 by 90 portrait. Without stage, the default is 100 by 48. Coordinates grow right and down. Layer marks are local to their poses. Animate meaningful movement with increasing pose times from 0 to 1. Shot weights divide the duration. Set a legible ink color, and use the requested style to guide the palette and drawing. '
    : 'Write a factual, concise sequence of 2–6 teaching beats. Labels describe successive concepts. Use natural short titles. '
  const prompt=direction+
    'If narration is requested, keep speech short enough for each shot. Return only the specified JSON. Brief: '+JSON.stringify(brief)
  for(let i=0;;i++) {
    let result
    try {result=await provider.generate(prompt+feedback,schema)}
    catch(error) {
      if(!(error instanceof RetryableDirectorError) || i===retries) throw error
      usage.push(null)
      await new Promise(r=>setTimeout(r,250*2**i))
      continue
    }
    usage.push(result.usage ?? null)
    try {
      const data=JSON.parse(result.text)
      return {...compile(data),board:data,usage,attempts:i+1}
    } catch(error) {
      if(i===retries) throw new Error('Director returned an invalid storyboard: '+(error as Error).message)
      feedback='\nCorrect the previous validation error: '+(error as Error).message.slice(0,400)
    }
  }
}
