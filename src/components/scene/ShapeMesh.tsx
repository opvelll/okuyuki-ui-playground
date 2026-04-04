import { Edges } from "@react-three/drei";
import type { ShapeKind } from "../../types/scene";

type ShapeMeshProps = {
  color: string;
  dragging?: boolean;
  kind: ShapeKind;
  selected?: boolean;
};

function ShapeGeometry({ kind }: { kind: ShapeKind }) {
  if (kind === "box") {
    return <boxGeometry args={[0.9, 0.9, 0.9]} />;
  }

  if (kind === "sphere") {
    return <sphereGeometry args={[0.55, 48, 48]} />;
  }

  if (kind === "cone") {
    return <coneGeometry args={[0.52, 1.08, 48]} />;
  }

  if (kind === "cylinder") {
    return <cylinderGeometry args={[0.4, 0.4, 1.15, 48]} />;
  }

  if (kind === "torus") {
    return <torusGeometry args={[0.5, 0.18, 24, 72]} />;
  }

  return <capsuleGeometry args={[0.3, 0.75, 10, 20]} />;
}

export function ShapeMesh({
  color,
  dragging = false,
  kind,
  selected = false,
}: ShapeMeshProps) {
  return (
    <mesh castShadow receiveShadow>
      <ShapeGeometry kind={kind} />
      <meshStandardMaterial
        color={color}
        emissive={dragging ? "#dff4ff" : "#000000"}
        emissiveIntensity={dragging ? 0.34 : 0}
        metalness={selected ? 0.24 : 0.2}
        roughness={dragging ? 0.26 : 0.38}
      />
      {selected ? (
        <Edges color="#f8fafc" lineWidth={2.4} scale={1.06} threshold={20} />
      ) : null}
    </mesh>
  );
}
