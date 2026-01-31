import { PointerLockControls, OrbitControls } from '@react-three/drei'
import { useState } from 'react'

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
}

const MIN_POLAR_ANGLE = Math.PI / 2.75

export default function Controls() {
  const [mobile] = useState(isMobile())

  return mobile ? (
    <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} minPolarAngle={MIN_POLAR_ANGLE} />
  ) : (
    // For pointer locked controls we need offset because they have different origin than OrbitControls
    <PointerLockControls maxPolarAngle={Math.PI - MIN_POLAR_ANGLE} pointerSpeed={0.75} />
  )
}
