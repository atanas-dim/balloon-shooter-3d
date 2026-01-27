import { Cloud, Clouds, Environment as DreiEnvironment, Sky } from '@react-three/drei'
import { type FC } from 'react'
import { MeshBasicMaterial } from 'three/src/materials/Materials.js'

const Environment: FC = () => {
  return (
    <>
      <Clouds material={MeshBasicMaterial} position={[0, 0, -40]}>
        <Cloud
          position={[-10, 5, 5]}
          seed={5}
          segments={10}
          volume={12}
          bounds={[25, 6, 5]}
          color="orange"
          fade={100}
          speed={0.15}
          concentrate="random"
        />
        <Cloud
          position={[10, -5, 2]}
          seed={2}
          segments={20}
          volume={15}
          bounds={[18, 4, 3]}
          color="hotpink"
          fade={100}
          speed={0.15}
          concentrate="outside"
        />
      </Clouds>
      <Sky sunPosition={[-15, 5, -10]} turbidity={15} rayleigh={0.5} mieCoefficient={0.01} mieDirectionalG={1} />
      <DreiEnvironment preset="dawn" />
    </>
  )
}

export default Environment
