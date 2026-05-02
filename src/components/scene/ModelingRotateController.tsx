import { type ThreeEvent, useThree } from "@react-three/fiber";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MathUtils,
  type OrthographicCamera,
  type PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelingStore } from "../../store/modelingStore";
import { useUiStore } from "../../store/uiStore";
import {
  MIN_ROTATE_UI_RADIUS_PX,
  RotateGizmo,
  getPrincipalAxisVector,
  getTwistAxisVector,
  getViewportWorldHeightAtDistance,
} from "./ObjectRotateController";
import {
  type ArcballSnapRingAxis,
  createArcballQuaternion,
  createSnapRingQuaternion,
  mapPointerToArcballVector,
  selectArcballSnapRingAxisFromDrag,
} from "./objectRotateArcball";
import { snapAngleToStep, snapAxisRotationQuaternion } from "./rotateSnap";

type ModelingRotateSession = {
  arcballCenterClientX: number;
  arcballCenterClientY: number;
  arcballRadiusPx: number;
  center: Vector3;
  pointerId: number;
  snapRingAxis: ArcballSnapRingAxis | null;
  startArcballVecCamera: Vector3;
  startVertexPositionsById: Record<string, Vector3>;
  twistAngleRad: number;
  vertexIds: string[];
};

function getSelectedVertexCenter(
  vertexIds: string[],
  vertexPositionsById: Record<string, Vector3>,
) {
  if (vertexIds.length === 0) {
    return null;
  }

  const center = new Vector3();
  let count = 0;

  for (const vertexId of vertexIds) {
    const position = vertexPositionsById[vertexId];
    if (!position) {
      continue;
    }

    center.add(position);
    count += 1;
  }

  return count > 0 ? center.multiplyScalar(1 / count) : null;
}

