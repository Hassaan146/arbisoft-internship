import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// Honour the user's motion preference — the sea freezes if they've asked for
// reduced motion (a11y: prefers-reduced-motion).
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// `?static=1` renders a single frame (used for visual snapshots/tests).
const staticMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('static');

// Stop the continuous render loop entirely when motion isn't wanted.
const frozen = prefersReducedMotion || staticMode;

/**
 * A flowing sea — a dense plane whose vertices ripple with summed sine waves,
 * so the surface rolls in waves every frame.
 */
function Ocean() {
  const geomRef = useRef();
  const frame = useRef(0);

  // Displace the height (local z, which becomes vertical once the plane is laid
  // flat) of every vertex using a few overlapping waves of different speeds.
  // We write the typed array directly (no per-vertex accessor calls) to keep
  // each frame well under the 16ms budget.
  const ripple = (geo, t, withNormals) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      arr[i + 2] =
        Math.sin(x * 0.5 + t * 1.1) * 0.42 +
        Math.sin(y * 0.7 + t * 0.85) * 0.3 +
        Math.sin((x + y) * 0.35 + t * 0.6) * 0.22 +
        Math.cos(x * 0.9 - y * 0.4 + t * 1.4) * 0.12;
    }
    geo.attributes.position.needsUpdate = true;
    // Normal recompute is the costly step — only do it every other frame.
    if (withNormals) geo.computeVertexNormals();
  };

  useFrame((state) => {
    const geo = geomRef.current;
    if (!geo || frozen) return;
    frame.current += 1;
    ripple(geo, state.clock.elapsedTime, frame.current % 3 === 0);
  });

  // Seed one frame of waves so a reduced-motion sea still looks like water.
  const onReady = (geo) => {
    geomRef.current = geo;
    if (geo) ripple(geo, 0, true);
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <planeGeometry ref={onReady} args={[60, 60, 40, 40]} />
      <meshStandardMaterial
        color="#06283d"
        roughness={0.18}
        metalness={0.55}
        emissive="#04141f"
        emissiveIntensity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * The rising red light — a glowing sun low on the horizon that slowly lifts,
 * casting warm light across the wave crests.
 */
function RisingSun() {
  const group = useRef();
  const light = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const t = frozen ? 0 : state.clock.elapsedTime;
    // Gentle rise + a subtle breathing glow.
    const y = 0.6 + (Math.sin(t * 0.12) * 0.5 + 0.5) * 2.4;
    group.current.position.y = y;
    if (light.current) {
      light.current.position.y = y;
      light.current.intensity = 180 + Math.sin(t * 0.8) * 30;
    }
  });

  return (
    <group>
      <group ref={group} position={[0, 1, -22]}>
        {/* core */}
        <mesh>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial color="#ff5538" toneMapped={false} />
        </mesh>
        {/* halo */}
        <mesh>
          <sphereGeometry args={[4.6, 24, 24]} />
          <meshBasicMaterial
            color="#ff3b2f"
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <pointLight
        ref={light}
        position={[0, 1, -18]}
        color="#ff5a3c"
        intensity={180}
        distance={70}
        decay={1.2}
      />
    </group>
  );
}

/**
 * The whole rig leans subtly toward the pointer for parallax depth.
 */
function ParallaxRig({ children }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current || frozen) return;
    const x = state.pointer.x * 0.15;
    const y = state.pointer.y * 0.08;
    group.current.rotation.y += (x - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (-y - group.current.rotation.x) * 0.03;
  });

  return <group ref={group}>{children}</group>;
}

export default function Scene3D() {
  // Build the night-sky colour once.
  const skyColor = useMemo(() => new THREE.Color('#03070f'), []);

  return (
    <div className="scene-bg" aria-hidden="true">
      <Canvas
        frameloop={frozen ? 'demand' : 'always'}
        camera={{ position: [0, 2.4, 10], fov: 60 }}
        dpr={[1, 1.4]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={[skyColor]} />
        <fog attach="fog" args={['#04101b', 14, 46]} />

        {/* cool sky fill + warm key from the sun */}
        <hemisphereLight args={['#1b4a63', '#020912', 0.55]} intensity={0.6} />
        <ambientLight intensity={0.2} />

        <Suspense fallback={null}>
          <RisingSun />
          <ParallaxRig>
            <Ocean />
          </ParallaxRig>
          <Stars
            radius={80}
            depth={50}
            count={700}
            factor={3}
            saturation={0}
            fade
            speed={prefersReducedMotion ? 0 : 0.4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
