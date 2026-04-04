import type { ComponentProps } from "react";
import { useUiStore } from "../../store/uiStore";

export function FloorVisual(props: ComponentProps<"group">) {
  const floorColor = useUiStore((state) => state.floorColor);
  const gridMajorColor = useUiStore((state) => state.gridMajorColor);
  const gridMinorColor = useUiStore((state) => state.gridMinorColor);

  return (
    <group {...props}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18, 1, 1]} />
        <meshStandardMaterial color={floorColor} roughness={0.92} />
      </mesh>
      <gridHelper
        args={[18, 18, gridMajorColor, gridMinorColor]}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}
