import { Line } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  MathUtils,
  OrthographicCamera,
  type PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSceneStore } from "../../store/sceneStore";
import {
  type InteractionMode,
  type RotateTwistAxis,
  useUiStore,
} from "../../store/uiStore";
import type { SceneObject } from "../../types/scene";
import {
  createArcballQuaternion,
  mapPointerToArcballVector,
} from "./objectRotateArcball";

const MIN_ROTATE_UI_RADIUS_PX = 8;
const ARC_SAMPLE_MIN = 24;
const FULL_CIRCLE_SEGMENTS = 72;
const WORLD_UP = new Vector3(0, 1, 0);
const WORLD_RIGHT = new Vector3(1, 0, 0);
const WORLD_FORWARD = new Vector3(0, 0, 1);

type RotateSession = {
  arcballCenterClientX: number;
  arcballCenterClientY: number;
  arcballRadiusPx: number;
  objectId: string;
  pointerId: number;
  startArcballVecCamera: Vector3;
  startObjectQuat: Quaternion;
  twistAngleRad: number;
};

const tupleToEuler = (rotation: SceneObject["rotation"]) =>
  new Euler(rotation[0], rotation[1], rotation[2], "XYZ");

const quaternionToRotationTuple = (quaternion: Quaternion) => {
  const euler = new Euler().setFromQuaternion(quaternion, "XYZ");
  return [euler.x, euler.y, euler.z] as SceneObject["rotation"];
};

const getTwistAxisVector = (axis: RotateTwistAxis) => {
  if (axis === "+x") {
    return WORLD_RIGHT;
  }
  if (axis === "+z") {
    return WORLD_FORWARD;
  }
  return WORLD_UP;
};

const getViewportWorldHeightAtDistance = (
  camera: PerspectiveCamera | OrthographicCamera,
  distance: number,
) => {
  if (camera instanceof OrthographicCamera) {
    return (camera.top - camera.bottom) / camera.zoom;
  }

  return 2 * distance * Math.tan(MathUtils.degToRad(camera.fov) / 2);
};

function RotateArc({
  opacity,
  points,
}: {
  opacity: number;
  points: Vector3[] | null;
}) {
  if (!points) {
    return null;
  }

  return (
    <Line
      color="#ffffff"
      lineWidth={2}
      opacity={Math.min(0.82 + opacity * 0.12, 1)}
      points={points}
      transparent
    />
  );
}

function RotateGizmo({
  active,
  arcPoints,
  center,
  ringColor,
  sphereColor,
  onPointerDown,
  opacity,
  radiusWorld,
}: {
  active: boolean;
  arcPoints: Vector3[] | null;
  center: Vector3;
  ringColor: string;
  sphereColor: string;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  opacity: number;
  radiusWorld: number;
}) {
  const ringGeometry = useMemo(() => {
    const points = [];

    for (let index = 0; index <= FULL_CIRCLE_SEGMENTS; index += 1) {
      const angle = (index / FULL_CIRCLE_SEGMENTS) * Math.PI * 2;
      points.push(
        Math.cos(angle) * radiusWorld,
        Math.sin(angle) * radiusWorld,
        0,
      );
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));

    return geometry;
  }, [radiusWorld]);

  const ringBaseColor = new Color(ringColor);
  const sphereBaseColor = new Color(sphereColor);
  const activeBoost = active ? 1.16 : 1;
  const primaryColor = `#${ringBaseColor
    .clone()
    .multiplyScalar(Math.max(opacity * activeBoost, 1))
    .getHexString()}`;
  const secondaryColor = `#${ringBaseColor
    .clone()
    .multiplyScalar(Math.max(opacity * 0.82 * activeBoost, 1))
    .getHexString()}`;
  const shellColor = `#${sphereBaseColor
    .clone()
    .multiplyScalar(Math.max(opacity * 0.92 * activeBoost, 1))
    .getHexString()}`;

  useEffect(
    () => () => {
      ringGeometry.dispose();
    },
    [ringGeometry],
  );

  return (
    <group position={center}>
      <lineLoop geometry={ringGeometry}>
        <lineBasicMaterial
          color={primaryColor}
          transparent
          opacity={Math.min(
            (active ? 0.94 : 0.72) * Math.max(opacity, 0.35),
            1,
          )}
        />
      </lineLoop>
      <lineLoop geometry={ringGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <lineBasicMaterial
          color={secondaryColor}
          transparent
          opacity={Math.min(
            (active ? 0.78 : 0.56) * Math.max(opacity, 0.35),
            1,
          )}
        />
      </lineLoop>
      <lineLoop geometry={ringGeometry} rotation={[0, Math.PI / 2, 0]}>
        <lineBasicMaterial
          color={secondaryColor}
          transparent
          opacity={Math.min(
            (active ? 0.78 : 0.56) * Math.max(opacity, 0.35),
            1,
          )}
        />
      </lineLoop>
      <mesh onPointerDown={onPointerDown}>
        <sphereGeometry args={[radiusWorld, 48, 48]} />
        <meshBasicMaterial
          color={shellColor}
          depthWrite={false}
          opacity={Math.min(
            (active ? 0.22 : 0.14) * Math.max(opacity, 0.35),
            0.4,
          )}
          toneMapped={false}
          transparent
        />
      </mesh>
      <RotateArc opacity={opacity} points={arcPoints} />
    </group>
  );
}

