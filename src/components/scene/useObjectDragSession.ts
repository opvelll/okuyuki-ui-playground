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
import { type AxisMagnetTarget, useUiStore } from "../../store/uiStore";
import type { SceneObject, Vector3Tuple } from "../../types/scene";
import {
  type DragPlaneOverlayState,
  calculateDragPlaneOverlayGeometry,
} from "./dragPlaneOverlay";
import { applyScreenDepthDragModifiers } from "./moveDragModifiers";

const OVERLAY_ORIENTATION_SHORTCUTS = {
  "1": "camera-facing",
  "2": "screen-vertical",
  "3": "screen-horizontal",
} as const;

type DragSession = {
  axisMagnetTarget: AxisMagnetTarget | null;
  currentPoint: Vector3;
  lastClientX: number;
  lastClientY: number;
  lastSurfaceNormal: Vector3 | null;
  objectId: string;
  plane: Plane;
  planeNormal: Vector3;
  pointerId: number;
  pointerOffset: Vector3;
  startPoint: Vector3;
};

type DragModifierState = {
  ctrlKey: boolean;
  shiftKey: boolean;
};

const vectorFromTuple = ([x, y, z]: Vector3Tuple) => new Vector3(x, y, z);
const tupleFromVector = ({ x, y, z }: Vector3): Vector3Tuple => [x, y, z];

export function useObjectDragSession({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const raycaster = useThree((state) => state.raycaster);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const setAxisMagnetTarget = useUiStore((state) => state.setAxisMagnetTarget);
  const setInteractionState = useUiStore((state) => state.setInteractionState);
  const setMoveOverlayDisplayMode = useUiStore(
    (state) => state.setMoveOverlayDisplayMode,
  );
  const setMoveOverlayOrientationMode = useUiStore(
    (state) => state.setMoveOverlayOrientationMode,
  );
  const selectObject = useUiStore((state) => state.selectObject);
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
      setAxisMagnetTarget(null);
      setOverlayState(null);
      setControlsEnabled(true);
      setInteractionState(nextState);
    },
    [setAxisMagnetTarget, setControlsEnabled, setInteractionState],
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

  const applyModifiers = useCallback(
    (
      dragSession: DragSession,
      position: Vector3,
      modifierState: DragModifierState,
    ) => {
      const { moveGridSnapStep } = useUiStore.getState();
      const adjustedResult = applyScreenDepthDragModifiers({
        currentAxisMagnetTarget: dragSession.axisMagnetTarget,
        ctrlKey: modifierState.ctrlKey,
        gridSnapStep: moveGridSnapStep,
        objectId: dragSession.objectId,
        objectsById: useSceneStore.getState().objectsById,
        position,
        shiftKey: modifierState.shiftKey,
      });

      dragSession.axisMagnetTarget = adjustedResult.axisMagnetTarget;
      dragSession.currentPoint.copy(adjustedResult.position);
      setAxisMagnetTarget(adjustedResult.axisMagnetTarget);
      useSceneStore
        .getState()
        .updateObjectPosition(
          dragSession.objectId,
          tupleFromVector(adjustedResult.position),
        );
      syncOverlayState(dragSession);

      return adjustedResult.position;
    },
    [setAxisMagnetTarget, syncOverlayState],
  );

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
    (
      dragSession: DragSession,
      clientX: number,
      clientY: number,
      modifierState: DragModifierState,
    ) => {
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

      return applyModifiers(
        dragSession,
        intersection.add(dragSession.pointerOffset),
        modifierState,
      );
    },
    [applyModifiers, projectClientPointToPlane],
  );

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>, sceneObject: SceneObject) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      selectObject(sceneObject.id);

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
        axisMagnetTarget: null,
        currentPoint: objectPosition.clone(),
        lastClientX: event.nativeEvent.clientX,
        lastClientY: event.nativeEvent.clientY,
        lastSurfaceNormal: null,
        objectId: sceneObject.id,
        plane,
        planeNormal,
        pointerId: event.pointerId,
        pointerOffset: objectPosition.sub(intersection),
        startPoint: vectorFromTuple(sceneObject.position),
      };
      syncOverlayState(dragSessionRef.current);
      setControlsEnabled(false);
      setInteractionState("dragging");
    },
    [
      camera,
      projectClientPointToPlane,
      selectObject,
      setControlsEnabled,
      setInteractionState,
      syncOverlayState,
    ],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession || event.pointerId !== dragSession.pointerId) {
        return;
      }

      updateDraggedObjectPosition(dragSession, event.clientX, event.clientY, {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession || event.pointerId !== dragSession.pointerId) {
        return;
      }

      finishDrag("active");
    };

    const handlePointerCancel = () => {
      if (dragSessionRef.current) {
        finishDrag(useUiStore.getState().selectedObjectId ? "active" : "idle");
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) {
        return;
      }

      event.preventDefault();

      const { moveDepthWheelDirection, moveDepthWheelStep, movePrecisionStep } =
        useUiStore.getState();
      const directionMultiplier = moveDepthWheelDirection === "normal" ? 1 : -1;
      const wheelStep = event.shiftKey ? movePrecisionStep : moveDepthWheelStep;
      const delta = (-event.deltaY / 100) * wheelStep * directionMultiplier;

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

      if (
        updateDraggedObjectPosition(dragSession, event.clientX, event.clientY, {
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
        }) ||
        updateDraggedObjectPosition(
          dragSession,
          dragSession.lastClientX,
          dragSession.lastClientY,
          {
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
          },
        )
      ) {
        return;
      }

      applyModifiers(dragSession, nextPosition, {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
      });
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
      if (dragSessionRef.current) {
        dragSessionRef.current = null;
        setAxisMagnetTarget(null);
        setOverlayState(null);
        setControlsEnabled(true);
      }
    };
  }, [
    applyModifiers,
    finishDrag,
    setAxisMagnetTarget,
    setControlsEnabled,
    updateDraggedObjectPosition,
  ]);

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

  return {
    handlePointerDown,
    overlayState,
  };
}
