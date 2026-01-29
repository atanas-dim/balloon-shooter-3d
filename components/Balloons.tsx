import { useRef, useEffect, type FC, useMemo, useState } from 'react'

import { InstancedRigidBodies, InstancedRigidBodyProps, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three/src/math/Vector3.js'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedBufferAttribute, InstancedMesh } from 'three'
import ConfettiSystem, { Burst } from '@/components/ConfettiSystem'

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

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function createInstance(): InstancedRigidBodyProps {
  const key = 'instance_' + Math.random()
  const userData: RigidBodyUserData = { key }
  return {
    key,
    position: [randomInRange(-5, 5), -8, randomInRange(-5, 5)],
    rotation: [0, 0, 0],
    userData,
  }
}

const Balloons: FC = () => {
  const rigidBodiesRef = useRef<RapierRigidBody[]>(null)
  const activeIndexRef = useRef(0)
  const resetQueue = useRef<{ index: number; resetAt: number }[]>([])
  const instances = useMemo(() => Array.from({ length: COUNT }, createInstance), [])

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
      body.setBodyType(3, true) // 3 = dynamic
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
    if (body) {
      body.setBodyType(1, true) // 1 = fixed
      const pos = Array.isArray(instances[index].position) ? instances[index].position : [0, 0, 0]
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
        onCollisionEnter={(e) => {
          if (!rigidBodiesRef.current) return
          const key = (e.target.rigidBody?.userData as RigidBodyUserData)?.key
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
