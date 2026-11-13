import type { Film } from '../scene/types.js'

function timestamp(frame:number,fps:number) {
  const ms=Math.round(frame*1000/fps)
  const pad=(n:number,width=2)=>String(n).padStart(width,'0')
  return pad(Math.floor(ms/3600000))+':'+pad(Math.floor(ms/60000)%60)+':'+pad(Math.floor(ms/1000)%60)+','+pad(ms%1000,3)
}
export function subtitles(film:Film) {
  return (film.audio ?? []).filter(c=>c.caption).sort((a,b)=>a.startFrame-b.startFrame)
    .map((c,i)=>(i+1)+'\n'+timestamp(c.startFrame,film.fps)+' --> '+timestamp(c.endFrame,film.fps)+'\n'+c.caption+'\n').join('\n')
}

/** Captions stay in output pixels after camera motion, across shot boundaries. */
export function drawCaption(ctx:CanvasRenderingContext2D,film:Film,frame:number) {
  const cue=film.audio?.find(c=>c.caption && c.startFrame<=frame && frame<c.endFrame)
  if(!cue?.caption) return
  ctx.save()
  ctx.resetTransform()
  const size=Math.max(12,Math.round(Math.min(film.width,film.height)*.045))
  ctx.font='bold '+size+'px Arial, sans-serif'
  const max=film.width*.86
  const lines:string[]=[]
  let line=''
  for(const word of cue.caption.split(/\s+/)) {
    const joined=line?line+' '+word:word
    if(line && ctx.measureText(joined).width>max) {lines.push(line);line=word} else line=joined
  }
  lines.push(line)
  const step=Math.ceil(size*1.28), bottom=film.height-Math.max(5,film.height*.045)
  const top=bottom-step*lines.length-size*.45
  const w=Math.min(max,Math.max(...lines.map(l=>ctx.measureText(l).width)))+size
  ctx.fillStyle='rgba(9,18,26,0.9)';ctx.fillRect((film.width-w)/2,top,w,bottom-top)
  ctx.fillStyle='#FFFFFF';ctx.textAlign='center';ctx.textBaseline='top'
  lines.forEach((l,i)=>ctx.fillText(l,film.width/2,top+size*.25+i*step,max))
  ctx.restore()
}