export function ModelingRotateController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const beginVertexRotateDrag = useModelingStore(
    (state) => state.beginVertexRotateDrag,
  );
  const cancelVertexRotateDrag = useModelingStore(
    (state) => state.cancelVertexRotateDrag,
  );
  const commitVertexRotateDrag = useModelingStore(
    (state) => state.commitVertexRotateDrag,
  );
  const clearVertexSelection = useModelingStore(
    (state) => state.clearVertexSelection,
  );
  const updateVertexRotateDrag = useModelingStore(
    (state) => state.updateVertexRotateDrag,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const setModelingTool = useUiStore((state) => state.setModelingTool);
  const rotateUiOpacity = useUiStore((state) => state.rotateUiOpacity);
  const rotateUiRadiusPx = useUiStore((state) => state.rotateUiRadiusPx);
  const rotateArcballSensitivity = useUiStore(
    (state) => state.rotateArcballSensitivity,
  );
  const rotateAngleSnapStepDeg = useUiStore(
    (state) => state.rotateAngleSnapStepDeg,
  );
  const rotateGizmoRingColor = useUiStore(
    (state) => state.rotateGizmoRingColor,
  );
  const rotateGizmoSphereColor = useUiStore(
    (state) => state.rotateGizmoSphereColor,
  );
  const rotateSessionRef = useRef<ModelingRotateSession | null>(null);
  const latestPointerRef = useRef({ clientX: 0, clientY: 0 });
  const [dragVersion, setDragVersion] = useState(0);
  const activeModel = modelsById[currentModelId];
  const selectedVertexPositionsById = useMemo(() => {
    if (!activeModel) {
      return {};
    }

    return Object.fromEntries(
      selectedVertexIds.flatMap((vertexId) => {
        const vertex = activeModel.verticesById[vertexId];
        return vertex ? [[vertexId, new Vector3(...vertex.position)]] : [];
      }),
    ) as Record<string, Vector3>;
  }, [activeModel, selectedVertexIds]);
  const pivot = useMemo(
    () =>
      getSelectedVertexCenter(selectedVertexIds, selectedVertexPositionsById),
    [selectedVertexIds, selectedVertexPositionsById],
  );
  const radiusWorld = useMemo(() => {
    if (!pivot) {
      return 0;
    }

    const clampedRadiusPx = Math.max(MIN_ROTATE_UI_RADIUS_PX, rotateUiRadiusPx);
    const distance = pivot.distanceTo(camera.position);
    const worldHeight = getViewportWorldHeightAtDistance(
      camera as PerspectiveCamera | OrthographicCamera,
      distance,
    );

    return (
      (worldHeight * clampedRadiusPx) / Math.max(gl.domElement.clientHeight, 1)
    );
  }, [camera, gl, pivot, rotateUiRadiusPx]);

  const setControlsEnabled = useCallback(
    (enabled: boolean) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = enabled;
      }
    },
    [controlsRef],
  );

  const computeArcballPointerState = useCallback(
    (clientX: number, clientY: number) => {
      if (!pivot || radiusWorld <= 0) {
        return null;
      }

      const bounds = gl.domElement.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return null;
      }

      const projectedPivot = pivot.clone().project(camera);
      if (projectedPivot.z < -1 || projectedPivot.z > 1) {
        return null;
      }

      const radiusPx = Math.max(MIN_ROTATE_UI_RADIUS_PX, rotateUiRadiusPx);
      const centerClientX =
        (projectedPivot.x + 1) * 0.5 * bounds.width + bounds.left;
      const centerClientY =
        (1 - projectedPivot.y) * 0.5 * bounds.height + bounds.top;

      return {
        centerClientX,
        centerClientY,
        radiusPx,
        vector: mapPointerToArcballVector(
          clientX,
          clientY,
          centerClientX,
          centerClientY,
          radiusPx,
        ),
      };
    },
    [camera, gl, pivot, radiusWorld, rotateUiRadiusPx],
  );

  const isPointerInsideGizmoBounds = useCallback(
    (clientX: number, clientY: number) => {
      const arcballPointerState = computeArcballPointerState(clientX, clientY);
      if (!arcballPointerState) {
        return false;
      }

      const deltaX = clientX - arcballPointerState.centerClientX;
      const deltaY = clientY - arcballPointerState.centerClientY;
      return Math.hypot(deltaX, deltaY) <= arcballPointerState.radiusPx;
    },
    [computeArcballPointerState],
  );

  const applyRotationFromSession = useCallback(
    (
      rotateSession: ModelingRotateSession,
      clientX: number,
      clientY: number,
      snapToRing: boolean,
      snapToAngle: boolean,
    ) => {
      const currentArcballVecCamera = mapPointerToArcballVector(
        clientX,
        clientY,
        rotateSession.arcballCenterClientX,
        rotateSession.arcballCenterClientY,
        rotateSession.arcballRadiusPx,
      );
      const { rotateTwistAxis } = useUiStore.getState();
      const snapAngleStepRad = MathUtils.degToRad(rotateAngleSnapStepDeg);
      const swingQuaternion = snapToRing
        ? (() => {
            rotateSession.snapRingAxis = selectArcballSnapRingAxisFromDrag({
              cameraQuaternion: camera.quaternion,
              currentVector: currentArcballVecCamera,
              startVector: rotateSession.startArcballVecCamera,
            });
            const snappedQuaternion = createSnapRingQuaternion(
              rotateSession.startArcballVecCamera,
              currentArcballVecCamera,
              camera.quaternion,
              rotateSession.snapRingAxis,
              rotateArcballSensitivity,
            );
            return snapToAngle
              ? snapAxisRotationQuaternion(
                  snappedQuaternion,
                  getPrincipalAxisVector(rotateSession.snapRingAxis),
                  snapAngleStepRad,
                )
              : snappedQuaternion;
          })()
        : (() => {
            rotateSession.snapRingAxis = null;
            return createArcballQuaternion(
              rotateSession.startArcballVecCamera,
              currentArcballVecCamera,
              camera.quaternion,
              rotateArcballSensitivity,
            );
          })();
      const twistAngleRad = snapToAngle
        ? snapAngleToStep(rotateSession.twistAngleRad, snapAngleStepRad)
        : rotateSession.twistAngleRad;
      const twistQuaternion = new Quaternion().setFromAxisAngle(
        getTwistAxisVector(rotateTwistAxis),
        twistAngleRad,
      );
      const targetQuaternion = twistQuaternion.multiply(swingQuaternion);
      const nextPositions = Object.fromEntries(
        rotateSession.vertexIds.flatMap((vertexId) => {
          const startPosition =
            rotateSession.startVertexPositionsById[vertexId];
          if (!startPosition) {
            return [];
          }

          const nextPosition = startPosition
            .clone()
            .sub(rotateSession.center)
            .applyQuaternion(targetQuaternion)
            .add(rotateSession.center);

          return [
            [
              vertexId,
              [nextPosition.x, nextPosition.y, nextPosition.z] as [
                number,
                number,
                number,
              ],
            ],
          ];
        }),
      );

      updateVertexRotateDrag(nextPositions);
      setDragVersion((version) => version + 1);
    },
    [
      camera.quaternion,
      rotateAngleSnapStepDeg,
      rotateArcballSensitivity,
      updateVertexRotateDrag,
    ],
  );

  const finishDrag = useCallback(() => {
    const rotateSession = rotateSessionRef.current;
    if (!rotateSession) {
      return;
    }

    rotateSessionRef.current = null;
    try {
      gl.domElement.releasePointerCapture(rotateSession.pointerId);
    } catch {
      // ignore pointer-capture races during teardown
    }
    setControlsEnabled(true);
    commitVertexRotateDrag();
  }, [commitVertexRotateDrag, gl, setControlsEnabled]);

  const handleGizmoPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (
        modelingTool !== "rotate" ||
        event.button !== 0 ||
        !pivot ||
        selectedVertexIds.length === 0
      ) {
        return;
      }

      event.stopPropagation();
      const arcballPointerState = computeArcballPointerState(
        event.nativeEvent.clientX,
        event.nativeEvent.clientY,
      );
      if (!arcballPointerState || !beginVertexRotateDrag(selectedVertexIds)) {
        return;
      }

      rotateSessionRef.current = {
        arcballCenterClientX: arcballPointerState.centerClientX,
        arcballCenterClientY: arcballPointerState.centerClientY,
        arcballRadiusPx: arcballPointerState.radiusPx,
        center: pivot.clone(),
        pointerId: event.pointerId,
        snapRingAxis: null,
        startArcballVecCamera: arcballPointerState.vector,
        startVertexPositionsById: selectedVertexPositionsById,
        twistAngleRad: 0,
        vertexIds: [...selectedVertexIds],
      };
      latestPointerRef.current = {
        clientX: event.nativeEvent.clientX,
        clientY: event.nativeEvent.clientY,
      };
      gl.domElement.setPointerCapture(event.pointerId);
      setControlsEnabled(false);
    },
    [
      beginVertexRotateDrag,
      computeArcballPointerState,
      gl,
      modelingTool,
      pivot,
      selectedVertexIds,
      selectedVertexPositionsById,
      setControlsEnabled,
    ],
  );

  const handleWheelTwist = useCallback(
    (event: WheelEvent) => {
      const rotateSession = rotateSessionRef.current;
      if (modelingTool !== "rotate" || !rotateSession) {
        return;
      }

      event.preventDefault();
      const { rotateWheelDirection, rotateWheelRotateStepDeg } =
        useUiStore.getState();
      const wheelSteps = Math.sign(-event.deltaY);
      if (wheelSteps === 0) {
        return;
      }

      const directionMultiplier = rotateWheelDirection === "reverse" ? -1 : 1;
      rotateSession.twistAngleRad +=
        MathUtils.degToRad(rotateWheelRotateStepDeg) *
        wheelSteps *
        directionMultiplier;
      applyRotationFromSession(
        rotateSession,
        latestPointerRef.current.clientX,
        latestPointerRef.current.clientY,
        event.ctrlKey,
        event.ctrlKey && event.shiftKey,
      );
    },
    [applyRotationFromSession, modelingTool],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const clickedVisibleGizmoBounds =
        selectedVertexIds.length >= 2 &&
        isPointerInsideGizmoBounds(event.clientX, event.clientY);

      if (
        modelingTool !== "rotate" ||
        event.button !== 0 ||
        rotateSessionRef.current ||
        clickedVisibleGizmoBounds
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      clearVertexSelection();
      setModelingTool("lasso");
    };

    const handlePointerMove = (event: PointerEvent) => {
      latestPointerRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };

      const rotateSession = rotateSessionRef.current;
      if (!rotateSession || event.pointerId !== rotateSession.pointerId) {
        return;
      }

      applyRotationFromSession(
        rotateSession,
        event.clientX,
        event.clientY,
        event.ctrlKey,
        event.ctrlKey && event.shiftKey,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const rotateSession = rotateSessionRef.current;
      if (!rotateSession || event.pointerId !== rotateSession.pointerId) {
        return;
      }

      finishDrag();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      const rotateSession = rotateSessionRef.current;
      if (!rotateSession || event.pointerId !== rotateSession.pointerId) {
        return;
      }

      finishDrag();
    };

    const handleKeyEvent = (event: KeyboardEvent) => {
      if (event.key === "Control" || event.key === "Shift") {
        const rotateSession = rotateSessionRef.current;
        if (!rotateSession || event.repeat) {
          return;
        }

        applyRotationFromSession(
          rotateSession,
          latestPointerRef.current.clientX,
          latestPointerRef.current.clientY,
          event.ctrlKey,
          event.ctrlKey && event.shiftKey,
        );
        return;
      }

      if (event.key !== "Escape" || event.type !== "keydown") {
        return;
      }

      const rotateSession = rotateSessionRef.current;
      if (rotateSession) {
        try {
          gl.domElement.releasePointerCapture(rotateSession.pointerId);
        } catch {
          // ignore pointer-capture races during teardown
        }
      }
      rotateSessionRef.current = null;
      setControlsEnabled(true);
      cancelVertexRotateDrag();
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyEvent);
    window.addEventListener("keyup", handleKeyEvent);
    window.addEventListener("wheel", handleWheelTwist, { passive: false });

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyEvent);
      window.removeEventListener("keyup", handleKeyEvent);
      window.removeEventListener("wheel", handleWheelTwist);
    };
  }, [
    applyRotationFromSession,
    cancelVertexRotateDrag,
    clearVertexSelection,
    finishDrag,
    gl,
    handleWheelTwist,
    isPointerInsideGizmoBounds,
    modelingTool,
    selectedVertexIds.length,
    setModelingTool,
    setControlsEnabled,
  ]);

  useEffect(
    () => () => {
      rotateSessionRef.current = null;
      setControlsEnabled(true);
      cancelVertexRotateDrag();
    },
    [cancelVertexRotateDrag, setControlsEnabled],
  );

  useEffect(() => {
    if (modelingTool === "rotate" || !rotateSessionRef.current) {
      return;
    }

    finishDrag();
  }, [finishDrag, modelingTool]);

  const arcPoints = (() => {
    void dragVersion;
    const rotateSession = rotateSessionRef.current;
    if (!rotateSession || radiusWorld <= 0) {
      return null;
    }

    const currentArcballVecCamera = mapPointerToArcballVector(
      latestPointerRef.current.clientX,
      latestPointerRef.current.clientY,
      rotateSession.arcballCenterClientX,
      rotateSession.arcballCenterClientY,
      rotateSession.arcballRadiusPx,
    );
    const startArcballVecWorld = rotateSession.startArcballVecCamera
      .clone()
      .applyQuaternion(camera.quaternion)
      .normalize();
    const currentArcballVecWorld = currentArcballVecCamera
      .clone()
      .applyQuaternion(camera.quaternion)
      .normalize();
    const snapRingAxis = rotateSession.snapRingAxis;
    const snapAxisWorld = snapRingAxis
      ? getPrincipalAxisVector(snapRingAxis)
      : null;
    const displayStartVecWorld = startArcballVecWorld;
    const displayCurrentVecWorld = currentArcballVecWorld;
    const signedAngle = snapAxisWorld
      ? Math.atan2(
          snapAxisWorld.dot(
            displayStartVecWorld.clone().cross(displayCurrentVecWorld),
          ),
          MathUtils.clamp(
            displayStartVecWorld.dot(displayCurrentVecWorld),
            -1,
            1,
          ),
        )
      : 0;
    const angle = snapAxisWorld
      ? Math.abs(signedAngle)
      : Math.acos(
          MathUtils.clamp(
            displayStartVecWorld.dot(displayCurrentVecWorld),
            -1,
            1,
          ),
        );
    const sampleCount = Math.max(24, Math.ceil((angle / Math.PI) * 64));
    const points: Vector3[] = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const t = index / sampleCount;
      const sampleVector = snapAxisWorld
        ? displayStartVecWorld
            .clone()
            .applyAxisAngle(snapAxisWorld, signedAngle * t)
            .normalize()
            .multiplyScalar(radiusWorld)
        : displayStartVecWorld
            .clone()
            .lerp(displayCurrentVecWorld, t)
            .normalize()
            .multiplyScalar(radiusWorld);
      points.push(sampleVector);
    }

    return points;
  })();

  if (
    modelingTool !== "rotate" ||
    selectedVertexIds.length < 2 ||
    !pivot ||
    radiusWorld <= 0
  ) {
    return null;
  }

  return (
    <RotateGizmo
      active={rotateSessionRef.current !== null}
      arcPoints={arcPoints}
      center={pivot}
      onPointerDown={handleGizmoPointerDown}
      opacity={MathUtils.clamp(rotateUiOpacity, 0.05, 1)}
      radiusWorld={radiusWorld}
      ringColor={rotateGizmoRingColor}
      sphereColor={rotateGizmoSphereColor}
    />
  );
}
