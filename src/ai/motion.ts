import type { Drawable, Film, Key, Point } from '../scene/types.js'
import { parseFilm } from '../scene/validate.js'
import type { Brief } from './director.js'

interface Position { at: number; x: number; y: number; angle?: number; opacity?: number; ease?: Key['ease'] }
type Mark =
  | { kind: 'disc'; x: number; y: number; r: number; color: string }
  | { kind: 'box'; x: number; y: number; w: number; h: number; color: string }
  | { kind: 'polygon'; points: Point[]; color: string }
  | { kind: 'line'; points: Point[]; stroke: number; color: string }
interface Layer { name: string; poses: Position[]; marks: Mark[] }
interface MotionShot { title: string; background: string; ink: string; weight: number; layers: Layer[]; narration?: string }
export interface MotionBoard { stage?: {width:number;height:number}; scenes: MotionShot[] }

const number = (minimum: number, maximum: number) => ({type:'number', minimum, maximum})
const coord = number(-200, 200)
const color = {type:'string', pattern:'^#[0-9A-Fa-f]{6}$'}
const array = (items: object, minItems: number, maxItems: number) => ({type:'array', items, minItems, maxItems})
const object = (properties: Record<string,object>, required = Object.keys(properties)) =>
  ({type:'object', properties, required, additionalProperties:false})

/** JSON contract shared by the provider and the offline storyboard compiler. */
export function motionSchema(narration: boolean) {
  const point = array(coord, 2, 2)
  const mark = (name: Mark['kind'], fields: Record<string,object>) =>
    object({kind:{type:'string',enum:[name]}, color, ...fields})
  const marks = {anyOf:[
    mark('disc', {x:coord, y:coord, r:number(.1,150)}),
    mark('box', {x:coord, y:coord, w:number(.1,200), h:number(.1,200)}),
    mark('polygon', {points:array(point,3,64)}),
    mark('line', {points:array(point,2,64), stroke:number(.1,20)})
  ]}
  const pose = object({at:number(0,1), x:coord, y:coord, angle:number(-3600,3600),
    opacity:number(0,1), ease:{type:'string',enum:['linear','smooth','hold']}}, ['at','x','y'])
  const layer = object({name:{type:'string',pattern:'^[A-Za-z][A-Za-z0-9_-]{0,39}$'},
    poses:array(pose,1,32), marks:array(marks,1,64)})
  const fields: Record<string,object> = {title:{type:'string',minLength:1,maxLength:36}, background:color,
    ink:color, weight:{type:'integer',minimum:1,maximum:20}, layers:array(layer,1,24)}
  if (narration) fields.narration = {type:'string',minLength:1,maxLength:180}
  return object({stage:object({width:number(20,200),height:number(20,200)}),scenes:array(object(fields),1,8)}, ['scenes'])
}

function drawable(mark: Mark, id: string, scale: number): Drawable {
  // Convert at compile time so the normal runtime's minimum stroke and size units are pixels.
  if (mark.kind === 'disc') return {id,kind:'circle',x:mark.x*scale,y:mark.y*scale,radius:mark.r*scale,color:mark.color}
  if (mark.kind === 'box') return {id,kind:'rect',x:mark.x*scale,y:mark.y*scale,width:mark.w*scale,height:mark.h*scale,color:mark.color}
  const points: Point[] = mark.points.map(([x,y]) => [x*scale,y*scale])
  if (mark.kind === 'line') return {id,kind:'path',points,stroke:mark.stroke*scale,color:mark.color}
  return {id,kind:'polygon',points,color:mark.color}
}

function compileLayer(layer: Layer, index: number, frames: number, scale: number): Drawable {
  const positions = layer.poses.map(p => Math.round(p.at*(frames-1)))
  if (positions.some((frame,i) => i>0 && frame<=positions[i-1]))
    throw new Error('Layer '+layer.name+' has pose times that overlap or are out of order on the frame timeline')
  function track(read: (p: Position) => number) {
    const keys: Key[] = layer.poses.map((p,i) => ({frame:positions[i],value:read(p),ease:p.ease ?? 'linear'}))
    return keys.every(k => k.value===keys[0].value) ? keys[0].value : keys
  }
  return {kind:'group', id:'layer-'+layer.name, x:track(p=>p.x*scale), y:track(p=>p.y*scale),
    rotation:track(p=>p.angle ?? 0), opacity:track(p=>p.opacity ?? 1),
    children:layer.marks.map((mark,j)=>drawable(mark,'mark-'+index+'-'+j,scale))}
}

/** Compile validated motion data to ordinary Canvas groups and frame-indexed tracks. */
export function compileMotion(brief: Brief, board: MotionBoard) {
  const portrait = brief.format === 'portrait'
  const width = portrait ? 540 : 960, height = portrait ? 960 : 540
  const fps = 24, durationFrames = brief.seconds*fps
  const stage = board.stage ?? {width:100,height:48}
  const scale = Math.min((width-48)/stage.width,(height-(brief.narration?182:105))/stage.height)
  const left = (width-stage.width*scale)/2
  const top = board.stage ? 69+(height-(brief.narration?182:105)-stage.height*scale)/2 : portrait ? (height-48*scale)/2-30 : 69
  const totalWeight = board.scenes.reduce((n,s)=>n+s.weight,0)
  const narration: {file:string;text:string;startFrame:number;endFrame:number}[] = []
  let accumulated = 0, end = 0
  const scenes = board.scenes.map((shot,i) => {
    const start = end
    accumulated += shot.weight
    end = Math.round(durationFrames*accumulated/totalWeight)
    const frames = end-start
    if (frames<2) throw new Error('Shot '+(i+1)+' is too short. Increase its weight or the film duration')
    const layers = shot.layers.map((layer,j)=>compileLayer(layer,j,frames,scale))
    const title: Drawable = {kind:'text',id:'title',text:shot.title,x:left,
      y:top-16,size:Math.min(30,Math.floor((width-48)/(shot.title.length*.95))),color:shot.ink,face:'serif'}
    if (brief.narration) narration.push({file:'voice/shot-'+(i+1)+'.wav',text:shot.narration!,startFrame:start,endFrame:end})
    // Mask overscan at the stage edges so entrances and exits end at the scenery.
    const bottom=top+stage.height*scale
    const mask=(id:string,x:number,y:number,w:number,h:number): Drawable => ({
      kind:'rect',id,x,y,width:w,height:h,color:shot.background
    })
    const objects: Drawable[]=[
      {kind:'group',id:'stage',x:left,y:top,children:layers},
      mask('left-edge',0,0,left,height), mask('right-edge',width-left,0,left,height),
      mask('top-edge',0,0,width,top), mask('bottom-edge',0,bottom,width,height-bottom), title
    ]
    return {id:'shot'+(i+1),frames,background:shot.background,objects}
  })
  const film: Film = {version:'0.1',engine:'canvas2d',width,height,fps,durationFrames,scenes}
  if (narration.length) film.audio=narration.map(c=>({file:c.file,role:'narration',startFrame:c.startFrame,endFrame:c.endFrame,caption:c.text}))
  return {film:parseFilm(film),narration}
}
