import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import type { Film } from './types.js'

/** Preflight and cache local raster assets under the scene directory. */
export async function loadAssets(film: Film, directory: string) {
  const root = await realpath(directory)
  const assets: Record<string,string> = Object.create(null)
  let total = 0
  for (const [id,path] of Object.entries(film.assets ?? {})) {
    if (isAbsolute(path) || path.split('/').includes('..')) throw new Error(id + ': expected a relative asset path inside scene directory')
    const actual = await realpath(resolve(root,path)).catch(() => {throw new Error(id + ': missing asset ' + path)})
    const rel = relative(root,actual)
    if (rel === '..' || rel.startsWith('..'+sep)) throw new Error(id + ': asset escapes scene directory')
    const metadata = await stat(actual)
    total += metadata.size
    if (!metadata.isFile() || metadata.size > 8*1024**2 || total > 32*1024**2) throw new Error(id + ': asset exceeds size limit or is not a file')
    const bytes = await readFile(actual)
    const png = bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))
    if (!png && !bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))) throw new Error(id + ': expected a PNG or JPEG signature')
    assets[id] = 'data:image/'+(png?'png':'jpeg')+';base64,'+bytes.toString('base64')
  }
  return assets
}
