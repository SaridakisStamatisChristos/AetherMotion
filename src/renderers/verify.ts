import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import type { Film } from '../scene/types.js'
const run = promisify(execFile)

/** Count decoded frames, check the media contract, then strictly decode every frame. */
export async function verify(film: Film, file: string) {
  const path = resolve(file)
  const result = await run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',path])
  const info = JSON.parse(result.stdout)
  const videos = info.streams.filter((s: {codec_type:string}) => s.codec_type==='video')
  const video = videos[0]
  if (videos.length!==1 || !info.format.format_name.split(',').includes('mp4')) throw new Error('Expected an MP4 with one video track')
  const [numerator,denominator] = video.avg_frame_rate.split('/').map(Number)
  const duration = Number(video.duration)
  if (video.codec_name!=='h264' || video.pix_fmt!=='yuv420p' || video.width!==film.width || video.height!==film.height ||
      Number(video.nb_read_frames)!==film.durationFrames || numerator/denominator!==film.fps ||
      !Number.isFinite(duration) || Math.abs(duration-film.durationFrames/film.fps)>0.00001)
    throw new Error('Encoded video differs from scene spec: '+JSON.stringify(video))
  await run('ffmpeg',['-v','error','-xerror','-err_detect','explode','-i',path,'-map','0:v:0','-f','null','-'])
  return {frames:Number(video.nb_read_frames),width:video.width,height:video.height,duration,fps:film.fps,codec:video.codec_name,decoded:true}
}
