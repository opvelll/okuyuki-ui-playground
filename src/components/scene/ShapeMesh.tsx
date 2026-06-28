import { Line, Outlines } from "@react-three/drei";
import { useMemo } from "react";
import { Vector3 } from "three";
import { useUiStore } from "../../store/uiStore";
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

function TorusSelectionRings({ color }: { color: string }) {
  const { innerRingPoints, outerRingPoints } = useMemo(() => {
    const segmentCount = 96;
    const createRingPoints = (radius: number) =>
      Array.from({ length: segmentCount + 1 }, (_, index) => {
        const angle = (index / segmentCount) * Math.PI * 2;

        return new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0,
        );
      });

    return {
      innerRingPoints: createRingPoints(0.32),
      outerRingPoints: createRingPoints(0.68),
    };
  }, []);

  return (
    <>
      <Line
        color={color}
        depthTest={false}
        lineWidth={2}
        points={outerRingPoints}
        renderOrder={11}
        toneMapped={false}
      />
      <Line
        color={color}
        depthTest={false}
        lineWidth={2}
        points={innerRingPoints}
        renderOrder={11}
        toneMapped={false}
      />
    </>
  );
}

export function ShapeMesh({
  color,
  dragging = false,
  kind,
  selected = false,
}: ShapeMeshProps) {
  const generalSelectionOutlineColor = useUiStore(
    (state) => state.generalSelectionOutlineColor,
  );
  const generalSelectionOutlineThickness = useUiStore(
    (state) => state.generalSelectionOutlineThickness,
  );

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
      {selected && kind === "torus" ? (
        <TorusSelectionRings color={generalSelectionOutlineColor} />
      ) : null}
      {selected && kind !== "torus" ? (
        <Outlines
          angle={Math.PI}
          color={generalSelectionOutlineColor}
          opacity={1}
          renderOrder={10}
          screenspace={false}
          thickness={generalSelectionOutlineThickness}
          toneMapped={false}
        />
      ) : null}
    </mesh>
  );
}
