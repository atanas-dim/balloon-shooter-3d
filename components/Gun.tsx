import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Cylinder } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'

const PROJECTILE_SPEED = 30

type Projectile = {
  position: Vector3
  direction: Vector3
  key: number
  created: number
}

const ProjectileComponent = ({ position, direction }: { position: Vector3; direction: Vector3 }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 15000)
    return () => clearTimeout(timeout)
  }, [])

  if (!visible) return null

  // Compute quaternion to rotate cylinder (default up Y) to direction
  const q = new Group().quaternion
  q.setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())

  return (
    <RigidBody
      position={position}
      linearVelocity={direction.clone().multiplyScalar(PROJECTILE_SPEED).toArray() as [number, number, number]}
      colliders="cuboid">
      <Cylinder args={[0.05, 0.05, 0.5, 8]} quaternion={[q.x, q.y, q.z, q.w]}>
        <meshStandardMaterial color="#222" />
      </Cylinder>
    </RigidBody>
  )
}

const Gun = () => {
  const { camera, size } = useThree()
  const gunRef = useRef<Group>(null)
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const aimRef = useRef({ x: 0, y: 0 })

  // Mouse move handler (global)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
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
      // Calculate the direction the gun is aiming
      const aimVec = new Vector3(aimRef.current.x, aimRef.current.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()

      // Get the gun's muzzle world position (tip of the cylinder after rotation)
      if (!gunRef.current) return
      // The muzzle is at the tip of the gun mesh: local position [0, 0, 0.5] (matches Cylinder position and rotation)
      const muzzleLocal = new Vector3(0, 0, 0.5)
      const muzzleWorld = muzzleLocal.clone().applyMatrix4(gunRef.current.matrixWorld)

      const projectile: Projectile = {
        position: muzzleWorld,
        direction: aimVec,
        key: Math.random(),
        created: Date.now(),
      }
      setProjectiles((prev) => [...prev, projectile])
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [camera])

  // Animate gun to follow aim
  useFrame(() => {
    if (gunRef.current) {
      // Set gun position to camera position plus an offset (e.g., in front of camera)
      const offset = new Vector3(0, -0.2, -1) // adjust as needed
      const worldOffset = offset.applyQuaternion(camera.quaternion)
      gunRef.current.position.copy(camera.position).add(worldOffset)

      // Calculate the aim direction (with negation if desired)
      const aimVec = new Vector3(aimRef.current.x, aimRef.current.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
      // The gun's world position (after position update)
      const gunWorldPos = gunRef.current.getWorldPosition(new Vector3())
      // Look at a distant point along the aim direction
      const farTarget = gunWorldPos.clone().add(aimVec.multiplyScalar(100))
      gunRef.current.lookAt(farTarget)
    }
  })
  console.log({ projectiles })

  return (
    <>
      {/* Gun */}
      <group ref={gunRef} position={[0, 0, 5]} receiveShadow>
        {/* Gun barrel: Cylinder, muzzle at [0, 0, 0.5] in local space, aligned along Z axis */}
        <Cylinder args={[0.1, 0.1, 1, 16]} position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888" />
        </Cylinder>
      </group>
      {/* Projectiles */}
      {projectiles.map((p) => (
        <ProjectileComponent key={p.key} position={p.position} direction={p.direction} />
      ))}
    </>
  )
}

export default Gun
