import { type FC, useEffect, useRef, useState } from 'react'
import { Mesh, Vector3 } from 'three'

const SHAPES = ['plane', 'circle', 'triangle'] as const

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

const getRandomShape = () => {
  const index = Math.floor(Math.random() * SHAPES.length)
  return SHAPES[index]
}

type ExplodingParticlesProps = {
  position?: [number, number, number]
  color?: string
  count?: number
  duration?: number
  onBurstComplete?: () => void
}

const ExplodingParticles: FC<ExplodingParticlesProps> = ({
  position = [0, 0, 0],
  color = '#ffffff',
  count = 10,
  duration = 2,
  onBurstComplete,
}) => {
  const [particles] = useState<
    {
      velocity: Vector3
      rotation: number
      shape: (typeof SHAPES)[number]
    }[]
  >(
    new Array(count).fill(undefined).map(() => ({
      velocity: getVelocity(-0.2, 0.2),
      rotation: getRotation(),
      shape: getRandomShape(),
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

        const velocity = particles[i].velocity
        // Gravity
        const gravity = 0.8
        const pos = new Vector3(...mesh.position.toArray())
        // Official kinematic equations for projectile motion:
        // x = velocity.x * time
        // y = velocity.y * time - 0.5 * g * time^2
        // z = velocity.z * time
        pos.x += velocity.x * elapsed
        pos.y += velocity.y * elapsed - 0.5 * gravity * elapsed * elapsed
        pos.z += velocity.z * elapsed
        mesh.position.copy(pos)

        // Fade out
        // const opacity = 1 - t / duration
        // mesh.material.opacity = opacity > 0 ? opacity : 0

        const newRotation = particles[i].rotation + elapsed * 10

        mesh.rotation.set(newRotation, newRotation, newRotation)
      }

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
    <group position={position}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el
          }}
          rotation={[p.rotation, p.rotation, p.rotation]}>
          {p.shape === 'circle' && <circleGeometry args={[0.06, 12]} />}
          {p.shape === 'triangle' && (
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0.06, 0, -0.06, -0.06, 0, 0.06, -0.06, 0]), 3]}
                count={3}
                itemSize={3}
              />
            </bufferGeometry>
          )}
          {p.shape === 'plane' && <planeGeometry args={[0.12, 0.06]} />}
          <meshStandardMaterial color={color} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  )
}

export default ExplodingParticles
