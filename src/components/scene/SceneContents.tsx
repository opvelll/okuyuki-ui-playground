import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import type { ReactNode } from "react";

export function SceneContents({
  children,
  physicsEnabled,
}: {
  children: ReactNode;
  physicsEnabled: boolean;
}) {
  if (!physicsEnabled) {
    return <>{children}</>;
  }

  return (
    <Physics gravity={[0, -9.81, 0]}>
      <RigidBody friction={2.4} restitution={0} type="fixed">
        <CuboidCollider args={[9, 0.08, 9]} position={[0, -0.08, 0]} />
      </RigidBody>
      {children}
    </Physics>
  );
}
