import type { Point } from '../scene/types.js'

// Original single-line lettering. Each pair of digits is one pen coordinate
// on a 5×7 grid. Spaces lift the pen; character advance is six grid units.
const glyphs: Record<string,string> = {
  A:'062046 1444', B:'06003041423003 033344453606',
  C:'413000010505163646', D:'06002041452406', E:'40000646 0333',
  F:'060040 0333', G:'413010010505163646434323', H:'0006 4046 0343',
  I:'0040 2026 0646', J:'00404045361605', K:'0006 400346',
  L:'000646', M:'0600234046', N:'06004640', O:'103041451636050110',
  P:'06003041423303', Q:'103041453616050110 2346', R:'06003041423303 2346',
  S:'413010010212324345361605', T:'0040 2026', U:'000516364540',
  V:'002640', W:'0016233640', X:'0046 4006', Y:'002340 2326',
  Z:'00400646', '0':'103041453616050110', '1':'112026 0636',
  '2':'01103041420646', '3':'003041422343453606', '4':'300444 3036',
  '5':'4000033344453606', '6':'403010010505163645443303',
  '7':'004016', '8':'103041423303020110 033344453616050503',
  '9':'4343030201103041453616', '-':'0343', '.':'2526', ' ':''
}
export function letters(text: string, size: number): Point[][] {
  const paths: Point[][] = []
  const unit = size / 7
  for (let i=0;i<text.length;i++) {
    for (const pen of glyphs[text[i]].split(' ').filter(Boolean)) {
      const line: Point[] = []
      for (let j=0;j<pen.length;j+=2) line.push([(i*6+Number(pen[j]))*unit,Number(pen[j+1])*unit])
      paths.push(line)
    }
  }
  return paths
}
export function arrow(dx:number,dy:number,head:number): Point[][] {
  const angle = Math.atan2(dy,dx)
  const wing = (side:number): Point => [dx-head*Math.cos(angle+side*.5),dy-head*Math.sin(angle+side*.5)]
  return [[[0,0],[dx,dy]],[wing(-1),[dx,dy],wing(1)]]
}
export interface Ink {paths: Point[][]; lengths: number[]; total:number}
export function measure(paths:Point[][]): Ink {
  const lengths = paths.map(points => points.slice(1).reduce((n,p,i) => n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0))
  return {paths,lengths,total:lengths.reduce((a,b)=>a+b,0)}
}
/** Draw a continuous prefix across multiple pen lifts. */
export function write(ctx:CanvasRenderingContext2D, ink:Ink, progress:number) {
  let remaining = ink.total * progress
  ctx.beginPath()
  for(let i=0;i<ink.paths.length && remaining>0;i++) {
    const points = ink.paths[i]
    ctx.moveTo(...points[0])
    if (ink.lengths[i] <= remaining) {
      for (const p of points.slice(1)) ctx.lineTo(...p)
      remaining -= ink.lengths[i]
      continue
    }
    for(let j=1;j<points.length && remaining>0;j++) {
      const [x,y] = points[j-1], dx = points[j][0]-x, dy = points[j][1]-y
      const length = Math.hypot(dx,dy)
      if (length===0) continue
      const k = Math.min(1,remaining/length)
      ctx.lineTo(x+dx*k,y+dy*k)
      remaining -= length
    }
  }
  ctx.stroke()
}
