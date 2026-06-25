import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Respect reduced-motion, and allow a frozen single-frame render via ?static=1.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const staticMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('static');

const frozen = prefersReducedMotion || staticMode;

// Three concentric rings of petals — outer petals open wide, inner ones stay
// tighter, giving the bloom some depth.
const RINGS = [
  {
    count: 8,
    scale: 1.0,
    az: 0,
    y: 0,
    closed: -0.05,
    open: 1.2,
    color: '#3f79ad',
  },
  {
    count: 8,
    scale: 0.78,
    az: Math.PI / 8,
    y: 0.06,
    closed: -0.12,
    open: 0.86,
    color: '#5b9bd0',
  },
  {
    count: 6,
    scale: 0.55,
    az: Math.PI / 6,
    y: 0.12,
    closed: -0.2,
    open: 0.5,
    color: '#8cc0ea',
  },
];

// One soft, pointed petal lying in the XY plane, tip toward +Y, base at origin.
function makePetalGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.36, 0.28, 0.44, 1.05, 0.12, 1.7);
  shape.bezierCurveTo(0.05, 1.86, -0.05, 1.86, -0.12, 1.7);
  shape.bezierCurveTo(-0.44, 1.05, -0.36, 0.28, 0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.04,
    bevelSegments: 2,
    steps: 1,
  });
  geo.translate(0, 0, -0.025);
  return geo;
}

function Flower({ auto }) {
  const petalGeo = useMemo(makePetalGeometry, []);
  const rootRef = useRef();
  const tiltRefs = useRef([]);

  // Flatten the rings into a per-petal layout.
  const petals = useMemo(() => {
    const list = [];
    RINGS.forEach((ring) => {
      for (let i = 0; i < ring.count; i += 1) {
        list.push({ ring, az: ring.az + (i / ring.count) * Math.PI * 2 });
      }
    });
    return list;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // How open the flower is, 0 (bud) .. 1 (full bloom).
    let open;
    if (frozen) {
      open = 0.65;
    } else if (auto) {
      // Breathe open and closed forever.
      open = Math.sin(t * 0.45) * 0.5 + 0.5;
    } else {
      // Driven by page scroll: opens toward the middle, closes by the end.
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      open = Math.sin(p * Math.PI);
    }

    for (let i = 0; i < petals.length; i += 1) {
      const node = tiltRefs.current[i];
      if (!node) continue;
      const { closed, open: openMax } = petals[i].ring;
      node.rotation.x = THREE.MathUtils.lerp(closed, openMax, open);
    }

    if (rootRef.current && !frozen) {
      rootRef.current.rotation.y = t * 0.16;
    }
  });

  return (
    <group ref={rootRef} rotation={[-0.32, 0, 0]} position={[0, 0.2, 0]}>
      {petals.map((p, i) => (
        <group key={i} rotation={[0, p.az, 0]} position={[0, p.ring.y, 0]}>
          <group ref={(el) => (tiltRefs.current[i] = el)}>
            <mesh geometry={petalGeo} scale={p.ring.scale}>
              <meshStandardMaterial
                color={p.ring.color}
                emissive={p.ring.color}
                emissiveIntensity={0.22}
                roughness={0.42}
                metalness={0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* Stamen cluster */}
      <group position={[0, 0.08, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial
            color="#f2c14e"
            emissive="#7a5b10"
            emissiveIntensity={0.5}
            roughness={0.4}
          />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.24, 0.14, Math.sin(a) * 0.24]}
            >
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial
                color="#ffe08a"
                emissive="#caa23a"
                emissiveIntensity={0.6}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function FlowerScene({ auto = false }) {
  return (
    <Canvas
      frameloop={frozen ? 'demand' : 'always'}
      camera={{ position: [0, 1.6, 7], fov: 45 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 1.1, 0)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 6, 4]} intensity={1.4} color="#dcefff" />
      <pointLight position={[-4, 2, 2]} intensity={40} color="#2c5c88" />
      <pointLight position={[3, -1, 3]} intensity={18} color="#8cc0ea" />
      <Suspense fallback={null}>
        <Flower auto={auto} />
      </Suspense>
    </Canvas>
  );
}
