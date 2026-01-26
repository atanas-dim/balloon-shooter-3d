'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, OrbitControls, Plane } from '@react-three/drei'
import { useRef, useState, useEffect, type FC } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js'
import { Mesh } from 'three/src/objects/Mesh.js'

type Balloon = {
  id: number
  x: number
  y: number
  z: number
  speed: number
  color: string
}

const BALLOON_RADIUS = 0.3

const BALLOON_MIN_Z = -5
const BALLOON_MAX_Z = 0

const START_Y_CLOSEST = -3.5
const START_Y_FARTHEST = -8
// BALLOON_END_Y will be calculated dynamically based on viewport/camera
const EMIT_INTERVAL = 2000 // ms

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

const Balloons: FC = () => {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const { camera } = useThree()
  const balloonId = useRef(0)

  const meshRefs = useRef<{ [id: number]: Mesh }>({})

  // Emit new balloons at intervals
  useEffect(() => {
    const interval = setInterval(() => {
      const z = getRandom(BALLOON_MIN_Z, BALLOON_MAX_Z)
      // The further from the camera (smaller z), the lower the start Y
      const zClamped = Math.max(BALLOON_MIN_Z, Math.min(0, z))
      const t = (zClamped - BALLOON_MIN_Z) / (0 - BALLOON_MIN_Z)
      const y = START_Y_FARTHEST + t * (START_Y_CLOSEST - START_Y_FARTHEST)

      // Calculate X bounds based on camera frustum at this Z
      let minX = -2.5,
        maxX = 2.5
      if (camera && 'fov' in camera && 'aspect' in camera) {
        const frustumWidth = getFrustumWidthAtZ(camera, z)
        minX = -frustumWidth / 2 + BALLOON_RADIUS
        maxX = frustumWidth / 2 - BALLOON_RADIUS
      }
      setBalloons((prev) => [
        ...prev,
        {
          id: balloonId.current++,
          x: getRandom(minX, maxX),
          y,
          z,
          speed: getRandom(0.008, 0.018),
          color: getRandomColor(),
        },
      ])
    }, EMIT_INTERVAL)
    return () => clearInterval(interval)
  }, [camera])

  // Animate balloons
  useFrame(() => {
    balloons.forEach((b) => {
      const mesh = meshRefs.current[b.id]
      if (mesh) mesh.position.y += b.speed
      // Optionally: remove balloon if mesh.position.y > limit
      if (mesh && mesh.position.y > 5) {
        setBalloons((prev) => prev.filter((balloon) => balloon.id !== b.id))
      }
    })
  })

  useEffect(() => {
    console.log('Current balloons:', balloons)
  }, [balloons])

  return (
    <>
      {balloons.map((b) => (
        <Sphere
          key={b.id}
          ref={(ref) => {
            if (ref) meshRefs.current[b.id] = ref
          }}
          args={[BALLOON_RADIUS, 32, 32]}
          position={[b.x, b.y, b.z]}>
          <meshStandardMaterial color={b.color} transparent={true} opacity={0.8} metalness={0.7} roughness={0.2} />
        </Sphere>
      ))}
    </>
  )
}

const Game: FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }} className="border border-blue-300">
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Balloons />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />

      {/* TEST PLANE TO SEE HOW DEEP SHOULD Z AND Y GO */}
      <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
        <meshStandardMaterial color={'green'} />
      </Plane>
    </Canvas>
  )
}

export default Game
