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
export type Point = [number, number]
export type Drawable = Pose & (
  | {kind: 'circle'; radius: number; color: string}
  | {kind: 'rect'; width: number; height: number; color: string}
  | {kind: 'path'; points: Point[]; stroke: number; color: string; reveal?: Scalar}
  | {kind: 'text'; text: string; size: number; color: string; face?: 'sans'|'serif'|'mono'; bold?: boolean}
  | {kind: 'image'; asset: string; width: number; height: number}
)
export interface Shot {
  id: string
  frames: number
  background: string
  camera?: Camera
  objects: Drawable[]
}
export interface Film {
  version: '0.1'
  engine: 'canvas2d'
  width: number
  height: number
  fps: number
  durationFrames: number
  assets?: Record<string, string>
  scenes: Shot[]
}
