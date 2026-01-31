import { useRef, useEffect, type FC, useMemo, useState } from 'react'

import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three/src/math/Vector3.js'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedBufferAttribute, InstancedMesh, PerspectiveCamera, Camera } from 'three'
import ConfettiSystem, { Burst } from '@/components/ConfettiSystem'
import { useThree } from '@react-three/fiber'

const COLORS = [
  '#e63946', // red
  '#75c85a', // white
  '#44b6ba', // light blue
  '#457b9d', // blue
  '#f4d35e', // yellow
  '#43aa8b', // green
  '#b5838d', // pink
  '#ff6f61', // coral
]

const INITIAL_BALLOON_POSITION: [number, number, number] = [0, -150, 0]

const BALLOON_POOL_SIZE = 100
const EMIT_INTERVAL = 2000 // ms
const FLY_TIME = 30000 // ms (how long a balloon flies before reset)
const SPAWN_Y = -20
export type RigidBodyUserData = {
  key: string
  type: 'balloon' | 'projectile'
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Type guard for PerspectiveCamera
function isPerspectiveCamera(cam: Camera): cam is PerspectiveCamera {
  return (cam as PerspectiveCamera).isPerspectiveCamera === true
}

// Helper to get the visible angle range (thetaMin, thetaMax) in the XZ plane for the camera
function getVisibleAngleRangeXZ(camera: Camera, size: { width: number; height: number }): [number, number] {
  if (isPerspectiveCamera(camera)) {
    // Camera world direction
    const camDir = new Vector3()
    camera.getWorldDirection(camDir)
    // Project the camera direction onto the XZ plane
    camDir.y = 0
    camDir.normalize()
    // Camera yaw (angle in XZ plane)
    const camYaw = Math.atan2(camDir.z, camDir.x)
    // Camera horizontal FOV
    const aspect = size.width / size.height
    const vFOV = (camera.fov * Math.PI) / 180
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * aspect)
    // Angle range
    return [camYaw - hFOV / 2, camYaw + hFOV / 2]
  } else {
    return [0, Math.PI * 2]
  }
}

// Helper to get the world Y coordinate at the bottom of the camera frustum at a given (x, z)
function getVisibleBottomYAtXZ(camera: Camera, x: number, z: number): number | null {
  if (isPerspectiveCamera(camera)) {
    const camPos = camera.position.clone()
    // Unproject NDC (0, -1, 0.5) at the given x/z direction
    const ndc = new Vector3(0, -1, 0.5)
    ndc.unproject(camera)
    // Direction from camera to bottom center
    const dir = ndc.clone().sub(camPos).normalize()
    // Find t where camPos.x + t*dir.x = x and camPos.z + t*dir.z = z
    // Solve for t using the largest component (to avoid division by zero)
    let t = 0
    if (Math.abs(dir.x) > Math.abs(dir.z)) {
      t = (x - camPos.x) / dir.x
    } else {
      t = (z - camPos.z) / dir.z
    }
    const worldAtXZ = camPos.clone().add(dir.multiplyScalar(t))
    return worldAtXZ.y
  }
  return null
}

// Helper to get a random balloon emission position within the current camera view
function getBalloonEmitPosition(camera: Camera, size: { width: number; height: number }): [number, number, number] {
  // Pick a random radius for the ring
  const r = randomInRange(15, 50)

  // Get the visible angle range in XZ plane
  const [thetaMin, thetaMax] = getVisibleAngleRangeXZ(camera, size)
  // Pick a random angle within the visible range
  const theta = randomInRange(thetaMin, thetaMax)

  // Offset emission center to camera's world position - camera is always at origin of emission ring
  const camX = camera.position.x
  const camZ = camera.position.z
  const x = camX + r * Math.cos(theta)
  const z = camZ + r * Math.sin(theta)

  // Calculate SPAWN_Y: 5 units below the current camera view at this (x, z)
  let spawnY = SPAWN_Y
  const bottomY = getVisibleBottomYAtXZ(camera, x, z)
  if (bottomY !== null) {
    spawnY = Math.min(Math.max(bottomY - 2, -50), 0) // don't go above y=0 and not under -50
  }

  return [x, spawnY, z]
}

// Helper to create a single instance with trapezoidal x range
function createInstance(): InstancedRigidBodyProps {
  const key = 'instance_' + Math.random()
  const userData: RigidBodyUserData = { key, type: 'balloon' }
  return {
    key,
    position: INITIAL_BALLOON_POSITION,
    rotation: [0, 0, 0],
    userData,
  }
}

