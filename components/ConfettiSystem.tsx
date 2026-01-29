import { useRef, useMemo, type FC, useEffect } from 'react'
import { InstancedMesh, Object3D, Color } from 'three'
import { useFrame } from '@react-three/fiber'

const CONFETTI_COUNT = 500

function randomVelocity(): [number, number, number] {
  // Random velocity vector
  return [(Math.random() - 0.5) * 2, Math.random() * 2 + 1, (Math.random() - 0.5) * 2]
}

export type Burst = { position: [number, number, number]; color: string }

type ConfettiSystemProps = {
  bursts: Burst[]
}

const ConfettiSystem: FC<ConfettiSystemProps> = ({ bursts }) => {
  // bursts: [{ position: [x, y, z], color: '#ff0' }, ...]
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  // Pool of particle data
  const particles = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      active: false,
      position: [0, 0, 0] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number],
      color: new Color(),
      age: 0,
      duration: 1.5,
    })),
  )

  // Activate particles for a burst
  function triggerBurst({ position, color }: { position: [number, number, number]; color: string }) {
    let activated = 0
    for (let i = 0; i < CONFETTI_COUNT && activated < 20; i++) {
      const p = particles.current[i]
      if (!p.active) {
        p.active = true
        p.position = [...position]
        p.velocity = randomVelocity()
        p.color.set(color)
        p.age = 0
        p.duration = 1.5 + Math.random() * 0.5
        activated++
      }
    }
  }

  // Listen for new bursts
  useEffect(() => {
    // Only trigger bursts for new burst objects
    if (bursts.length > 0) {
      bursts.forEach((burst) => triggerBurst(burst))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bursts)])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    let i = 0
    for (const p of particles.current) {
      if (p.active) {
        p.age += delta
        // Simple physics
        p.position[0] += p.velocity[0] * delta
        p.position[1] += p.velocity[1] * delta - 0.5 * 9.8 * p.age * delta
        p.position[2] += p.velocity[2] * delta
        // Fade out and deactivate
        if (p.age > p.duration || p.position[1] < 0) {
          p.active = false
        } else {
          dummy.position.set(...p.position)
          dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, dummy.matrix)
          meshRef.current.setColorAt(i, p.color)
        }
      }
      i++
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]}>
      <planeGeometry args={[0.08, 0.04]} />
      <meshStandardMaterial vertexColors transparent opacity={0.9} />
    </instancedMesh>
  )
}

export default ConfettiSystem
