import { Cloud, Clouds, Environment as DreiEnvironment, Sky } from '@react-three/drei'
import { type FC } from 'react'
import { MeshBasicMaterial } from 'three'

const Environment: FC = () => (
  <>
    <ambientLight intensity={2} />
    <directionalLight position={[5, 10, -15]} intensity={8} />
    <DreiEnvironment files={'/gradient-bg.jpg'} background />
    {/* <Sky /> */}

    <Clouds material={MeshBasicMaterial} position={[0, 0, 0]}>
      <Cloud
        position={[0, 0, -10]}
        seed={15}
        segments={10}
        volume={32}
        bounds={[60, 12, 60]}
        color="#ebffff"
        fade={100}
        speed={0.15}
        concentrate="outside"
      />
      <Cloud
        position={[0, 0, -10]}
        seed={12}
        segments={20}
        volume={25}
        bounds={[60, 7, 60]}
        color="hotpink"
        fade={100}
        speed={0.15}
        concentrate="outside"
      />
    </Clouds>
  </>
)

export default Environment
