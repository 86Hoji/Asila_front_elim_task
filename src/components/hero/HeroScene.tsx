import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

const TEAL = new THREE.Color("#00c2bc");
const TEAL_BRIGHT = new THREE.Color("#00ffeb");

/** Lane centre-lines that particles travel along (x, z) in world units. */
const LANES: Array<[THREE.Vector3, THREE.Vector3]> = [
  [new THREE.Vector3(-26, 0, -2.2), new THREE.Vector3(26, 0, -2.2)],
  [new THREE.Vector3(-26, 0, -5.4), new THREE.Vector3(26, 0, -5.4)],
  [new THREE.Vector3(26, 0, 2.2), new THREE.Vector3(-26, 0, 2.2)],
  [new THREE.Vector3(26, 0, 5.4), new THREE.Vector3(-26, 0, 5.4)],
  [new THREE.Vector3(-2.2, 0, 22), new THREE.Vector3(-2.2, 0, -22)],
  [new THREE.Vector3(-5.4, 0, 22), new THREE.Vector3(-5.4, 0, -22)],
  [new THREE.Vector3(2.2, 0, -22), new THREE.Vector3(2.2, 0, 22)],
  [new THREE.Vector3(5.4, 0, -22), new THREE.Vector3(5.4, 0, 22)],
];

const LABELS = [
  "wrong_way · 00:39.2",
  "risk 0.87",
  "failure_to_yield · 01:23.5",
  "stop_line · 00:47.8",
  "jaywalking · 01:52.0",
  "risk 0.64",
];

function RoadLines() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const push = (x1: number, z1: number, x2: number, z2: number) => {
      pts.push(x1, 0, z1, x2, 0, z2);
    };
    const dashed = (x1: number, z1: number, x2: number, z2: number, seg = 1.6, gap = 1.6) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const ux = dx / len;
      const uz = dz / len;
      for (let d = 0; d < len; d += seg + gap) {
        const e = Math.min(len, d + seg);
        push(x1 + ux * d, z1 + uz * d, x1 + ux * e, z1 + uz * e);
      }
    };

    // Outer carriageway edges (east-west)
    push(-40, -7.2, -8, -7.2);
    push(8, -7.2, 40, -7.2);
    push(-40, 7.2, -8, 7.2);
    push(8, 7.2, 40, 7.2);
    // Outer carriageway edges (north-south)
    push(-7.2, -40, -7.2, -8);
    push(-7.2, 8, -7.2, 40);
    push(7.2, -40, 7.2, -8);
    push(7.2, 8, 7.2, 40);

    // Lane dividers
    dashed(-40, -3.8, -9, -3.8);
    dashed(9, -3.8, 40, -3.8);
    dashed(-40, 3.8, -9, 3.8);
    dashed(9, 3.8, 40, 3.8);
    dashed(-3.8, -40, -3.8, -9);
    dashed(-3.8, 9, -3.8, 40);
    dashed(3.8, -40, 3.8, -9);
    dashed(3.8, 9, 3.8, 40);

    // Centre solid lines
    push(-40, 0, -8.6, 0);
    push(8.6, 0, 40, 0);
    push(0, -40, 0, -8.6);
    push(0, 8.6, 0, 40);

    // Stop lines
    push(-7.2, -8.4, -0.4, -8.4);
    push(0.4, 8.4, 7.2, 8.4);
    push(-8.4, 0.4, -8.4, 7.2);
    push(8.4, -7.2, 8.4, -0.4);

    // Zebra crossings
    for (let i = 0; i < 9; i++) {
      const x = -7 + i * 1.75;
      push(x, -12.4, x, -9.2);
      push(x, 9.2, x, 12.4);
      push(-12.4, x, -9.2, x);
      push(9.2, x, 12.4, x);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={TEAL} transparent opacity={0.5} />
    </lineSegments>
  );
}

type Particle = {
  lane: number;
  t: number;
  speed: number;
};

function Traffic({
  onLock,
}: {
  onLock: (screen: { x: number; y: number }, label: string) => void;
}) {
  const count = 64;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, size } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        lane: i % LANES.length,
        t: Math.random(),
        speed: 0.035 + Math.random() * 0.045,
      })),
    [],
  );

  const lockRef = useRef({ next: 2.5, target: 0, label: 0 });

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const d = Math.min(delta, 0.05);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!;
      p.t += p.speed * d;
      if (p.t > 1) p.t -= 1;
      const [a, b] = LANES[p.lane]!;
      vec.lerpVectors(a, b, p.t);
      dummy.position.set(vec.x, 0.12, vec.z);
      dummy.scale.setScalar(0.5 + (i % 3) * 0.12);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const lock = lockRef.current;
    lock.next -= d;
    if (lock.next <= 0) {
      lock.next = 3.4;
      lock.target = Math.floor(Math.random() * particles.length);
      lock.label = (lock.label + 1) % LABELS.length;
      const p = particles[lock.target]!;
      const [a, b] = LANES[p.lane]!;
      vec.lerpVectors(a, b, p.t);
      vec.y = 0.12;
      vec.project(camera);
      onLock(
        { x: (vec.x * 0.5 + 0.5) * size.width, y: (-vec.y * 0.5 + 0.5) * size.height },
        LABELS[lock.label]!,
      );
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.36, 8, 8]} />
      <meshBasicMaterial color={TEAL_BRIGHT} transparent opacity={0.85} />
    </instancedMesh>
  );
}

function Rig({ pointer }: { pointer: { x: number; y: number } }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x += (22 + pointer.x * 3 - camera.position.x) * 0.04;
    camera.position.y += (26 + pointer.y * -2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [lock, setLock] = useState<{ x: number; y: number; label: string; key: number } | null>(
    null,
  );
  const keyRef = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPointer({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    if (!lock) return;
    const id = setTimeout(() => setLock(null), 2200);
    return () => clearTimeout(id);
  }, [lock]);

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [22, 26, 30], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={["#010909", 40, 95]} />
        <RoadLines />
        <Traffic
          onLock={(screen, label) => {
            keyRef.current += 1;
            setLock({ ...screen, label, key: keyRef.current });
          }}
        />
        <Rig pointer={pointer} />
      </Canvas>

      {lock && (
        <div
          key={lock.key}
          className="pointer-events-none absolute animate-in fade-in zoom-in-95 duration-300"
          style={{ left: lock.x - 44, top: lock.y - 34 }}
          aria-hidden
        >
          <div className="h-[68px] w-[88px] rounded-[4px] border border-teal/70" />
          <span className="mt-1 inline-block whitespace-nowrap bg-background/70 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-teal">
            {lock.label}
          </span>
        </div>
      )}
    </div>
  );
}
