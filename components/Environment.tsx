import { Cloud, Clouds } from '@react-three/drei'
import { type FC } from 'react'
import { Color } from 'three'
import { MeshBasicMaterial } from 'three/src/materials/Materials.js'

const Environment: FC = () => {
  return (
    <>
      <Clouds material={MeshBasicMaterial} position={[0, 0, -40]}>
        <Cloud
          position={[-10, 8, 5]}
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
          position={[10, -5, 2]}
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
      <mesh scale={[100, 100, 100]} position={[0, 0, 0]}>
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
    </>
  )
}

export default Environment
