'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { type FC, Suspense } from 'react'
import Environment from '@/components/Environment'

import { Physics } from '@react-three/rapier'
import Gun from '@/components/Gun'
import Balloons from '@/components/Balloons'

const Game: FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 500 }} shadows>
      <Suspense>
        <Environment />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          minPolarAngle={Math.PI / 2.75}
          maxPolarAngle={Math.PI}
        />

        <Physics gravity={[0, 0, 0]}>
          <Balloons />
          <Gun />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default Game
