import { Cloud, Clouds, Environment as DreiEnvironment } from '@react-three/drei'
import { type FC } from 'react'
import { MeshBasicMaterial } from 'three'

const Environment: FC = () => (
  <>
    <ambientLight intensity={2} />
    <directionalLight position={[5, 10, -20]} intensity={8} castShadow />
    <DreiEnvironment files={'/gradient-bg.jpg'} background />

    <Clouds material={MeshBasicMaterial} position={[0, 0, 0]}>
      <Cloud
        position={[-10, 8, -40]}
        seed={5}
        segments={10}
        volume={22}
        bounds={[25, 12, 5]}
        color="#ebffff"
        fade={100}
        speed={0.15}
        concentrate="random"
      />
      <Cloud
        position={[10, -5, -40]}
        seed={2}
        segments={20}
        volume={15}
        bounds={[20, 7, 3]}
        color="hotpink"
        fade={100}
        speed={0.15}
        concentrate="outside"
      />
    </Clouds>
  </>
)

export default Environment
