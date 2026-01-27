import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Cylinder } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'

const PROJECTILE_SPEED = 10

const Gun = () => {
  const { camera, size } = useThree()
  const gunRef = useRef<Group>(null)
  const [projectiles, setProjectiles] = useState<
    {
      position: Vector3
      direction: Vector3
      key: number
    }[]
  >([])

  // Track mouse position in normalized device coordinates
  const aimRef = useRef({ x: 0, y: 0 })

  // Mouse move handler (global)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      console.log('MOVE')

      aimRef.current = {
        x: (e.clientX / size.width) * 2 - 1,
        y: -(e.clientY / size.height) * 2 + 1,
      }
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [size.width, size.height])

  // Fire projectile (global click)
  useEffect(() => {
    const handlePointerDown = () => {
      const vec = new Vector3(aimRef.current.x, aimRef.current.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
      setProjectiles((prev) => [
        ...prev,
        {
          position: camera.position.clone(),
          direction: vec.clone(),
          key: Math.random(),
        },
      ])
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [camera])

  // Animate gun to follow aim
  useFrame(() => {
    if (gunRef.current) {
      // Place gun at bottom center, rotate to aim
      const target = new Vector3(aimRef.current.x, aimRef.current.y, 0.5).unproject(camera)
      gunRef.current.lookAt(target)
    }
  })

  return (
    <>
      {/* Gun */}
      <group
        ref={gunRef}
        position={[0, 0, 5]} // adjust as needed
      >
        <Cylinder args={[0.1, 0.1, 1, 16]} position={[0, 0.5, 0]} />
      </group>
      {/* Projectiles */}
      {projectiles.map((p) => {
        // Compute quaternion to rotate cylinder (default up Y) to direction
        const q = new Group().quaternion
        q.setFromUnitVectors(
          new Vector3(0, 1, 0), // default up
          p.direction.clone().normalize(),
        )
        return (
          <RigidBody
            key={p.key}
            position={p.position}
            linearVelocity={p.direction.clone().multiplyScalar(PROJECTILE_SPEED).toArray() as [number, number, number]}
            colliders="cuboid">
            <Cylinder args={[0.05, 0.05, 0.5, 8]} quaternion={[q.x, q.y, q.z, q.w]} />
          </RigidBody>
        )
      })}
    </>
  )
}

export default Gun
