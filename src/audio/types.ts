export interface AudioCue {
  file:string
  startFrame:number
  endFrame:number
  role:'narration'|'music'|'effect'
  gain?:number
  caption?:string
}
