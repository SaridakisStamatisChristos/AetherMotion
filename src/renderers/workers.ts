import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { chromium } from 'playwright-core'
import type { Film } from '../scene/types.js'
import type {} from './browser.js'

export type Backend = 'chromium' | 'native'
type Batch = (start:number,end:number) => Promise<Uint8Array[]>
interface Pool {lanes: Batch[]; close(): Promise<void>}

/** Initialize independent frame workers and decode shared assets once per worker. */
export async function openPool(backend: Backend, count: number, film: Film, assets: Record<string,string>): Promise<Pool> {
  const lanes: Batch[] = []
  if (backend==='native') {
    const workers: Worker[] = []
    const close = async () => {await Promise.all(workers.map(w => w.terminate()))}
    try {
      for(let i=0;i<count;i++) {
        const w = new Worker(new URL('./native-worker.js',import.meta.url),{workerData:{film,assets}})
        workers.push(w)
        await once(w,'message')
        lanes.push(async (start,end) => {
          const response = once(w,'message')
          w.postMessage([start,end])
          return (await response)[0]
        })
      }
    } catch(error) {await close(); throw error}
    return {lanes,close}
  }
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
  const browser = await chromium.launch({executablePath,headless:true})
  try {
    for(let i=0;i<count;i++) {
      const page = await browser.newPage()
      await page.route('**/*', r => r.abort())
      await page.addScriptTag({path:fileURLToPath(new URL('../painter.js',import.meta.url))})
      await page.evaluate(([spec,images]) => window.motion.init(spec,images),[film,assets] as const)
      lanes.push(async (start,end) => {
        const data = await page.evaluate(([a,b]) => {
          const result: string[] = []
          for(let index=a;index<b;index++) result.push(window.motion.frame(index))
          return result
        },[start,end])
        return data.map(frame => Buffer.from(frame,'base64'))
      })
    }
  } catch(error) {await browser.close(); throw error}
  return {lanes,close:() => browser.close()}
}
