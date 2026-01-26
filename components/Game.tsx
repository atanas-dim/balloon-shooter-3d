'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, OrbitControls, Plane, Sky, Environment } from '@react-three/drei'
import { useRef, useState, useEffect, type FC } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js'
import { Mesh } from 'three/src/objects/Mesh.js'

type Balloon = {
  id: number
  x: number
  y: number
  z: number
  radius: number
  speed: number
  color: string
}

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
      const radius = getRandom(BALLOON_MIN_RADIUS, BALLOON_MAX_RADIUS)
      // Calculate X bounds based on camera frustum at this Z
      let minX = -2.5,
        maxX = 2.5
      if (camera && 'fov' in camera && 'aspect' in camera) {
        const frustumWidth = getFrustumWidthAtZ(camera, z)
        minX = -frustumWidth / 2 + BALLOON_MAX_RADIUS
        maxX = frustumWidth / 2 - BALLOON_MAX_RADIUS
      }

      setBalloons((prev) => [
        ...prev,
        {
          id: balloonId.current++,
          x: getRandom(minX, maxX),
          y,
          z,
          radius,
          speed: getRandom(0.008, 0.033),
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

      // REMOVE BALLOON IF IT GOES ABOVE THE POSITIVE/OPPOSITE OF START Y (which was negative)
      if (mesh && mesh.position.y > -b.y) {
        setBalloons((prev) => prev.filter((balloon) => balloon.id !== b.id))
      }
    })
  })

  const removeBalloon = (id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id))
  }

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
          args={[b.radius, 32, 32]}
          position={[b.x, b.y, b.z]}
          onClick={(e) => {
            e.stopPropagation()
            removeBalloon(b.id)
          }}>
          <meshStandardMaterial color={b.color} transparent={true} opacity={0.5} metalness={0.65} roughness={0.2} />
        </Sphere>
      ))}
    </>
  )
}

const Game: FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }} className="border border-blue-300">
      <Sky sunPosition={[-15, 5, -10]} turbidity={15} rayleigh={0.5} mieCoefficient={0.01} mieDirectionalG={1} />
      <Environment preset="dawn" />

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
