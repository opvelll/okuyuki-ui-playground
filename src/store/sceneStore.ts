import { create } from "zustand";
import { initialSceneObjects } from "../data/sceneObjects";
import type { SceneObject, Vector3Tuple } from "../types/scene";

type SceneState = {
  objectsById: Record<string, SceneObject>;
  resetScene: () => void;
  updateObjectPosition: (id: string, position: Vector3Tuple) => void;
};

const positionsMatch = (
  currentPosition: Vector3Tuple,
  nextPosition: Vector3Tuple,
) =>
  currentPosition[0] === nextPosition[0] &&
  currentPosition[1] === nextPosition[1] &&
  currentPosition[2] === nextPosition[2];

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
