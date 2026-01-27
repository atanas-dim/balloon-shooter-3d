import { type FC, useRef, useState } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Sphere } from '@react-three/drei/core/shapes'
import { Group, Mesh } from 'three'
import ExplodingParticles from '@/components/ExplodingParticles'
import { RigidBody } from '@react-three/rapier'

type BalloonProps = {
  ref?: React.Ref<Group>
  position: [number, number, number]
  color: string
  radius?: number
  onBurstComplete?: () => void
}

const Balloon: FC<BalloonProps> = ({ ref: groupRef, position, color, radius = 0.5, onBurstComplete }) => {
  const meshRef = useRef<Mesh>(null)
  const [isBursting, setIsBursting] = useState(false)

  const [isAsleep, setIsAsleep] = useState(false)

  // Call this on click to start the burst
  const triggerBurst = () => {
    if (isBursting) return

    setIsBursting(true)

    let scale = 1

    const animateBalloon = () => {
      if (!meshRef.current) return
      scale *= 0.6
      meshRef.current.scale.setScalar(scale)
      if (scale > 0.01) {
        requestAnimationFrame(animateBalloon)
      }
    }

    animateBalloon()
  }

  return (
    <RigidBody
      onSleep={() => setIsAsleep(true)}
      onWake={() => setIsAsleep(false)}
      onCollisionEnter={triggerBurst}
      colliders="ball">
      <group ref={groupRef} position={position}>
        <Sphere
          ref={(ref) => {
            if (ref) {
              meshRef.current = ref
            }
          }}
          args={[radius, 24, 24]}
          // onClick={(e) => {
          //   e.stopPropagation()
          //   triggerBurst()
          // }}
        >
          <meshStandardMaterial
            color={isAsleep ? 'blue' : color}
            transparent={true}
            opacity={0.5}
            metalness={0.65}
            roughness={0.2}
          />
        </Sphere>

        {isBursting && <ExplodingParticles color={color} onBurstComplete={onBurstComplete} />}
      </group>
    </RigidBody>
  )
}

export default Balloon
