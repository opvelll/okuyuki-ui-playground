import { create } from "zustand";
import { initialSceneObjects } from "../data/sceneObjects";
import type { SceneObject, Vector3Tuple } from "../types/scene";

type SceneState = {
  objectsById: Record<string, SceneObject>;
  resetScene: () => void;
  updateObjectRotation: (id: string, rotation: Vector3Tuple) => void;
  updateObjectTransform: (
    id: string,
    transform: Pick<SceneObject, "position" | "rotation">,
  ) => void;
  updateObjectPosition: (id: string, position: Vector3Tuple) => void;
};

const positionsMatch = (
  currentPosition: Vector3Tuple,
  nextPosition: Vector3Tuple,
) =>
  currentPosition[0] === nextPosition[0] &&
  currentPosition[1] === nextPosition[1] &&
  currentPosition[2] === nextPosition[2];

const rotationsMatch = (
  currentRotation: Vector3Tuple,
  nextRotation: Vector3Tuple,
) =>
  currentRotation[0] === nextRotation[0] &&
  currentRotation[1] === nextRotation[1] &&
  currentRotation[2] === nextRotation[2];

const createObjectsById = () =>
  Object.fromEntries(
    initialSceneObjects.map((sceneObject) => [sceneObject.id, sceneObject]),
  ) as Record<string, SceneObject>;

const createInitialSceneState = () => ({
  objectsById: createObjectsById(),
});

export const useSceneStore = create<SceneState>((set) => ({
  ...createInitialSceneState(),
  resetScene: () => set(createInitialSceneState()),
  updateObjectRotation: (id, rotation) =>
    set((state) => {
      const targetObject = state.objectsById[id];
      if (!targetObject || rotationsMatch(targetObject.rotation, rotation)) {
        return state;
      }

      return {
        objectsById: {
          ...state.objectsById,
          [id]: {
            ...targetObject,
            rotation,
          },
        },
      };
    }),
  updateObjectTransform: (id, transform) =>
    set((state) => {
      const targetObject = state.objectsById[id];
      if (
        !targetObject ||
        (positionsMatch(targetObject.position, transform.position) &&
          rotationsMatch(targetObject.rotation, transform.rotation))
      ) {
        return state;
      }

      return {
        objectsById: {
          ...state.objectsById,
          [id]: {
            ...targetObject,
            position: transform.position,
            rotation: transform.rotation,
          },
        },
      };
    }),
  updateObjectPosition: (id, position) =>
    set((state) => {
      const targetObject = state.objectsById[id];
      if (!targetObject || positionsMatch(targetObject.position, position)) {
        return state;
      }

      return {
        objectsById: {
          ...state.objectsById,
          [id]: {
            ...targetObject,
            position,
          },
        },
      };
    }),
}));
