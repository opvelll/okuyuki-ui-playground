import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { type ReactNode, Suspense } from "react";
import { useUiStore } from "../../store/uiStore";

const FLOOR_CONTACT_SKIN = 0.005;

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
            contactSkin={FLOOR_CONTACT_SKIN}
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
