import { useRef, useEffect, type FC, useMemo, useState } from 'react'

import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three/src/math/Vector3.js'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedBufferAttribute, InstancedMesh, PerspectiveCamera, Camera } from 'three'
import ConfettiSystem, { Burst } from '@/components/ConfettiSystem'
import { useThree } from '@react-three/fiber'

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
const SPAWN_Y = -8

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

// Helper to get visible x-range at a given z (for perspective camera)
function getVisibleXRangeAtZ(
  camera: Camera,
  size: { width: number; height: number },
  y: number,
  z: number,
): { min: number; max: number } {
  if (isPerspectiveCamera(camera)) {
    // Distance from camera to y/z
    const camPos = camera.position
    // For a typical setup, y is fixed (SPAWN_Y), z varies
    const dist = Math.sqrt(Math.pow(camPos.y - y, 2) + Math.pow(camPos.z - z, 2))
    const vFOV = (camera.fov * Math.PI) / 180
    const frustumHeight = 2 * Math.tan(vFOV / 2) * dist
    const aspect = size.width / size.height
    const frustumWidth = frustumHeight * aspect
    return { min: -frustumWidth / 2, max: frustumWidth / 2 }
  }
  return { min: -5, max: 5 }
}

// Helper to create a single instance with trapezoidal x range
function createInstance(camera: Camera, size: { width: number; height: number }): InstancedRigidBodyProps {
  const key = 'instance_' + Math.random()
  const userData: RigidBodyUserData = { key, type: 'balloon' }
  const z = randomInRange(-15, -5)
  const { min: xMin, max: xMax } = getVisibleXRangeAtZ(camera, size, SPAWN_Y, z)
  return {
    key,
    position: [randomInRange(xMin, xMax), SPAWN_Y, z],
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
    console.log('INSTANCES MEMO CAMERA CHANGE')
    if (!isPerspectiveCamera(camera)) {
      // Optionally, handle orthographic camera differently or throw
      return []
    }
    return Array.from({ length: COUNT }, () => createInstance(camera, size))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Per-instance scale attribute
  const scales = useRef<Float32Array>(new Float32Array(COUNT).fill(1))
  const meshRef = useRef<InstancedMesh>(null)
  const animatingSet = useRef<Set<number>>(new Set())

  const [bursts, setBursts] = useState<Burst[]>([])

  // Per-instance color attribute
  const colors = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
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

  // Emit balloons at intervals
  useEffect(() => {
    const interval = setInterval(() => {
      if (!rigidBodiesRef.current) return
      const index = activeIndexRef.current
      const body = rigidBodiesRef.current[index]
      if (!body) return

      // Set to dynamic and give it an upward velocity
      body.setBodyType(0, true) // 3 = dynamic
      body.setLinvel({ x: 0, y: 5, z: 0 }, true)

      // Schedule reset in the queue
      addToResetQueue(index)

      // Move to next index (wrap around)
      activeIndexRef.current = (index + 1) % COUNT
    }, EMIT_INTERVAL)
    return () => clearInterval(interval)
  }, [instances])

  const resetRigidBody = (index: number) => {
    const body = rigidBodiesRef.current?.[index]
    if (body && isPerspectiveCamera(camera)) {
      body.setBodyType(1, true) // 1 = fixed
      // Re-randomize z, then x based on frustum at that z
      const z = randomInRange(-15, -5)
      const { min: xMin, max: xMax } = getVisibleXRangeAtZ(camera, size, SPAWN_Y, z)
      const pos = [randomInRange(xMin, xMax), SPAWN_Y, z]
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

    let scale = 1
    function step() {
      if (!meshRef.current) return
      scale *= 0.7
      scales.current[index] = scale
      meshRef.current.geometry.attributes.instanceScale.needsUpdate = true
      if (scale > 0.01) {
        requestAnimationFrame(step)
      } else {
        triggerBurst(index)
        onComplete()
        scales.current[index] = 1
        meshRef.current.geometry.attributes.instanceScale.needsUpdate = true
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
        mass={0.1}
        onCollisionEnter={(e) => {
          if (!rigidBodiesRef.current) return
          const { key, type } = (e.target.rigidBody?.userData as RigidBodyUserData) || {}
          if (type === 'balloon') return // Ignore balloon-balloon collisions
          if (!key) return
          const index = rigidBodiesRef.current.findIndex((rb) => (rb.userData as RigidBodyUserData)?.key === key)
          if (index !== -1) {
            animateScaleToZero(index, () => resetRigidBody(index))
          }
        }}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            vertexColors
            transparent
            opacity={0.75}
            metalness={0.65}
            roughness={0.2}
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
