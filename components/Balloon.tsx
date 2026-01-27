import { type FC, useRef } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three/src/math/Vector3.js'
import { Sphere } from '@react-three/drei/core/shapes'
import { Mesh } from 'three'

type BalloonProps = {
  ref?: React.Ref<Mesh>
  position: [number, number, number]
  color: string
  radius?: number
  onBurstComplete?: () => void
}

type BurstData = {
  velocities: Vector3[]
  original: Vector3[]
  frame: number
}

const Balloon: FC<BalloonProps> = ({ ref: refFromParent, position, color, radius = 0.5, onBurstComplete }) => {
  const meshRef = useRef<Mesh>(null)
  const burstData = useRef<BurstData | null>(null)
  const bursting = useRef(false)
  const burstDuration = 40 // frames

  // Call this on click to start the burst
  const triggerBurst = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    console.log('Balloon burst triggered', meshRef.current)
    if (!meshRef.current) return
    const geometry = meshRef.current.geometry

    if (geometry.index) {
      meshRef.current.geometry = geometry.toNonIndexed()
    }
    const newGeometry = meshRef.current.geometry
    const posAttr = newGeometry.getAttribute('position')
    const normals = newGeometry.getAttribute('normal')
    // Store original positions and per-face velocities
    const velocities = []
    const original = []
    for (let i = 0; i < posAttr.count; i++) {
      original.push(new Vector3().fromBufferAttribute(posAttr, i))
      // Each vertex gets a velocity in the direction of its normal, randomized a bit
      const n = new Vector3().fromBufferAttribute(normals, i)
      velocities.push(n.multiplyScalar(0.01 + Math.random() * 0.01))
    }
    burstData.current = { velocities, original, frame: 0 }
    bursting.current = true
  }

  useFrame(() => {
    if (!meshRef.current) return
    if (!bursting.current || !burstData.current) return
    const { velocities, original, frame } = burstData.current
    const geometry = meshRef.current.geometry
    const posAttr = geometry.getAttribute('position')

    for (let i = 0; i < posAttr.count; i++) {
      // Guard: skip if original[i] or velocities[i] is undefined
      if (!original[i] || !velocities[i]) continue
      // Move each vertex outward
      const v = original[i].clone().add(velocities[i].clone().multiplyScalar(frame))
      posAttr.setXYZ(i, v.x, v.y, v.z)
    }
    posAttr.needsUpdate = true
    burstData.current.frame++
    // Optionally fade out the material
    // if (meshRef.current.material.opacity > 0) {
    //   meshRef.current.material.opacity -= 0.025
    // }
    // Remove mesh after burstDuration frames
    if (burstData.current.frame > burstDuration) {
      bursting.current = false
      if (onBurstComplete) onBurstComplete()
    }
  })

  return (
    <Sphere
      ref={(ref) => {
        if (ref) {
          meshRef.current = ref
          if (refFromParent) {
            if (typeof refFromParent === 'function') {
              refFromParent(ref)
            } else if (typeof refFromParent === 'object' && refFromParent !== null) {
              ;(refFromParent as React.MutableRefObject<Mesh | null>).current = ref
            }
          }
        }
      }}
      args={[radius, 12, 12]}
      position={position}
      onClick={triggerBurst}>
      <meshStandardMaterial color={color} transparent={true} opacity={0.5} metalness={0.65} roughness={0.2} />
    </Sphere>
  )
}

export default Balloon
