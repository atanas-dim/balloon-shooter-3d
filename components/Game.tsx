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
    <Canvas camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 500 }} shadows>
      <Suspense>
        <Environment />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          minPolarAngle={Math.PI / 2.25}
          maxPolarAngle={Math.PI}
        />

        <Physics gravity={[0, 0, 0]}>
          <Balloons />
          <Gun />

          {/* TEST PLANE TO SEE HOW DEEP SHOULD Z AND Y GO */}
          {/* <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
            <meshStandardMaterial color={'#00d532'} />
          </Plane> */}
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default Game
