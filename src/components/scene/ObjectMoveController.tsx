import { type ThreeEvent, useThree } from "@react-three/fiber";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plane, Vector2, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSceneStore } from "../../store/sceneStore";
import { useUiStore } from "../../store/uiStore";
import type { SceneObject, Vector3Tuple } from "../../types/scene";
import { DragPlaneOverlay } from "./DragPlaneOverlay";
import { DynamicSceneObject } from "./DynamicSceneObject";
import { SelectableSceneObject } from "./SelectableSceneObject";
import {
  type DragPlaneOverlayState,
  calculateDragPlaneOverlayGeometry,
} from "./dragPlaneOverlay";

const OVERLAY_ORIENTATION_SHORTCUTS = {
  "1": "camera-facing",
  "2": "screen-vertical",
  "3": "screen-horizontal",
} as const;

type DragSession = {
  currentPoint: Vector3;
  lastSurfaceNormal: Vector3 | null;
  objectId: string;
  lastClientX: number;
  lastClientY: number;
  plane: Plane;
  planeNormal: Vector3;
  pointerId: number;
  pointerOffset: Vector3;
  startPoint: Vector3;
};

const vectorFromTuple = ([x, y, z]: Vector3Tuple) => new Vector3(x, y, z);
const tupleFromVector = ({ x, y, z }: Vector3): Vector3Tuple => [x, y, z];