const Balloons: FC = () => {
  const { camera, size } = useThree()
  const rigidBodiesRef = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const resetQueue = useRef<{ index: number; resetAt: number }[]>([])

  // Memoize instances when camera or size changes
  const instances = useMemo(() => {
    return Array.from({ length: BALLOON_POOL_SIZE }, () => createInstance())
  }, [])

  // Per-instance scale attribute
  const scales = useRef<Float32Array>(new Float32Array(BALLOON_POOL_SIZE).fill(1))
  const meshRef = useRef<InstancedMesh>(null)
  const animatingSet = useRef<Set<number>>(new Set())

  const [bursts, setBursts] = useState<Burst[]>([])

  // Per-instance color attribute
  const colors = useMemo(() => {
    const arr = new Float32Array(BALLOON_POOL_SIZE * 3)
    for (let i = 0; i < BALLOON_POOL_SIZE; i++) {
      const c = new Color(COLORS[i % COLORS.length])
      arr[i * 3 + 0] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [])

  const addToResetQueue = (index: number) => {
    resetQueue.current.push({ index, resetAt: performance.now() + FLY_TIME })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!rigidBodiesRef.current) return
      const index = activeIndexRef.current
      const body = rigidBodiesRef.current[index]
      if (!body) return

      // First set to dynamic
      body.setBodyType(0, false)

      // Get a random emission position within the current camera view
      const pos = getBalloonEmitPosition(camera, size)
      body.setTranslation(new Vector3(...pos), false)

      body.setLinvel(new Vector3(0, 2, 0), true) // constant upward velocity

      // Schedule reset in the queue
      addToResetQueue(index)

      // Move to next index (wrap around)
      activeIndexRef.current = (index + 1) % BALLOON_POOL_SIZE
    }, EMIT_INTERVAL)
    return () => clearInterval(interval)
  }, [camera, instances, size])

  const resetBalloon = (index: number) => {
    const body = rigidBodiesRef.current?.[index]
    if (body) {
      body.setBodyType(1, false) // 1 = fixed
      body.setTranslation(new Vector3(...INITIAL_BALLOON_POSITION), false)
      body.setLinvel({ x: 0, y: 0, z: 0 }, false)
    }
  }

  // Process reset queue in useFrame (safe for Rapier)
  useFrame(() => {
    const now = performance.now()
    resetQueue.current = resetQueue.current.filter(({ index, resetAt }) => {
      if (now >= resetAt) {
        resetBalloon(index)
        return false // remove from queue
      }
      return true // keep in queue
    })
  })

  // Attach color and scale attributes to geometry
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.setAttribute('color', new InstancedBufferAttribute(colors, 3))
      meshRef.current.geometry.setAttribute('instanceScale', new InstancedBufferAttribute(scales.current, 1))
    }
  }, [colors])

  const triggerBurst = (index: number) => {
    // Trigger confetti burst at balloon's position and color
    if (rigidBodiesRef.current && meshRef.current) {
      const body = rigidBodiesRef.current[index]
      if (body) {
        // Get world position
        const pos = body.translation()
        // Get color from per-instance color attribute
        const colorArr = colors
        const color = new Color(colorArr[index * 3 + 0], colorArr[index * 3 + 1], colorArr[index * 3 + 2])
        setBursts((bursts) => [
          ...bursts,
          {
            position: [pos.x, pos.y, pos.z],
            color: `#${color.getHexString()}`,
            key: `burst_${index}_${Date.now()}`,
          },
        ])
      }
    }
  }

  // Animate scale to 0 for a given index, then reset
  const animateScaleToZero = (index: number, onComplete: () => void) => {
    if (animatingSet.current.has(index)) return
    animatingSet.current.add(index)

    const body = rigidBodiesRef.current?.[index]

    if (!body) return

    // TODO Review this logic step by step. The resetBallon also resets linvel and body type. Ideally we should be resetting them once on balloon collision
    // First stop movement and  fire particle effect
    body.setLinvel(new Vector3(0, 0, 0), false)
    body.setBodyType(1, false)
    triggerBurst(index)

    let scale = 1
    function step() {
      if (!meshRef.current) return
      scale *= 0.7
      scales.current[index] = scale
      meshRef.current.geometry.attributes.instanceScale.needsUpdate = true
      if (scale > 0.01) {
        requestAnimationFrame(step)
      } else {
        onComplete()
        scales.current[index] = 1
        meshRef.current.geometry.attributes.instanceScale.needsUpdate = true

        animatingSet.current.delete(index) // allow re-animation on next hit
      }
    }
    step()
  }

  return (
    <>
      <InstancedRigidBodies
        ref={rigidBodiesRef}
        instances={instances}
        colliders="ball"
        type="fixed"
        restitution={0}
        mass={1}
        enabledTranslations={[false, true, false]} // only allow y movement
        onCollisionEnter={(e) => {
          if (!rigidBodiesRef.current) return

          const { key } = (e.target.rigidBody?.userData as RigidBodyUserData) || {}
          if (!key) return

          const index = rigidBodiesRef.current.findIndex((rb) => (rb.userData as RigidBodyUserData)?.key === key)
          if (index !== -1) {
            animateScaleToZero(index, () => resetBalloon(index))
          }
        }}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, BALLOON_POOL_SIZE]} frustumCulled={false}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            vertexColors
            transparent
            metalness={0.65}
            roughness={0.2}
            opacity={0.75}
            onBeforeCompile={(shader) => {
              // Inject instanceScale attribute and multiply instanceMatrix
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
              attribute float instanceScale;
              `,
              )
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
              transformed *= instanceScale;
              `,
              )
            }}
          />
        </instancedMesh>
      </InstancedRigidBodies>
      <ConfettiSystem bursts={bursts} />
    </>
  )
}

export default Balloons
