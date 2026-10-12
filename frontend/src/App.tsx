import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const API = "http://localhost:8000";

type Slab = {
  id: number;
  name: string;
  type: "quartz" | "natural" | "porcelain";
  width_mm: number;
  height_mm: number;
  thickness_mm: number;
  image_path: string | null;
};

function SlabList() {
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/slabs`)
      .then((res) => res.json())
      .then(setSlabs)
      .catch(() => setError("Cannot reach the backend"));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 1,
        width: 260,
        padding: 16,
        background: "white",
        borderRadius: 8,
        fontFamily: "sans-serif",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    >
      <h3 style={{ margin: "0 0 12px" }}>Slabs</h3>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!error && slabs.length === 0 && <p>No slabs yet</p>}
      {slabs.map((slab) => (
        <div key={slab.id} style={{ marginBottom: 10 }}>
          <strong>{slab.name}</strong>
          <div style={{ fontSize: 13, color: "#555" }}>
            {slab.type} · {slab.width_mm} × {slab.height_mm} × {slab.thickness_mm} mm
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <SlabList />
      <Canvas camera={{ position: [3, 2.2, 3.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Kitchen />
        <OrbitControls target={[0, 0.9, 0]} />
      </Canvas>
    </div>
  );
}