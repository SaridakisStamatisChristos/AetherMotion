export interface Datum {label:string; value:number}
/** Bars share a fixed quantitative scale throughout the entrance. */
export function bars(ctx:CanvasRenderingContext2D, data:Datum[], width:number, height:number, ceiling:number, progress:number, ink:string, size:number) {
  const fill = ctx.fillStyle, slot = width/data.length
  ctx.font = size+'px Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let i=0;i<data.length;i++) {
    const datum = data[i], h = height * (datum.value/ceiling) * progress
    const center = (i+.5)*slot
    ctx.fillStyle = fill; ctx.fillRect(center-slot*.29,-h,slot*.58,h)
    ctx.fillStyle = ink; ctx.fillText(datum.label,center,size+8,slot*.95)
    if(progress>0) ctx.fillText(String(datum.value),center,-h-7,slot*.95)
  }
}
/** Alternating labels around a horizontal chronological axis. */
export function milestones(ctx:CanvasRenderingContext2D, labels:string[], width:number, progress:number, ink:string, size:number) {
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(width*progress,0); ctx.stroke()
  ctx.font = size+'px Arial, sans-serif'
  for(let i=0;i<labels.length;i++) {
    const u = i/(labels.length-1)
    if(u>progress) break
    ctx.beginPath(); ctx.arc(u*width,0,6,0,Math.PI*2); ctx.fill()
    ctx.save(); ctx.fillStyle=ink; ctx.textAlign=i===0?'left':i===labels.length-1?'right':'center'
    ctx.fillText(labels[i],u*width,i%2===0?-18:30,width/(labels.length-1))
    ctx.restore()
  }
}
