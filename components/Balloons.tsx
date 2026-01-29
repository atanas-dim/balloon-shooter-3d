import { useRef, useEffect, type FC, useMemo } from 'react'

import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three/src/math/Vector3.js'
import { useFrame } from '@react-three/fiber'

const COLORS = [
  '#e63946', // red
  '#f1faee', // white
  '#a8dadc', // light blue
  '#457b9d', // blue
  '#f4d35e', // yellow
  '#43aa8b', // green
  '#b5838d', // pink
  '#ff6f61', // coral
]

const COUNT = 100
const EMIT_INTERVAL = 2000 // ms
const FLY_TIME = 10000 // ms (how long a balloon flies before reset)

type RigidBodyUserData = {
  key: string
}

function createInstance(): InstancedRigidBodyProps {
  const key = 'instance_' + Math.random()
  const userData: RigidBodyUserData = { key }
  return {
    key,
    position: [Math.random() * -10, 0, Math.random() * -10],
    rotation: [0, 0, 0],
    userData,
  }
}

const Balloons: FC = () => {
  const rigidBodies = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const resetQueue = useRef<{ index: number; resetAt: number }[]>([])
  const initialPositions = useMemo(() => Array.from({ length: COUNT }, createInstance), [])

  const addToResetQueue = (index: number) => {
    resetQueue.current.push({ index, resetAt: performance.now() + FLY_TIME })
  }

  // Emit balloons at intervals
  useEffect(() => {
    const interval = setInterval(() => {
      if (!rigidBodies.current) return
      const index = activeIndexRef.current
      const body = rigidBodies.current[index]
      if (!body) return

      // Set to dynamic and give it an upward velocity
      body.setBodyType(3, true) // 3 = dynamic
      body.setLinvel({ x: 0, y: 5, z: 0 }, true)

      // Schedule reset in the queue
      addToResetQueue(index)

      // Move to next index (wrap around)
      activeIndexRef.current = (index + 1) % COUNT
    }, EMIT_INTERVAL)
    return () => clearInterval(interval)
  }, [initialPositions])

  const resetRigidBody = (index: number) => {
    const body = rigidBodies.current?.[index]
    if (body) {
      body.setBodyType(1, true) // 1 = fixed
      const pos = Array.isArray(initialPositions[index].position) ? initialPositions[index].position : [0, 0, 0]
      body.setTranslation(new Vector3(...pos), true)
    }
  }

  // Process reset queue in useFrame (safe for Rapier)
  useFrame(() => {
    const now = performance.now()
    resetQueue.current = resetQueue.current.filter(({ index, resetAt }) => {
      if (now >= resetAt) {
        resetRigidBody(index)
        return false // remove from queue
      }
      return true // keep in queue
    })
  })

  return (
    <InstancedRigidBodies
      ref={rigidBodies}
      instances={initialPositions}
      colliders="ball"
      type="fixed"
      position={[5, -8, 5]}
      onCollisionEnter={(e) => {
        if (!rigidBodies.current) return
        const key = (e.target.rigidBody?.userData as RigidBodyUserData)?.key
        if (!key) return
        const index = rigidBodies.current.findIndex((rb) => (rb.userData as RigidBodyUserData)?.key === key)
        if (index !== -1) {
          resetRigidBody(index)
        }
      }}>
      <instancedMesh args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e63946" />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}

export default Balloons
