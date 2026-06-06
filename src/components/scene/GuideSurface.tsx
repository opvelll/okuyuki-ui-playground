import { Edges } from "@react-three/drei";
import { GUIDE_SURFACE } from "./surfaceSnap";

export function GuideSurface() {
  return (
    <mesh
      aria-label="Surface snap guide"
      position={GUIDE_SURFACE.center}
      raycast={() => null}
    >
      <planeGeometry args={[GUIDE_SURFACE.width, GUIDE_SURFACE.height]} />
      <meshStandardMaterial
        color="#8bd3ff"
        depthWrite={false}
        opacity={0.2}
        transparent
      />
      <Edges color="#dff4ff" lineWidth={1.5} raycast={() => null} />
    </mesh>
  );
}
