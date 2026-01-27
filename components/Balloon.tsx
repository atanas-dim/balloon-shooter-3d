import { type FC, useRef, useState } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei/core/shapes'
import { Group, Mesh } from 'three'
import { ExplodingParticles } from '@/components/ExplodingParticles'

type BalloonProps = {
  ref?: React.Ref<Group>
  position: [number, number, number]
  color: string
  radius?: number
  onBurstComplete?: () => void
}

const Balloon: FC<BalloonProps> = ({ ref: groupRef, position, color, radius = 0.5, onBurstComplete }) => {
  const meshRef = useRef<Mesh>(null)
  const [burst, setBurst] = useState(false)

  const burstDuration = 40 // frames
  const burstFrame = useRef(0)

  // Call this on click to start the burst
  const triggerBurst = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (burst) return
    setBurst(true)

    burstFrame.current = 0
  }

  useFrame(() => {
    // Animate balloon scale down
    if (burst && meshRef.current) {
      meshRef.current.scale.multiplyScalar(0.5)
    }

    // Remove balloon after burst animation
    if (burst) {
      burstFrame.current++
      if (burstFrame.current > burstDuration) {
        if (onBurstComplete) onBurstComplete()
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Balloon */}
      <Sphere
        ref={(ref) => {
          if (ref) {
            meshRef.current = ref
          }
        }}
        args={[radius, 12, 12]}
        onClick={triggerBurst}>
        <meshStandardMaterial color={color} transparent={true} opacity={0.5} metalness={0.65} roughness={0.2} />
      </Sphere>
      {burst && <ExplodingParticles color={color} />}
    </group>
  )
}

export default Balloon
