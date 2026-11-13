import { WebGLRenderer } from 'three'
import { WorldScene } from '../engines/three/world.js'
import type { Shot } from '../scene/types.js'

/** Keep one WebGL context per worker and only the currently sampled scene resident. */
export class WebGLPass {
  private readonly renderer: WebGLRenderer
  private active?: {shot:Shot; content:WorldScene}
  constructor(private readonly width:number,private readonly height:number,private readonly assets:Record<string,string>) {
    try {this.renderer=new WebGLRenderer({antialias:true,preserveDrawingBuffer:true})}
    catch {throw new Error('Three.js requires WebGL 2. Enable GPU rendering or use AETHER_WEBGL=software with Chromium.')}
    this.renderer.setSize(width,height,false)
  }
  draw(shot:Shot,frame:number) {
    if(!shot.world) throw new Error('Missing world for '+shot.id)
    if(this.renderer.getContext().isContextLost()) throw new Error('WebGL context lost in '+shot.id+' at frame '+frame)
    if(this.active?.shot!==shot) {
      this.active?.content.dispose()
      this.active={shot,content:new WorldScene(shot.world,this.width/this.height,shot.background,this.assets)}
    }
    const {content}=this.active
    content.seek(frame)
    this.renderer.render(content.scene,content.camera)
    return this.renderer.domElement
  }
  dispose() {this.active?.content.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss()}
}
