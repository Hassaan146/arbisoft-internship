import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Stars,
  Icosahedron,
  MeshDistortMaterial,
} from '@react-three/drei';
import * as THREE from 'three';

/**
 * A slowly morphing, self-rotating crystal that anchors the scene.
 */
function Crystal({ position, color, scale = 1, speed = 0.4 }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed * 0.5;
    ref.current.rotation.y += delta * speed;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <Icosahedron ref={ref} args={[1, 4]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.6}
          distort={0.35}
          speed={1.6}
          transparent
          opacity={0.92}
        />
      </Icosahedron>
    </Float>
  );
}

/**
 * A drifting cloud of points — the "data dust" of the analytics nebula.
 */
function DataDust({ count = 900 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#9ad9ff"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Gentle parallax: the whole rig leans toward the pointer.
 */
function ParallaxRig({ children }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const x = state.pointer.x * 0.4;
    const y = state.pointer.y * 0.25;
    group.current.rotation.y += (x - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-y - group.current.rotation.x) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

export default function Scene3D() {
  return (
    <div className="scene-bg" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#05060f']} />
        <fog attach="fog" args={['#05060f', 9, 22]} />

        <ambientLight intensity={0.4} />
        <pointLight position={[6, 6, 6]} intensity={120} color="#7c5cff" />
        <pointLight position={[-8, -4, 2]} intensity={90} color="#19e3c9" />

        <Suspense fallback={null}>
          <ParallaxRig>
            <Crystal position={[2.6, 0.4, 0]} color="#7c5cff" scale={1.7} />
            <Crystal
              position={[-3, -1, -2]}
              color="#19e3c9"
              scale={1}
              speed={0.6}
            />
            <Crystal
              position={[-1.4, 2, -3]}
              color="#ff5da2"
              scale={0.6}
              speed={0.8}
            />
            <DataDust />
          </ParallaxRig>
          <Stars
            radius={60}
            depth={40}
            count={2500}
            factor={3}
            saturation={0}
            fade
            speed={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
