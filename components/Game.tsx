'use client'

import { Canvas } from '@react-three/fiber'
import { type FC, Suspense, useEffect } from 'react'
import Environment from '@/components/Environment'

import { Physics } from '@react-three/rapier'
import Gun from '@/components/Gun'
import Balloons from '@/components/Balloons'
import Controls from '@/components/Controls'

export const CAMERA_POSITION: [number, number, number] = [0, 0, 10]

const Game: FC = () => {
  useEffect(() => {
    // This helps prevent the iOS text selection loupe when touching and dragging
    let dragging = false

    const onTouchStart = (e: TouchEvent) => {
      dragging = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return
      e.preventDefault() // important
      // move camera here
    }

    const onTouchEnd = () => {
      dragging = false
    }

    document.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div className="relative size-full overflow-hidden rounded-xl">
      <Canvas camera={{ position: CAMERA_POSITION, fov: 30, near: 0.1, far: 500 }} shadows>
        <Suspense>
          <Environment />
          <Controls />

          <Physics gravity={[0, 0, 0]}>
            <Balloons />
            <Gun />
          </Physics>
        </Suspense>
      </Canvas>
      <div className="absolute top-1/2 left-1/2 z-1 flex size-8 -translate-1/2 items-center justify-center rounded-full border-3 border-stone-900">
        <div className="size-1.5 rounded-full bg-stone-900" />
      </div>
    </div>
  )
}

export default Game