export function ObjectRotateController({
  controlsRef,
  interactionMode,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  interactionMode: InteractionMode;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const selectedObjectId = useUiStore((state) => state.selectedObjectId);
  const interactionState = useUiStore((state) => state.interactionState);
  const rotateUiOpacity = useUiStore((state) => state.rotateUiOpacity);
  const rotateUiRadiusPx = useUiStore((state) => state.rotateUiRadiusPx);
  const rotateArcballSensitivity = useUiStore(
    (state) => state.rotateArcballSensitivity,
  );
  const rotateGizmoRingColor = useUiStore(
    (state) => state.rotateGizmoRingColor,
  );
  const rotateGizmoSphereColor = useUiStore(
    (state) => state.rotateGizmoSphereColor,
  );
  const objectsById = useSceneStore((state) => state.objectsById);
  const setInteractionState = useUiStore((state) => state.setInteractionState);
  const updateObjectRotation = useSceneStore(
    (state) => state.updateObjectRotation,
  );
  const rotateSessionRef = useRef<RotateSession | null>(null);
  const latestPointerRef = useRef({ clientX: 0, clientY: 0 });

  const selectedObject = selectedObjectId
    ? (objectsById[selectedObjectId] ?? null)
    : null;

  const pivot = useMemo(
    () =>
      selectedObject
        ? new Vector3(
            selectedObject.position[0],
            selectedObject.position[1],
            selectedObject.position[2],
          )
        : null,
    [selectedObject],
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
      const vector = mapPointerToArcballVector(
        clientX,
        clientY,
        centerClientX,
        centerClientY,
        radiusPx,
      );

      return {
        centerClientX,
        centerClientY,
        radiusPx,
        vector,
      };
    },
    [camera, gl, pivot, radiusWorld, rotateUiRadiusPx],
  );

  const applyRotationFromSession = useCallback(
    (rotateSession: RotateSession, clientX: number, clientY: number) => {
      const currentArcballVecCamera = mapPointerToArcballVector(
        clientX,
        clientY,
        rotateSession.arcballCenterClientX,
        rotateSession.arcballCenterClientY,
        rotateSession.arcballRadiusPx,
      );
      const { rotateTwistAxis } = useUiStore.getState();
      const swingQuaternion = createArcballQuaternion(
        rotateSession.startArcballVecCamera,
        currentArcballVecCamera,
        camera.quaternion,
        rotateArcballSensitivity,
      );
      const orientationAfterSwing = swingQuaternion
        .clone()
        .multiply(rotateSession.startObjectQuat);
      const twistAxisWorld = getTwistAxisVector(rotateTwistAxis)
        .clone()
        .applyQuaternion(orientationAfterSwing)
        .normalize();
      const twistQuaternion = new Quaternion().setFromAxisAngle(
        twistAxisWorld,
        rotateSession.twistAngleRad,
      );
      const targetQuaternion = twistQuaternion
        .multiply(swingQuaternion)
        .multiply(rotateSession.startObjectQuat.clone())
        .normalize();

      updateObjectRotation(
        rotateSession.objectId,
        quaternionToRotationTuple(targetQuaternion),
      );
    },
    [camera.quaternion, rotateArcballSensitivity, updateObjectRotation],
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
    setInteractionState(selectedObjectId ? "active" : "idle");
  }, [gl, selectedObjectId, setControlsEnabled, setInteractionState]);

  const handleGizmoPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (
        interactionMode !== "rotate" ||
        event.button !== 0 ||
        !selectedObject ||
        !pivot
      ) {
        return;
      }

      event.stopPropagation();

      const arcballPointerState = computeArcballPointerState(
        event.nativeEvent.clientX,
        event.nativeEvent.clientY,
      );
      if (!arcballPointerState) {
        return;
      }

      const startObjectQuat = new Quaternion().setFromEuler(
        tupleToEuler(selectedObject.rotation),
      );
      rotateSessionRef.current = {
        arcballCenterClientX: arcballPointerState.centerClientX,
        arcballCenterClientY: arcballPointerState.centerClientY,
        arcballRadiusPx: arcballPointerState.radiusPx,
        objectId: selectedObject.id,
        pointerId: event.pointerId,
        startArcballVecCamera: arcballPointerState.vector,
        startObjectQuat,
        twistAngleRad: 0,
      };
      latestPointerRef.current = {
        clientX: event.nativeEvent.clientX,
        clientY: event.nativeEvent.clientY,
      };
      gl.domElement.setPointerCapture(event.pointerId);
      setControlsEnabled(false);
      setInteractionState("dragging");
    },
    [
      computeArcballPointerState,
      gl,
      interactionMode,
      pivot,
      selectedObject,
      setControlsEnabled,
      setInteractionState,
    ],
  );

  const handleWheelTwist = useCallback(
    (event: WheelEvent) => {
      const currentObjectId = selectedObjectId;
      if (interactionMode !== "rotate" || !currentObjectId) {
        return;
      }

      const currentObject =
        useSceneStore.getState().objectsById[currentObjectId];
      if (!currentObject) {
        return;
      }

      const rotateSession = rotateSessionRef.current;
      if (!rotateSession) {
        if (!computeArcballPointerState(event.clientX, event.clientY)) {
          return;
        }
      }

      event.preventDefault();

      const {
        rotateTwistAxis,
        rotateWheelDirection,
        rotateWheelRotateStepDeg,
      } = useUiStore.getState();
      const directionMultiplier = rotateWheelDirection === "reverse" ? -1 : 1;
      const wheelSteps = Math.sign(-event.deltaY);
      if (wheelSteps === 0) {
        return;
      }

      const angleDelta =
        MathUtils.degToRad(rotateWheelRotateStepDeg) *
        wheelSteps *
        directionMultiplier;

      if (rotateSession) {
        rotateSession.twistAngleRad += angleDelta;
        applyRotationFromSession(
          rotateSession,
          latestPointerRef.current.clientX,
          latestPointerRef.current.clientY,
        );
        return;
      }

      const currentQuaternion = new Quaternion().setFromEuler(
        tupleToEuler(currentObject.rotation),
      );
      const twistAxisWorld = getTwistAxisVector(rotateTwistAxis)
        .clone()
        .applyQuaternion(currentQuaternion)
        .normalize();
      const nextQuaternion = new Quaternion()
        .setFromAxisAngle(twistAxisWorld, angleDelta)
        .multiply(currentQuaternion)
        .normalize();

      updateObjectRotation(
        currentObjectId,
        quaternionToRotationTuple(nextQuaternion),
      );
    },
    [
      applyRotationFromSession,
      computeArcballPointerState,
      interactionMode,
      selectedObjectId,
      updateObjectRotation,
    ],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      latestPointerRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };

      const rotateSession = rotateSessionRef.current;
      if (!rotateSession || event.pointerId !== rotateSession.pointerId) {
        return;
      }

      applyRotationFromSession(rotateSession, event.clientX, event.clientY);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
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
      useUiStore.getState().clearSelection();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheelTwist, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheelTwist);
    };
  }, [
    applyRotationFromSession,
    finishDrag,
    gl,
    handleWheelTwist,
    setControlsEnabled,
  ]);

  useEffect(
    () => () => {
      rotateSessionRef.current = null;
      setControlsEnabled(true);
    },
    [setControlsEnabled],
  );

  useEffect(() => {
    if (interactionMode === "rotate" || !rotateSessionRef.current) {
      return;
    }

    finishDrag();
  }, [finishDrag, interactionMode]);

  const arcPoints = useMemo(() => {
    const rotateSession = rotateSessionRef.current;
    if (
      !rotateSession ||
      !pivot ||
      radiusWorld <= 0 ||
      interactionState !== "dragging"
    ) {
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
    const angle = Math.acos(
      MathUtils.clamp(startArcballVecWorld.dot(currentArcballVecWorld), -1, 1),
    );
    const sampleCount = Math.max(
      ARC_SAMPLE_MIN,
      Math.ceil((angle / Math.PI) * 64),
    );
    const points: Vector3[] = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const t = index / sampleCount;
      const sampleVector = startArcballVecWorld
        .clone()
        .lerp(currentArcballVecWorld, t)
        .normalize()
        .multiplyScalar(radiusWorld);
      points.push(sampleVector);
    }

    return points;
  }, [camera, interactionState, pivot, radiusWorld]);

  if (interactionMode !== "rotate") {
    return null;
  }

  return selectedObject && pivot && radiusWorld > 0 ? (
    <RotateGizmo
      active={interactionState === "dragging"}
      arcPoints={arcPoints}
      center={pivot}
      onPointerDown={handleGizmoPointerDown}
      opacity={MathUtils.clamp(rotateUiOpacity, 0.05, 1)}
      radiusWorld={radiusWorld}
      ringColor={rotateGizmoRingColor}
      sphereColor={rotateGizmoSphereColor}
    />
  ) : null;
}
