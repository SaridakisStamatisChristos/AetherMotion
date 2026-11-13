/** Read the standalone triangle/polygon subset of OBJ. All references stay in this file. */
export function parseObj(source:string, label:string): Float32Array {
  const vertices: number[][] = []
  const triangles: number[] = []
  let line = 0
  const fail = (reason:string): never => {throw new Error(label+' line '+line+': '+reason)}
  for (const raw of source.split(/\r?\n/)) {
    line++
    const stripped = raw.split('#',1)[0].trim()
    if (!stripped) continue
    const [op,...args] = stripped.split(/\s+/)
    if (op === 'v') {
      const numbers = args.map(Number)
      if (vertices.length>=65536 || args.length!==3 || !numbers.every(x=>Number.isFinite(x)&&Math.abs(x)<=100000))
        fail('expected three finite vertex coordinates (max 65536 vertices)')
      vertices.push(numbers)
    } else if (op === 'f') {
      if (args.length<3 || args.length>64) fail('a convex face needs 3–64 vertex indices')
      const face = args.map(value=>{
        if (!/^[1-9]\d*$/.test(value) || Number(value)>vertices.length) fail('expected an existing positive vertex index')
        return vertices[Number(value)-1]
      })
      if (triangles.length+9*(face.length-2)>900000) fail('mesh exceeds 100000 triangles')
      for (let i=1;i<face.length-1;i++) triangles.push(...face[0],...face[i],...face[i+1])
    } else if (op!=='o' && op!=='g') fail('unsupported OBJ statement '+op+' (use vertices and standalone convex faces)')
  }
  if (!triangles.length) fail('mesh has no faces')
  return Float32Array.from(triangles)
}
