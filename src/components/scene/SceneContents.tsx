import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { type ReactNode, Suspense } from "react";
import { useUiStore } from "../../store/uiStore";

export function SceneContents({
  children,
  physicsEnabled,
}: {
  children: ReactNode;
  physicsEnabled: boolean;
}) {
  const floorFriction = useUiStore((state) => state.floorFriction);
  const floorRestitution = useUiStore((state) => state.floorRestitution);
  const gravityY = useUiStore((state) => state.gravityY);

  if (!physicsEnabled) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, gravityY, 0]}>
        <RigidBody type="fixed">
          <CuboidCollider
            args={[9, 0.08, 9]}
            friction={floorFriction}
            position={[0, -0.08, 0]}
            restitution={floorRestitution}
          />
        </RigidBody>
        {children}
      </Physics>
    </Suspense>
  );
}
