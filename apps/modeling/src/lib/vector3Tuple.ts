import type { Vector3Tuple } from "../types/scene";

export function compareVector3Tuple(a: Vector3Tuple, b: Vector3Tuple) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
