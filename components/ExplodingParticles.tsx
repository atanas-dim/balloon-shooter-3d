import { type FC, useEffect, useRef, useState } from 'react'
import { Mesh, Vector3 } from 'three'

// X/Z: random in [-max, max], Y: random in [min, max]
const getVelocity = (min: number, max: number) => {
  const randX = (Math.random() - 0.5) * 2 * max
  const randY = Math.random() * (max - min) + min
  const randZ = (Math.random() - 0.5) * 2 * max
  return new Vector3(randX, randY, randZ)
}

const getRotation = () => {
  return Math.random() * Math.PI * 2
}

type ExplodingParticlesProps = {
  color?: string
  count?: number
  duration?: number
  onBurstComplete?: () => void
}

const ExplodingParticles: FC<ExplodingParticlesProps> = ({
  color = '#ffffff',
  count = 10,
  duration = 2,
  onBurstComplete,
}) => {
  const [particles] = useState<
    {
      velocity: Vector3
      rotation: number
    }[]
  >(
    new Array(count).fill(undefined).map(() => ({
      velocity: getVelocity(-0.2, 0.2),
      rotation: getRotation(),
    })),
  )
  // Store refs to meshes
  const meshRefs = useRef<Mesh[]>([])

  // Animation start time
  const startTime = useRef(0)

  useEffect(() => {
    startTime.current = performance.now()
    function animate() {
      const now = performance.now()
      const elapsed = (now - startTime.current) / 1000
      for (let i = 0; i < particles.length; i++) {
        const mesh = meshRefs.current[i]
        if (!mesh) continue
        // Physics: s = v0 * t + 0.5 * a * t^2
        const v0 = particles[i].velocity
        const t = elapsed
        // Gravity
        const g = 0.8 // slightly stronger gravity for visible arc
        const pos = new Vector3(...mesh.position.toArray())
        pos.x += v0.x * t
        pos.y += v0.y * t - 0.5 * g * t * t
        pos.z += v0.z * t
        mesh.position.copy(pos)
        // Fade out
        // const opacity = 1 - t / duration
        // mesh.material.opacity = opacity > 0 ? opacity : 0
        // Optionally animate rotation
        mesh.rotation.set(particles[i].rotation, particles[i].rotation, particles[i].rotation)
      }
      console.log({ elapsed, duration })
      if (elapsed < duration) {
        requestAnimationFrame(animate)
      }

      if (elapsed >= duration) {
        // Call the completion callback if provided
        if (onBurstComplete) onBurstComplete()
      }
    }
    requestAnimationFrame(animate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, particles])

  return (
    <>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el
          }}
          rotation={[p.rotation, p.rotation, p.rotation]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial color={color} transparent opacity={1} />
        </mesh>
      ))}
    </>
  )
}

export default ExplodingParticles
