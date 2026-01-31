import { useRef, useEffect, type FC, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { InstancedRigidBodies, RapierRigidBody, InstancedRigidBodyProps } from '@react-three/rapier'
import { Euler, Group, InstancedMesh, Quaternion, Vector3 } from 'three'
import { RigidBodyUserData } from './Balloons'

const INITIAL_PROJECTILE_POSITION: [number, number, number] = [0, -16, 0]

const PROJECTILE_POOL_SIZE = 100
const PROJECTILE_SPEED = 50
const MAX_DISTANCE = 100

const PROJECTILE_RESET_INTERVAL = 5000 // ms

function createInstance(): InstancedRigidBodyProps {
  const key = 'proj_' + Math.random()
  const userData: RigidBodyUserData = { key, type: 'projectile' }
  return {
    key: key,
    position: INITIAL_PROJECTILE_POSITION, // hidden by default
    rotation: [0, 0, 0],
    userData,
  }
}

const Gun: FC = () => {
  const { camera } = useThree()
  const gunRef = useRef<Group>(null)
  const rigidBodiesRef = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const lastProjectileResetRef = useRef(0)
  const meshRef = useRef<InstancedMesh>(null)

  const instances = useMemo(() => {
    return Array.from({ length: PROJECTILE_POOL_SIZE }, createInstance)
  }, [])

  // Fire projectile (global click/space)
  useEffect(() => {
    function fireProjectile() {
      // Use camera's forward direction
      const aimVec = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize()

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

      const body = rigidBodiesRef.current?.[idx]
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
  }, [camera, instances])

  const resetProjectile = (index: number) => {
    const body = rigidBodiesRef.current?.[index]
    if (body) {
      body.setBodyType(1, false) // 1 = fixed
      body.setTranslation(new Vector3(...INITIAL_PROJECTILE_POSITION), false)
      body.setLinvel({ x: 0, y: 0, z: 0 }, false)
    }
  }

  // Animate gun to follow camera and reset projectiles
  useFrame(() => {
    if (gunRef.current) {
      const offset = new Vector3(0, -0.4, -1)
      const worldOffset = offset.applyQuaternion(camera.quaternion)
      gunRef.current.position.copy(camera.position).add(worldOffset)

      // Always look straight ahead from the camera
      const aimVec = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize()
      const gunWorldPos = gunRef.current.getWorldPosition(new Vector3())
      const farTarget = gunWorldPos.clone().add(aimVec.multiplyScalar(100))
      gunRef.current.lookAt(farTarget)
    }

    // Only run projectile reset every 5 seconds
    const now = performance.now()
    if (now - lastProjectileResetRef.current < PROJECTILE_RESET_INTERVAL) return
    lastProjectileResetRef.current = now

    if (!rigidBodiesRef.current) return

    instances.forEach((_, index) => {
      const body = rigidBodiesRef.current?.[index]
      if (!body) return

      const pos = body.translation()
      const posVec = new Vector3(pos.x, pos.y, pos.z)
      if (posVec.distanceTo(camera.position) > MAX_DISTANCE) {
        resetProjectile(index)
      }
    })
  })

  if (!instances) return null

  return (
    <>
      {/* Gun */}
      <group ref={gunRef} position={[0, 0, 5]} receiveShadow>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.1, 1, 32]} />
          <meshPhysicalMaterial color="#515151" metalness={0.65} roughness={0.4} />
        </mesh>
      </group>

      {/* Instanced Projectiles */}
      <InstancedRigidBodies
        ref={rigidBodiesRef}
        instances={instances}
        colliders="cuboid"
        type="fixed"
        mass={0.01}
        friction={0}
        restitution={0}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, PROJECTILE_POOL_SIZE]} frustumCulled={false}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 32]} />
          <meshPhysicalMaterial color="#222" />
        </instancedMesh>
      </InstancedRigidBodies>
    </>
  )
}

export default Gun
