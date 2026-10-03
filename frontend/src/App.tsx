import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Kitchen() {
  // all sizes in meters
  const length = 4;
  const depth = 0.6;
  const thickness = 0.02;
  const counterHeight = 0.9;
  const wallHeight = 0.6;

  return (
    <group>
      {/* cabinets */}
      <mesh position={[0, counterHeight / 2, 0]}>
        <boxGeometry args={[length, counterHeight, depth]} />
        <meshStandardMaterial color="#8a8f98" />
      </mesh>

      {/* countertop */}
      <mesh position={[0, counterHeight + thickness / 2, 0]}>
        <boxGeometry args={[length, thickness, depth]} />
        <meshStandardMaterial color="#f2efe9" />
      </mesh>

      {/* back wall cladding */}
      <mesh position={[0, counterHeight + thickness + wallHeight / 2, -depth / 2]}>
        <boxGeometry args={[length, wallHeight, thickness]} />
        <meshStandardMaterial color="#f2efe9" />
      </mesh>
    </group>
  );
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [3, 2.2, 3.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Kitchen />
        <OrbitControls target={[0, 0.9, 0]} />
      </Canvas>
    </div>
  );
}