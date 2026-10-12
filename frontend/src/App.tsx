import { Component, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

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

const imageUrl = (slab: Slab) => `${API}/images/${slab.image_path}`;

// ---------- side panel ----------

function SlabPanel({
  slabs,
  selectedId,
  error,
  onSelect,
  onUpload,
}: {
  slabs: Slab[];
  selectedId: number | null;
  error: string;
  onSelect: (id: number) => void;
  onUpload: (id: number, file: File) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 1,
        width: 300,
        maxHeight: "calc(100vh - 32px)",
        overflowY: "auto",
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
        <div
          key={slab.id}
          onClick={() => onSelect(slab.id)}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            cursor: "pointer",
            border: slab.id === selectedId ? "2px solid #2563eb" : "2px solid transparent",
            background: slab.id === selectedId ? "#eff6ff" : "transparent",
          }}
        >
          {slab.image_path ? (
            <img
              src={imageUrl(slab)}
              crossOrigin="anonymous" // load it the same way the 3D texture does, so the browser cache works for both
              alt=""
              style={{ width: 56, height: 28, objectFit: "cover", borderRadius: 3 }}
            />
          ) : (
            <div style={{ width: 56, height: 28, background: "#e5e7eb", borderRadius: 3 }} />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 14 }}>{slab.name}</strong>
            <div style={{ fontSize: 12, color: "#555" }}>
              {slab.type} · {slab.width_mm} × {slab.height_mm} × {slab.thickness_mm} mm
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 12, color: "#2563eb", cursor: "pointer" }}
            >
              {slab.image_path ? "Replace photo" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(slab.id, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}



// ---------- kitchen size form ----------

type KitchenSize = {
  lengthCm: number;
  depthCm: number;
  counterHeightCm: number;
  wallHeightCm: number;
};

const DEFAULT_SIZE: KitchenSize = {
  lengthCm: 300,
  depthCm: 60,
  counterHeightCm: 90,
  wallHeightCm: 60,
};

const SIZE_FIELDS: { key: keyof KitchenSize; label: string; min: number; max: number }[] = [
  { key: "lengthCm", label: "Length", min: 50, max: 800 },
  { key: "depthCm", label: "Depth", min: 40, max: 120 },
  { key: "counterHeightCm", label: "Counter height", min: 70, max: 110 },
  { key: "wallHeightCm", label: "Wall cladding height", min: 0, max: 150 },
];

// A number box that lets you type freely (e.g. clear it and type "350"),
// but only passes valid values on to the kitchen.
function NumberField({ value, min, max, onChange }: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const number = Number(e.target.value);
        if (e.target.value !== "" && number >= min && number <= max) onChange(number);
      }}
      onBlur={() => setDraft(String(value))} // leaving the box restores the last valid value
      style={{ width: 64, marginRight: 4 }}
    />
  );
}

function KitchenForm({ size, onChange }: {
  size: KitchenSize;
  onChange: (size: KitchenSize) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1,
        width: 260,
        padding: 16,
        background: "white",
        borderRadius: 8,
        fontFamily: "sans-serif",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    >
      <h3 style={{ margin: "0 0 12px" }}>Kitchen</h3>
      {SIZE_FIELDS.map((field) => (
        <label
          key={field.key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          {field.label}
          <span>
            <NumberField
              value={size[field.key]}
              min={field.min}
              max={field.max}
              onChange={(value) => onChange({ ...size, [field.key]: value })}
            />
            cm
          </span>
        </label>
      ))}
    </div>
  );
}

// ---------- 3D kitchen ----------

const PLAIN_STONE = "#f2efe9";

// Puts the slab photo on a surface at real scale:
// a face that is 600 mm deep shows only 600 mm of the slab, not the whole slab squeezed in.
function StoneMaterial({ slab, faceWidthM, faceHeightM }: {
  slab: Slab;
  faceWidthM: number;
  faceHeightM: number;
}) {
  const base = useTexture(imageUrl(slab));

  const map = useMemo(() => {
    const t = base.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((faceWidthM * 1000) / slab.width_mm, (faceHeightM * 1000) / slab.height_mm);
    t.needsUpdate = true;
    return t;
  }, [base, faceWidthM, faceHeightM, slab.width_mm, slab.height_mm]);

  return <meshStandardMaterial map={map} roughness={0.3} />;
}

// If a slab photo fails to load (deleted file, broken link), show the fallback
// instead of letting the error blank out the whole 3D view.
class PhotoErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StonePiece({ slab, size, position, faceWidthM, faceHeightM }: {
  slab: Slab | undefined;
  size: [number, number, number];
  position: [number, number, number];
  faceWidthM: number;
  faceHeightM: number;
}) {
  const plain = <meshStandardMaterial color={PLAIN_STONE} />;
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      {slab?.image_path ? (
        <PhotoErrorBoundary key={slab.image_path} fallback={plain}>
          <Suspense fallback={plain}>
            <StoneMaterial slab={slab} faceWidthM={faceWidthM} faceHeightM={faceHeightM} />
          </Suspense>
        </PhotoErrorBoundary>
      ) : (
        plain
      )}
    </mesh>
  );
}

function Kitchen({ slab, size }: { slab: Slab | undefined; size: KitchenSize }) {
  // all sizes in meters
  const length = size.lengthCm / 100;
  const depth = size.depthCm / 100;
  const thickness = slab ? slab.thickness_mm / 1000 : 0.02;
  const counterHeight = size.counterHeightCm / 100;
  const wallHeight = size.wallHeightCm / 100;
  return (
    <group>
      {/* cabinets */}
      <mesh position={[0, counterHeight / 2, 0]}>
        <boxGeometry args={[length, counterHeight, depth]} />
        <meshStandardMaterial color="#8a8f98" />
      </mesh>

      {/* countertop: its top face is length × depth */}
      <StonePiece
        slab={slab}
        size={[length, thickness, depth]}
        position={[0, counterHeight + thickness / 2, 0]}
        faceWidthM={length}
        faceHeightM={depth}
      />

            {/* back wall cladding: its front face is length × wallHeight */}
      {wallHeight > 0 && (
        <StonePiece
          slab={slab}
          size={[length, wallHeight, thickness]}
          position={[0, counterHeight + thickness + wallHeight / 2, -depth / 2]}
          faceWidthM={length}
          faceHeightM={wallHeight}
        />
      )}
    </group>
  );
}

// ---------- page ----------

export default function App() {
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [kitchenSize, setKitchenSize] = useState<KitchenSize>(DEFAULT_SIZE);

  const loadSlabs = () =>
    fetch(`${API}/slabs`)
      .then((res) => res.json())
      .then((data: Slab[]) => {
        setSlabs(data);
        setError("");
        // select the first slab with a photo, if nothing is selected yet
        setSelectedId((current) => current ?? data.find((s) => s.image_path)?.id ?? null);
      })
      .catch(() => setError("Cannot reach the backend"));

  useEffect(() => {
    loadSlabs();
  }, []);

  const uploadPhoto = async (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/slabs/${id}/image`, { method: "POST", body: form });
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    await loadSlabs();
    setSelectedId(id);
  };

  const selected = slabs.find((s) => s.id === selectedId);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <SlabPanel
        slabs={slabs}
        selectedId={selectedId}
        error={error}
        onSelect={setSelectedId}
        onUpload={uploadPhoto}
      />
      <KitchenForm size={kitchenSize} onChange={setKitchenSize} />
      <Canvas camera={{ position: [3, 2.2, 3.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Kitchen slab={selected} size={kitchenSize} />
        <OrbitControls target={[0, 0.9, 0]} />
      </Canvas>
    </div>
  );
}