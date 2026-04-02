import type { SceneObject } from "../types/scene";

export const initialSceneObjects: SceneObject[] = [
  {
    color: "#ff8a5b",
    id: "amber-box",
    kind: "box",
    position: [-2.3, 0.45, -0.8],
    rotation: [0.12, 0.5, 0.08],
    scale: [1, 1, 1],
  },
  {
    color: "#f7c948",
    id: "gold-sphere",
    kind: "sphere",
    position: [-0.9, 0.55, 1.1],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  {
    color: "#ef5da8",
    id: "rose-cone",
    kind: "cone",
    position: [0.45, 0.54, -1.15],
    rotation: [0, -0.35, 0],
    scale: [1, 1, 1],
  },
  {
    color: "#44c2fd",
    id: "sky-cylinder",
    kind: "cylinder",
    position: [1.8, 0.575, 0.65],
    rotation: [0.18, 0.12, 0],
    scale: [1, 1, 1],
  },
  {
    color: "#b794f4",
    id: "violet-torus",
    kind: "torus",
    position: [2.8, 0.68, -0.35],
    rotation: [1.1, 0.28, 0.24],
    scale: [0.9, 0.9, 0.9],
  },
  {
    color: "#4fd1c5",
    id: "mint-capsule",
    kind: "capsule",
    position: [-3.15, 0.675, 1.4],
    rotation: [0.28, -0.4, 0.1],
    scale: [1, 1, 1],
  },
];
