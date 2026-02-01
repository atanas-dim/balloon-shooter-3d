import { Cloud, Clouds, Environment as DreiEnvironment, Sky } from '@react-three/drei'
import { type FC } from 'react'
import { MeshBasicMaterial } from 'three'

const Environment: FC = () => (
  <>
    <ambientLight intensity={2} />
    <directionalLight position={[5, 10, -15]} intensity={8} />
    <DreiEnvironment files={'/gradient-bg.jpg'} background />
    {/* <Sky /> */}

    <Clouds material={MeshBasicMaterial} position={[0, 0, -10]}>
      <Cloud
        position={[0, 0, 0]}
        seed={25}
        segments={30}
        volume={55}
        bounds={[100, 100, 100]}
        color="#ebffff"
        fade={100}
        speed={0.15}
        concentrate="outside"
      />
      <Cloud
        position={[0, 0, 0]}
        seed={25}
        segments={20}
        volume={55}
        bounds={[100, 100, 100]}
        color="#ffa4cd"
        fade={100}
        speed={0.15}
        concentrate="outside"
      />
    </Clouds>
  </>
)

export default Environment
