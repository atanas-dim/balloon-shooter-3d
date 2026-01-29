'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Plane } from '@react-three/drei'
import { type FC, Suspense } from 'react'
import Environment from '@/components/Environment'

import { Physics } from '@react-three/rapier'
import Gun from '@/components/Gun'
import Balloons from '@/components/Balloons'

const Game: FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 30 }}>
      <Environment />

      <ambientLight intensity={2.5} castShadow />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />

      <Suspense>
        <Physics gravity={[0, 0.5, 0]}>
          <Balloons />
          <Gun />

          {/* TEST PLANE TO SEE HOW DEEP SHOULD Z AND Y GO */}
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
            <meshStandardMaterial color={'green'} />
          </Plane>
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default Game