export function ObjectMoveController({
  controlsRef,
  physicsEnabled,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  physicsEnabled: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const raycaster = useThree((state) => state.raycaster);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const interactionState = useUiStore((state) => state.interactionState);
  const moveMode = useUiStore((state) => state.moveMode);
  const selectObject = useUiStore((state) => state.selectObject);
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const setInteractionState = useUiStore((state) => state.setInteractionState);
  const setMoveOverlayDisplayMode = useUiStore(
    (state) => state.setMoveOverlayDisplayMode,
  );
  const setMoveOverlayOrientationMode = useUiStore(
    (state) => state.setMoveOverlayOrientationMode,
  );
  const objectIds = useSceneStore((state) => state.objectIds);
  const objectsById = useSceneStore((state) => state.objectsById);
  const dragSessionRef = useRef<DragSession | null>(null);
  const pointerVector = useMemo(() => new Vector2(), []);
  const [overlayState, setOverlayState] =
    useState<DragPlaneOverlayState | null>(null);

  const setControlsEnabled = useCallback(
    (enabled: boolean) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = enabled;
      }
    },
    [controlsRef],
  );

  const finishDrag = useCallback(
    (nextState: "active" | "idle") => {
      dragSessionRef.current = null;
      setOverlayState(null);
      setControlsEnabled(true);
      setInteractionState(nextState);
    },
    [setControlsEnabled, setInteractionState],
  );

  const syncOverlayState = useCallback((dragSession: DragSession) => {
    const nextOverlayState: DragPlaneOverlayState = {
      currentPoint: dragSession.currentPoint.clone(),
      orientationMode: useUiStore.getState().moveOverlayOrientationMode,
      planeNormal: dragSession.planeNormal.clone(),
      previousSurfaceNormal: dragSession.lastSurfaceNormal?.clone() ?? null,
      startPoint: dragSession.startPoint.clone(),
    };
    const geometry = calculateDragPlaneOverlayGeometry(nextOverlayState);
    dragSession.lastSurfaceNormal = geometry.surfaceNormal.clone();
    setOverlayState(nextOverlayState);
  }, []);

  const projectClientPointToPlane = useCallback(
    (clientX: number, clientY: number, plane: Plane) => {
      const bounds = gl.domElement.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return null;
      }

      pointerVector.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerVector, camera);

      const intersection = new Vector3();
      if (!raycaster.ray.intersectPlane(plane, intersection)) {
        return null;
      }

      return intersection;
    },
    [camera, gl, pointerVector, raycaster],
  );

  const updateDraggedObjectPosition = useCallback(
    (dragSession: DragSession, clientX: number, clientY: number) => {
      const intersection = projectClientPointToPlane(
        clientX,
        clientY,
        dragSession.plane,
      );

      if (!intersection) {
        return null;
      }

      dragSession.lastClientX = clientX;
      dragSession.lastClientY = clientY;

      const nextPosition = intersection.add(dragSession.pointerOffset);
      dragSession.currentPoint.copy(nextPosition);
      useSceneStore
        .getState()
        .updateObjectPosition(
          dragSession.objectId,
          tupleFromVector(nextPosition),
        );
      syncOverlayState(dragSession);

      return nextPosition;
    },
    [projectClientPointToPlane, syncOverlayState],
  );

  const handlePointerDown = (
    event: ThreeEvent<PointerEvent>,
    sceneObject: SceneObject,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();

    selectObject(sceneObject.id);

    if (physicsEnabled || moveMode !== "screen-depth-drag") {
      return;
    }

    const planeNormal = camera.getWorldDirection(new Vector3()).normalize();
    const objectPosition = vectorFromTuple(sceneObject.position);
    const plane = new Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      objectPosition,
    );
    const intersection = projectClientPointToPlane(
      event.nativeEvent.clientX,
      event.nativeEvent.clientY,
      plane,
    );

    if (!intersection) {
      setInteractionState("active");
      return;
    }

    dragSessionRef.current = {
      currentPoint: objectPosition.clone(),
      lastSurfaceNormal: null,
      objectId: sceneObject.id,
      lastClientX: event.nativeEvent.clientX,
      lastClientY: event.nativeEvent.clientY,
      plane,
      planeNormal,
      pointerId: event.pointerId,
      pointerOffset: objectPosition.sub(intersection),
      startPoint: vectorFromTuple(sceneObject.position),
    };
    syncOverlayState(dragSessionRef.current);
    setControlsEnabled(false);
    setInteractionState("dragging");
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession || event.pointerId !== dragSession.pointerId) {
        return;
      }

      updateDraggedObjectPosition(dragSession, event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession || event.pointerId !== dragSession.pointerId) {
        return;
      }

      finishDrag("active");
    };

    const handleWheel = (event: WheelEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) {
        return;
      }

      event.preventDefault();

      const { moveDepthWheelDirection, moveDepthWheelStep } =
        useUiStore.getState();
      const directionMultiplier = moveDepthWheelDirection === "normal" ? 1 : -1;
      const delta =
        (-event.deltaY / 100) * moveDepthWheelStep * directionMultiplier;

      if (delta === 0) {
        return;
      }

      const currentObject =
        useSceneStore.getState().objectsById[dragSession.objectId];
      if (!currentObject) {
        return;
      }

      const forwardOffset = dragSession.planeNormal
        .clone()
        .multiplyScalar(delta);
      const nextPosition = vectorFromTuple(currentObject.position).add(
        forwardOffset,
      );
      const nextPlanePoint = dragSession.plane
        .coplanarPoint(new Vector3())
        .add(forwardOffset);

      dragSession.plane.setFromNormalAndCoplanarPoint(
        dragSession.planeNormal,
        nextPlanePoint,
      );

      // Reproject from the active pointer so wheel depth keeps the object under
      // the cursor instead of drifting until the next pointermove arrives.
      if (
        updateDraggedObjectPosition(dragSession, event.clientX, event.clientY)
      ) {
        return;
      }

      if (
        updateDraggedObjectPosition(
          dragSession,
          dragSession.lastClientX,
          dragSession.lastClientY,
        )
      ) {
        return;
      }

      useSceneStore
        .getState()
        .updateObjectPosition(
          dragSession.objectId,
          tupleFromVector(nextPosition),
        );
      dragSession.currentPoint.copy(nextPosition);
      syncOverlayState(dragSession);
    };

    const handlePointerCancel = () => {
      if (dragSessionRef.current) {
        finishDrag(useUiStore.getState().selectedObjectId ? "active" : "idle");
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [finishDrag, syncOverlayState, updateDraggedObjectPosition]);

  useEffect(() => {
    if (!physicsEnabled) {
      return;
    }

    if (dragSessionRef.current) {
      finishDrag("idle");
    } else {
      setControlsEnabled(true);
    }
  }, [finishDrag, physicsEnabled, setControlsEnabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const nextOrientationMode =
        OVERLAY_ORIENTATION_SHORTCUTS[
          event.key as keyof typeof OVERLAY_ORIENTATION_SHORTCUTS
        ];
      if (dragSessionRef.current && nextOrientationMode) {
        event.preventDefault();
        setMoveOverlayDisplayMode(
          event.key === "1"
            ? "mode-1"
            : event.key === "2"
              ? "mode-2"
              : "mode-3",
        );
        setMoveOverlayOrientationMode(nextOrientationMode);
        syncOverlayState(dragSessionRef.current);
        return;
      }

      if (event.key !== "Escape") {
        return;
      }

      if (dragSessionRef.current) {
        finishDrag("idle");
      }
      clearSelection();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    clearSelection,
    finishDrag,
    setMoveOverlayDisplayMode,
    setMoveOverlayOrientationMode,
    syncOverlayState,
  ]);

  return (
    <>
      {objectIds.map((objectId) => {
        const sceneObject = objectsById[objectId];

        if (!sceneObject) {
          return null;
        }

        if (physicsEnabled) {
          return (
            <DynamicSceneObject key={`${objectId}-dynamic`} {...sceneObject} />
          );
        }

        return (
          <SelectableSceneObject
            dragging={
              interactionState === "dragging" &&
              selectedObjectId === sceneObject.id
            }
            key={`${objectId}-static`}
            onPointerDown={handlePointerDown}
            sceneObject={sceneObject}
            selected={selectedObjectId === sceneObject.id}
          />
        );
      })}
      {!physicsEnabled && interactionState === "dragging" && overlayState ? (
        <DragPlaneOverlay overlayState={overlayState} />
      ) : null}
    </>
  );
}
