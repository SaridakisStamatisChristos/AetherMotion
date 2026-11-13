import * as THREE from 'three'
import type { Shape, World, VectorTrack } from './types.js'
import { parseObj } from './obj.js'
import { sample } from '../../timeline/sample.js'

export function vectorAt(track:VectorTrack | undefined, frame:number, fallback=0) {
  return new THREE.Vector3(sample(track?.[0],frame,fallback),sample(track?.[1],frame,fallback),sample(track?.[2],frame,fallback))
}

function geometry(shape:Shape, assets:Record<string,string>): THREE.BufferGeometry {
  switch(shape.kind) {
    case 'box': return new THREE.BoxGeometry(...shape.size)
    case 'sphere': return new THREE.SphereGeometry(shape.radius,40,24)
    case 'torus': return new THREE.TorusGeometry(shape.radius,shape.tube,16,80)
    case 'cylinder': return new THREE.CylinderGeometry(shape.radiusTop,shape.radiusBottom,shape.height,48)
    case 'obj': {
      const result = new THREE.BufferGeometry()
      result.setAttribute('position',new THREE.BufferAttribute(parseObj(assets[shape.asset],shape.asset),3))
      result.computeVertexNormals()
      return result
    }
  }
}

/** One shot's geometry and materials are reused across arbitrary seeks. */
export class WorldScene {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private readonly meshes: THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[] = []
  constructor(private readonly world:World, aspect:number, background:string, assets:Record<string,string>) {
    this.scene.background = new THREE.Color(background)
    this.camera = new THREE.PerspectiveCamera(world.camera.fov,aspect,.05,10000)
    for(const definition of world.lights) {
      const light = definition.kind === 'ambient'
        ? new THREE.AmbientLight(definition.color,definition.intensity)
        : new THREE.DirectionalLight(definition.color,definition.intensity)
      if(definition.kind==='directional') light.position.set(...definition.position)
      this.scene.add(light)
    }
    for(const model of world.models) {
      const material = new THREE.MeshStandardMaterial({color:model.material.color,
        metalness:model.material.metalness ?? 0,roughness:model.material.roughness ?? .65,
        flatShading:model.material.flat ?? false})
      const mesh = new THREE.Mesh(geometry(model.shape,assets),material)
      mesh.name=model.id
      this.meshes.push(mesh)
      this.scene.add(mesh)
    }
  }
  seek(frame:number) {
    this.camera.position.copy(vectorAt(this.world.camera.position,frame))
    const target = vectorAt(this.world.camera.target,frame)
    if(this.camera.position.distanceToSquared(target)<1e-12) throw new Error('3D camera coincides with target at frame '+frame)
    this.camera.lookAt(target)
    this.world.models.forEach((model,i)=>{
      const mesh = this.meshes[i]
      mesh.position.copy(vectorAt(model.position,frame))
      const r = vectorAt(model.rotation,frame).multiplyScalar(Math.PI/180)
      mesh.rotation.set(r.x,r.y,r.z)
      mesh.scale.copy(vectorAt(model.scale,frame,1))
    })
  }
  dispose() {
    for(const mesh of this.meshes) {mesh.geometry.dispose(); mesh.material.dispose()}
    this.scene.clear()
  }
}
