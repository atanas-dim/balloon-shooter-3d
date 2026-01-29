import { useRef, useEffect, type FC, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { InstancedRigidBodies, RapierRigidBody, InstancedRigidBodyProps } from '@react-three/rapier'
import { Euler, Group, Quaternion, Vector3 } from 'three'

const PROJECTILE_POOL_SIZE = 100
const PROJECTILE_SPEED = 30
const MAX_DISTANCE = 100

function createInstance(): InstancedRigidBodyProps {
  return {
    key: 'proj_' + Math.random(),
    position: [0, -1000, 0], // hidden by default
    rotation: [0, 0, 0],
  }
}

const Gun: FC = () => {
  const { camera, size } = useThree()
  const gunRef = useRef<Group>(null)
  const aimRef = useRef({ x: 0, y: 0 })
  const projectileBodiesRef = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const instances = useMemo(() => Array.from({ length: PROJECTILE_POOL_SIZE }, createInstance), [])

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

  // Fire projectile (global click/space)
  useEffect(() => {
    function fireProjectile() {
      const aimVec = new Vector3(aimRef.current.x, aimRef.current.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()

      if (!gunRef.current) {
        console.log('No gunRef.current!')
        return
      }
      const muzzleLocal = new Vector3(0, 0, 0.5)
      const muzzleWorld = muzzleLocal.clone().applyMatrix4(gunRef.current.matrixWorld)

      const idx = activeIndexRef.current
      const instance = instances[idx]
      instance.position = muzzleWorld.toArray()

      // Compute quaternion to rotate Y axis to aimVec
      const q = new Quaternion()
      q.setFromUnitVectors(new Vector3(0, 1, 0), aimVec)
      const euler = new Euler().setFromQuaternion(q, 'XYZ')
      instance.rotation = [euler.x, euler.y, euler.z]

      const body = projectileBodiesRef.current?.[idx]
      if (body) {
        body.setBodyType(3, true)
        body.setTranslation({ x: muzzleWorld.x, y: muzzleWorld.y, z: muzzleWorld.z }, true)
        body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true)
        body.setLinvel(
          { x: aimVec.x * PROJECTILE_SPEED, y: aimVec.y * PROJECTILE_SPEED, z: aimVec.z * PROJECTILE_SPEED },
          true,
        )
      }
      activeIndexRef.current = (idx + 1) % PROJECTILE_POOL_SIZE
    }

    const handlePointerDown = () => fireProjectile()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') fireProjectile()
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  // Animate gun to follow aim and reset projectiles
  useFrame(() => {
    if (gunRef.current) {
      const offset = new Vector3(0, -0.4, -1)
      const worldOffset = offset.applyQuaternion(camera.quaternion)
      gunRef.current.position.copy(camera.position).add(worldOffset)

      const aimVec = new Vector3(aimRef.current.x, aimRef.current.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
      const gunWorldPos = gunRef.current.getWorldPosition(new Vector3())
      const farTarget = gunWorldPos.clone().add(aimVec.multiplyScalar(100))
      gunRef.current.lookAt(farTarget)
    }

    // if (!projectileBodiesRef.current) return
    // instances.forEach((instance, i) => {
    //   const body = projectileBodiesRef.current?.[i]
    //   if (!body) {
    //     // This can happen on first frame
    //     return
    //   }
    //   const pos = body.translation()
    //   const posVec = new Vector3(pos.x, pos.y, pos.z)
    //   if (posVec.distanceTo(camera.position) > MAX_DISTANCE) {
    //     console.log('Resetting projectile', i, 'pos:', posVec.toArray(), 'camera:', camera.position.toArray())
    //     body.setBodyType(1, true) // 1 = fixed
    //     instance.position = [0, -1000, 0]
    //     body.setTranslation({ x: 0, y: -1000, z: 0 }, true)
    //     body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    //   }
    // })
  })

  return (
    <>
      {/* Gun */}
      <group ref={gunRef} position={[0, 0, 5]} receiveShadow>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.1, 1, 32]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>
      {/* Instanced Projectiles */}
      <InstancedRigidBodies
        ref={projectileBodiesRef}
        position={[0, 0, 0.85]}
        instances={instances}
        colliders="cuboid"
        type="fixed">
        <instancedMesh args={[undefined, undefined, PROJECTILE_POOL_SIZE]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 32]} />
          <meshStandardMaterial color="#222" />
        </instancedMesh>
      </InstancedRigidBodies>
    </>
  )
}

export default Gun
