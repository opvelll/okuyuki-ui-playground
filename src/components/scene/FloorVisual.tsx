import type { ComponentProps } from "react";

export function FloorVisual(props: ComponentProps<"group">) {
  return (
    <group {...props}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18, 1, 1]} />
        <meshStandardMaterial color="#d9dee7" roughness={0.92} />
      </mesh>
      <gridHelper
        args={[18, 18, "#8d99ae", "#c5cedb"]}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}
