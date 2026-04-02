export type Vector3Tuple = [number, number, number];

export type ShapeKind =
  | "box"
  | "capsule"
  | "cone"
  | "cylinder"
  | "sphere"
  | "torus";

export type SceneObject = {
  color: string;
  id: string;
  kind: ShapeKind;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};
