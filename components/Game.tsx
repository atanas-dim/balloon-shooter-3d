'use client'

import { Canvas } from '@react-three/fiber'
import { type FC, Suspense } from 'react'
import Environment from '@/components/Environment'

import { Physics } from '@react-three/rapier'
import Gun from '@/components/Gun'
import Balloons from '@/components/Balloons'
import Controls from '@/components/Controls'

const Game: FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 500 }} shadows>
      <Suspense>
        <Environment />
        <Controls />

        <Physics gravity={[0, 0, 0]}>
          <Balloons />
          <Gun />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default Game
