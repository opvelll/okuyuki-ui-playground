import { create } from "zustand";
import { initialSceneObjects } from "../data/sceneObjects";
import { compareVector3Tuple } from "../lib/vector3Tuple";
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
      if (
        !targetObject ||
        compareVector3Tuple(targetObject.rotation, rotation)
      ) {
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
        (compareVector3Tuple(targetObject.position, transform.position) &&
          compareVector3Tuple(targetObject.rotation, transform.rotation))
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
      if (
        !targetObject ||
        compareVector3Tuple(targetObject.position, position)
      ) {
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
