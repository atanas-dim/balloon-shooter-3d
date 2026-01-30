import { useState, type FC } from 'react'
import ExplodingParticles from './ExplodingParticles'

export type Burst = { position: [number, number, number]; color: string; key: string }

type ConfettiSystemProps = {
  bursts: Burst[]
}

const MAX_BURSTS = 15

const ConfettiSystem: FC<ConfettiSystemProps> = ({ bursts }) => {
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set())

  // Compute active bursts based on bursts prop and removedKeys
  const activeBursts = bursts.filter((b) => !removedKeys.has(b.key)).slice(-MAX_BURSTS)

  // Remove burst when animation completes
  const handleBurstComplete = (key: string) => {
    setRemovedKeys((prev) => new Set(prev).add(key))
  }

  return (
    <>
      {activeBursts.map((burst) => (
        <ExplodingParticles
          key={burst.key}
          color={burst.color}
          position={burst.position}
          count={16}
          duration={1.2}
          onBurstComplete={() => handleBurstComplete(burst.key)}
        />
      ))}
    </>
  )
}
export default ConfettiSystem
