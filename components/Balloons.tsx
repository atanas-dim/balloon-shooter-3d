import { useRef, useEffect, type FC, useMemo } from 'react'

import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three/src/math/Vector3.js'

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

function createInstance(): InstancedRigidBodyProps {
  return {
    key: 'instance_' + Math.random(),
    position: [Math.random() * -10, 0, Math.random() * -10],
    rotation: [0, 0, 0],
  }
}

const Balloons: FC = () => {
  const rigidBodies = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const initialPositions = useMemo(() => Array.from({ length: COUNT }, createInstance), [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!rigidBodies.current) return
      const i = activeIndexRef.current
      const body = rigidBodies.current[i]
      if (!body) return

      // Set to dynamic and give it an upward velocity
      body.setBodyType(3, true)
      // body.setTranslation(initialPositions[i].position, true)
      body.setLinvel({ x: 0, y: 5, z: 0 }, true)

      // After FLY_TIME, reset to initial position and fix
      setTimeout(() => {
        body.setBodyType(1, true)
        const pos = initialPositions[i].position
        if (Array.isArray(pos)) body.setTranslation(new Vector3(...pos), true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }, FLY_TIME)

      // Move to next index (wrap around)
      activeIndexRef.current = (i + 1) % COUNT
    }, EMIT_INTERVAL)
    return () => clearInterval(interval)
  }, [initialPositions])

  return (
    <InstancedRigidBodies
      ref={rigidBodies}
      instances={initialPositions}
      colliders="ball"
      type="fixed"
      onCollisionEnter={(event) => {
        console.log({ colision: event })
      }}>
      <instancedMesh args={[undefined, undefined, COUNT]} position={[5, -8, 5]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e63946" />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}

export default Balloons
