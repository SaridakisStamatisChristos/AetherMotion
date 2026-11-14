import type { AudioCue } from '../audio/types.js'
import type { World } from '../engines/three/types.js'
export interface Key {
  frame: number
  value: number
  ease?: 'linear' | 'smooth' | 'hold'
}
export type Scalar = number | Key[]
export interface Camera { x?: Scalar; y?: Scalar; zoom?: Scalar }
export interface Pose {
  id: string
  x?: Scalar
  y?: Scalar
  scale?: Scalar
  rotation?: Scalar
  opacity?: Scalar
}
export type ShapeCommand =
  | {op:'move'|'line'; x:number; y:number}
  | {op:'cubic'; x1:number; y1:number; x2:number; y2:number; x:number; y:number}
  | {op:'close'}
export type ShapeFill = string | {
  kind:'linear'; from:Point; to:Point; stops:{at:number;color:string}[]
}
export type Point = [number, number]
export type Drawable = Pose & (
  | {kind:'shape'; commands:ShapeCommand[]; fill?:ShapeFill; outline?:{color:string;width:number}; shadow?:{color:string;blur:number;x:number;y:number}}
  | {kind:'group'; children:Drawable[]}
  | {kind:'polygon'; points:Point[]; color:string}
  | {kind:'glow'; radius:number; color:string}
  | {kind: 'circle'; radius: number; color: string}
  | {kind: 'rect'; width: number; height: number; color: string}
  | {kind: 'path'; points: Point[]; stroke: number; color: string; reveal?: Scalar}
  | {kind: 'text'; text: string; size: number; color: string; face?: 'sans'|'serif'|'mono'; bold?: boolean}
  | {kind: 'handwriting'; text:string; size:number; reveal?:Scalar; color?:string}
  | {kind: 'arrow'; dx:number; dy:number; head:number; reveal?:Scalar; color?:string}
  | {kind: 'bars'; data:{label:string; value:number}[]; width:number; height:number; ceiling:number; size:number; reveal?:Scalar; color?:string}
  | {kind: 'counter'; value:Scalar; decimals:number; suffix?:string; size:number; color?:string}
  | {kind: 'milestones'; labels:string[]; width:number; size:number; reveal?:Scalar; color?:string}
  | {kind:'actor'; height:number; skin:string; shirt:string; trousers:string; hair:string; shoes:string;
      travel?:{fromX:number;toX:number;ground:number;startFrame:number;endFrame:number;stride:number};
      held?:Drawable[];
      lean?:Scalar; headTilt?:Scalar; blink?:Scalar; wave?:Scalar; design?:'classic'|'illustrated'; phase?:Scalar; stride?:Scalar; gesture?:Scalar; mouth?:Scalar; expression?:'neutral'|'happy'|'curious'|'concerned'; facing?:'left'|'right'}
  | {kind: 'image'; asset: string; width: number; height: number}
)
export interface Shot {
  id: string
  frames: number
  style?: {name:"whiteboard"|"infographic"|"cartoon"; accent?:string; ink?:string; penWidth?:number}
  background: string
  world?: World
  fade?: {color:string; inFrames?:number; outFrames?:number}
  camera?: Camera
  objects: Drawable[]
}
export interface Film {
  version: '0.1'
  engine: 'canvas2d' | 'three'
  width: number
  height: number
  fps: number
  durationFrames: number
  assets?: Record<string, string>
  audio?: AudioCue[]
  scenes: Shot[]
}
