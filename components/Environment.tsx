import { Cloud, Clouds } from '@react-three/drei'
import { type FC } from 'react'
import { Color, MeshBasicMaterial } from 'three'

const CustomSky = () => (
  <mesh scale={[150, 150, 150]} position={[0, 0, 0]}>
    <sphereGeometry args={[1, 64, 64]} />
    <shaderMaterial
      attach="material"
      args={[
        {
          uniforms: {
            color1: { value: new Color('#ffe7ca') },
            color1Stop: { value: 0.35 },
            color2: { value: new Color('#bddeff') },
            color2Stop: { value: 0.5 },
            color3: { value: new Color('#ffbded') },
            color3Stop: { value: 0.65 },
          },
          side: 1, // THREE.BackSide
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color1;
            uniform float color1Stop;
            uniform vec3 color2;
            uniform float color2Stop;
            uniform vec3 color3;
            uniform float color3Stop;
            varying vec2 vUv;
            void main() {
              float y = vUv.y;
              vec3 grad;
              if (y < color1Stop) {
                grad = color1;
              } else if (y < color2Stop) {
                float t = (y - color1Stop) / (color2Stop - color1Stop);
                grad = mix(color1, color2, t);
              } else if (y < color3Stop) {
                float t = (y - color2Stop) / (color3Stop - color2Stop);
                grad = mix(color2, color3, t);
              } else {
                grad = color3;
              }
              gl_FragColor = vec4(grad, 1.0);
            }
          `,
        },
      ]}
    />
  </mesh>
)

const Environment: FC = () => (
  <>
    <ambientLight intensity={2} />
    <directionalLight position={[5, 10, -20]} intensity={8} />
    <directionalLight position={[-45, -20, 20]} intensity={2} />

    {/* Clouds and custom shader sphere are inside CubeCamera */}
    <Clouds material={MeshBasicMaterial} position={[0, 0, 0]}>
      {/* <Cloud
        position={[0, -8, 0]}
        seed={5}
        segments={40}
        volume={10}
        bounds={[10, 1, 10]}
        color="#f70361"
        fade={0}
        speed={0}
        concentrate="inside"
        opacity={1.4}
        scale={1}
      /> */}
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
    <CustomSky />
  </>
)

export default Environment
