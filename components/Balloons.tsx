import { useFrame } from '@react-three/fiber'
import { useRef, useEffect, type FC, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js'
import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Color } from 'three'

type BalloonDef = {
  key: string
  x: number
  y: number
  z: number
  radius: number
  color: string
}

const COUNT = 100

const BALLOON_MIN_RADIUS = 0.3
const BALLOON_MAX_RADIUS = 0.6

const BALLOON_MIN_Z = -5
const BALLOON_MAX_Z = 0

const START_Y_CLOSEST = -3.5
const START_Y_FARTHEST = -8
// BALLOON_END_Y will be calculated dynamically based on viewport/camera
const EMIT_INTERVAL = 1000 // ms

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

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function getFrustumWidthAtZ(camera: PerspectiveCamera, z: number) {
  // z is in world coordinates relative to camera
  const camZ = camera.position.z
  const distance = Math.abs(camZ - z)
  const vFOV = (camera.fov * Math.PI) / 180 // vertical fov in radians
  const height = 2 * Math.tan(vFOV / 2) * distance
  return height * camera.aspect
}

function createInstance(): InstancedRigidBodyProps {
  return {
    key: 'instance_' + Math.random(),
    // position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
    position: [Math.random() * 10, 0, Math.random() * 10],
    rotation: [Math.random(), Math.random(), Math.random()],
  }
}

const Balloons: FC = () => {
  const rigidBodies = useRef<RapierRigidBody[]>(null)

  // Prepare instances for InstancedRigidBodies
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = []

    for (let i = 0; i < COUNT; i++) {
      instances.push({ ...createInstance() })
    }

    return instances
  }, [])

  console.log('RERENDER')

  return (
    <InstancedRigidBodies ref={rigidBodies} instances={instances} colliders="ball" type="fixed">
      <instancedMesh args={[undefined, undefined, COUNT]} count={COUNT} position={[-5, -5, -5]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e63946" />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}

export default Balloons
