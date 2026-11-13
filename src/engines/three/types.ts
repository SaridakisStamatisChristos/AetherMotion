import type { Scalar } from '../../scene/types.js'

export type Vector = [number, number, number]
export type VectorTrack = [Scalar, Scalar, Scalar]
export type Shape =
  | {kind:'box'; size:Vector}
  | {kind:'sphere'; radius:number}
  | {kind:'cylinder'; radiusTop:number; radiusBottom:number; height:number}
  | {kind:'torus'; radius:number; tube:number}
  | {kind:'obj'; asset:string}

export interface Model {
  id:string
  shape:Shape
  material:{color:string; roughness?:number; metalness?:number; flat?:boolean}
  position?:VectorTrack
  rotation?:VectorTrack
  scale?:VectorTrack
}
export interface World {
  camera:{position:VectorTrack; target:VectorTrack; fov:number}
  lights: ({kind:'ambient'; color:string; intensity:number} |
    {kind:'directional'; color:string; intensity:number; position:Vector})[]
  models:Model[]
}
