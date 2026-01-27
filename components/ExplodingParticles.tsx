import { useEffect, useState } from 'react'
import { Vector3 } from 'three'

export function ExplodingParticles({ color = '#ffffff', count = 10, origin = [0, 0, 0] }) {
  const [confetti, setConfetti] = useState(() =>
    Array.from({ length: count }).map(() => ({
      position: new Vector3(...origin),
      velocity: new Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.15 + 0.08, (Math.random() - 0.5) * 0.2),
      color: color,
      opacity: 1,
      life: 0,
      rotation: Math.random() * Math.PI * 2,
    })),
  )

  useEffect(() => {
    let running = true
    function animate() {
      setConfetti((prev) =>
        prev.map((c) => {
          if (c.opacity <= 0) return c
          const newVelocity = c.velocity.clone()
          newVelocity.y -= 0.004 // gravity
          const newPosition = c.position.clone().add(newVelocity)
          return {
            ...c,
            velocity: newVelocity,
            position: newPosition,
            opacity: c.opacity - 0.012,
            life: c.life + 1,
          }
        }),
      )
      if (running) requestAnimationFrame(animate)
    }
    animate()
    return () => {
      running = false
    }
  }, [])

  return (
    <>
      {confetti.map(
        (c, i) =>
          c.opacity > 0 && (
            <mesh key={i} position={c.position.toArray()} rotation={[0, 0, c.rotation]}>
              <planeGeometry args={[0.12, 0.04]} />
              <meshStandardMaterial color={c.color} transparent opacity={c.opacity} />
            </mesh>
          ),
      )}
    </>
  )
}
