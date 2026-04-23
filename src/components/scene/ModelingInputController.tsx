import { useThree } from "@react-three/fiber";
import { type RefObject, useEffect } from "react";
import { Raycaster, Vector2, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { isEditableTarget } from "../../lib/isEditableTarget";
import { compareVector3Tuple } from "../../lib/vector3Tuple";
import { useModelingStore } from "../../store/modelingStore";
import { getEffectiveModelingTool, useUiStore } from "../../store/uiStore";
import {
  getEffectiveModelingPointerGridStep,
  getLineDirectionSnapPosition,
  getModelingPointerSnapResult,
} from "./modelingPointerUtils";
import {
  appendLassoPoint,
  isPointInsideLasso,
  projectVertexToScreenPoint,
} from "./modelingSelectionUtils";

const CAMERA_DOLLY_MIN_DISTANCE = 2.4;
const CAMERA_DOLLY_STEP = 0.55;
const CURSOR_DEPTH_STEP = 0.45;

export function ModelingInputController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const { camera, gl } = useThree();
  const addVertex = useModelingStore((state) => state.addVertex);
  const clearVertexSelection = useModelingStore(
    (state) => state.clearVertexSelection,
  );
  const createEdgeFromPositions = useModelingStore(
    (state) => state.createEdgeFromPositions,
  );
  const selectVertices = useModelingStore((state) => state.selectVertices);
  const modelingPointerAxisSnapEnabled = useUiStore(
    (state) => state.modelingPointerAxisSnapEnabled,
  );
  const modelingPointerAxisSnapDistance = useUiStore(
    (state) => state.modelingPointerAxisSnapDistance,
  );
  const modelingPointerDepthPrecisionScale = useUiStore(
    (state) => state.modelingPointerDepthPrecisionScale,
  );
  const modelingPointerEdgeSnapDistance = useUiStore(
    (state) => state.modelingPointerEdgeSnapDistance,
  );
  const modelingPointerEdgeSnapEnabled = useUiStore(
    (state) => state.modelingPointerEdgeSnapEnabled,
  );
  const modelingPointerGridSnapEnabled = useUiStore(
    (state) => state.modelingPointerGridSnapEnabled,
  );
  const modelingPointerGridSnapStep = useUiStore(
    (state) => state.modelingPointerGridSnapStep,
  );
  const modelingPointerVertexSnapDistance = useUiStore(
    (state) => state.modelingPointerVertexSnapDistance,
  );
  const modelingPointerVertexSnapEnabled = useUiStore(
    (state) => state.modelingPointerVertexSnapEnabled,
  );
  const modelingLineAngleSnapStepDeg = useUiStore(
    (state) => state.modelingLineAngleSnapStepDeg,
  );
  const setModelingPointerDepth = useUiStore(
    (state) => state.setModelingPointerDepth,
  );
  const setModelingPointerHovered = useUiStore(
    (state) => state.setModelingPointerHovered,
  );
  const setModelingCameraDragging = useUiStore(
    (state) => state.setModelingCameraDragging,
  );
  const setModelingPointerPlane = useUiStore(
    (state) => state.setModelingPointerPlane,
  );
  const setModelingPointerPosition = useUiStore(
    (state) => state.setModelingPointerPosition,
  );
  const setModelingPointerSnappedAxes = useUiStore(
    (state) => state.setModelingPointerSnappedAxes,
  );
  const setModelingPointerSnappedAxisTargets = useUiStore(
    (state) => state.setModelingPointerSnappedAxisTargets,
  );
  const setModelingPointerSnappedEdgeTarget = useUiStore(
    (state) => state.setModelingPointerSnappedEdgeTarget,
  );
  const setModelingPointerSnappedVertexTarget = useUiStore(
    (state) => state.setModelingPointerSnappedVertexTarget,
  );
  const setModelingLinePreview = useUiStore(
    (state) => state.setModelingLinePreview,
  );
  const clearModelingLinePreview = useUiStore(
    (state) => state.clearModelingLinePreview,
  );
  const setModelingLassoSelection = useUiStore(
    (state) => state.setModelingLassoSelection,
  );
  const clearModelingLassoSelection = useUiStore(
    (state) => state.clearModelingLassoSelection,
  );

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2(0, 0);
    const activeModel = modelsById[currentModelId];
    const activeVertices = activeModel
      ? activeModel.vertexOrder.map(
          (vertexId) => activeModel.verticesById[vertexId],
        )
      : [];
    const activeVertexPositions = activeVertices.map(
      (vertex) => vertex.position,
    );
    const activeEdgeTargets = activeModel
      ? activeModel.edgeOrder.map((edgeId) => {
          const edge = activeModel.edgesById[edgeId];

          return {
            edgeId,
            end: activeModel.verticesById[edge.vertexIds[1]].position,
            start: activeModel.verticesById[edge.vertexIds[0]].position,
            vertexIds: [...edge.vertexIds] as [string, string],
          };
        })
      : [];
    let hasPointer = false;
    let cameraDragButton: number | null = null;
    let clickCandidate: {
      button: number;
      moved: boolean;
      x: number;
      y: number;
    } | null = null;
    let lineDragStartPosition: [number, number, number] | null = null;
    let lineDragStartEdgeTarget: {
      edgeId: string;
      position: [number, number, number];
      vertexIds: [string, string];
    } | null = null;
    let lineDragStartVertexId: string | null = null;
    let lineDragStartSnapped = false;
    let lassoPoints: Array<[number, number]> = [];

    const findVertexIdByPosition = (
      position: [number, number, number] | null,
    ) => {
      if (!position) {
        return null;
      }

      return (
        activeVertices.find((vertex) =>
          compareVector3Tuple(vertex.position, position),
        )?.id ?? null
      );
    };

    const getLineDragAxisSnapPositions = () => {
      if (!lineDragStartPosition) {
        return activeVertexPositions;
      }

      const lineDragStartSnapPosition = lineDragStartPosition;

      const startAlreadyPresent = activeVertexPositions.some((position) =>
        compareVector3Tuple(position, lineDragStartSnapPosition),
      );

      return startAlreadyPresent
        ? activeVertexPositions
        : [...activeVertexPositions, lineDragStartSnapPosition];
    };

    const updatePointerPosition = ({
      depth = useUiStore.getState().modelingPointer.depth,
      directionSnapMode = false,
      precisionMode = false,
    }: {
      depth?: number;
      directionSnapMode?: boolean;
      precisionMode?: boolean;
    } = {}) => {
      if (!hasPointer) {
        return;
      }

      const effectiveGridStep = getEffectiveModelingPointerGridStep(
        modelingPointerGridSnapStep,
        modelingPointerDepthPrecisionScale,
        precisionMode,
      );

      raycaster.setFromCamera(ndc, camera);
      const nextPosition = raycaster.ray.origin
        .clone()
        .add(raycaster.ray.direction.clone().multiplyScalar(depth));
      const pointerPosition =
        directionSnapMode && lineDragStartPosition
          ? getLineDirectionSnapPosition(
              lineDragStartPosition,
              [nextPosition.x, nextPosition.y, nextPosition.z],
              modelingLineAngleSnapStepDeg,
            )
          : ([nextPosition.x, nextPosition.y, nextPosition.z] as [
              number,
              number,
              number,
            ]);
      const snapResult = getModelingPointerSnapResult(
        pointerPosition,
        activeVertexPositions,
        {
          axisSnapPositions:
            lineDragStartPosition &&
            useUiStore.getState().modelingTool === "line" &&
            clickCandidate?.button === 0
              ? getLineDragAxisSnapPositions()
              : undefined,
          axisDistance: modelingPointerAxisSnapDistance,
          axisEnabled: modelingPointerAxisSnapEnabled,
          edgeDistance: modelingPointerEdgeSnapDistance,
          edgeEnabled: modelingPointerEdgeSnapEnabled,
          edgeSnapTargets: activeEdgeTargets,
          gridEnabled: modelingPointerGridSnapEnabled,
          gridStep: effectiveGridStep,
          vertexDistance: modelingPointerVertexSnapDistance,
          vertexEnabled: modelingPointerVertexSnapEnabled,
        },
      );

      setModelingPointerPosition(snapResult.position);
      setModelingPointerSnappedAxes(snapResult.snappedAxes);
      setModelingPointerSnappedAxisTargets(snapResult.snappedAxisTargets);
      setModelingPointerSnappedEdgeTarget(snapResult.snappedEdgeTarget);
      setModelingPointerSnappedVertexTarget(snapResult.snappedVertexTarget);
    };

    const updatePointerFromEvent = (event: PointerEvent | WheelEvent) => {
      const rect = element.getBoundingClientRect();

      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      hasPointer = true;
      setModelingPointerHovered(true);
      updatePointerPosition({
        directionSnapMode: event.ctrlKey,
        precisionMode: event.shiftKey,
      });
    };

    const getCanvasPoint = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top] as [
        number,
        number,
      ];
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        clickCandidate &&
        Math.hypot(
          event.clientX - clickCandidate.x,
          event.clientY - clickCandidate.y,
        ) > 5
      ) {
        clickCandidate = {
          ...clickCandidate,
          moved: true,
        };
      }

      updatePointerFromEvent(event);

      const { modelingPointer, modelingTool } = useUiStore.getState();
      if (clickCandidate?.moved && modelingTool === "lasso") {
        lassoPoints = appendLassoPoint(lassoPoints, getCanvasPoint(event));
        setModelingLassoSelection({
          phase: "dragging",
          points: lassoPoints,
        });
      } else if (
        clickCandidate?.moved &&
        modelingTool === "line" &&
        lineDragStartPosition
      ) {
        const planeNormal = new Vector3();
        camera.getWorldDirection(planeNormal);

        setModelingLinePreview({
          currentPosition: [...modelingPointer.position],
          currentSnapped:
            modelingPointer.snappedVertexTarget !== null ||
            modelingPointer.snappedEdgeTarget !== null,
          planeNormal: [planeNormal.x, planeNormal.y, planeNormal.z],
          startSnapped: lineDragStartSnapped,
          startPosition: lineDragStartPosition,
        });
      }
    };

    const handlePointerLeave = () => {
      hasPointer = false;
      clickCandidate = null;
      lineDragStartPosition = null;
      lineDragStartEdgeTarget = null;
      lineDragStartVertexId = null;
      lineDragStartSnapped = false;
      lassoPoints = [];
      clearModelingLassoSelection();
      clearModelingLinePreview();
      setModelingPointerHovered(false);
      setModelingPointerSnappedAxes([false, false, false]);
      setModelingPointerSnappedAxisTargets([null, null, null]);
      setModelingPointerSnappedEdgeTarget(null);
      setModelingPointerSnappedVertexTarget(null);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const effectiveTool = getEffectiveModelingTool(useUiStore.getState());

      if (event.button === 0 && effectiveTool !== "camera") {
        clickCandidate = {
          button: event.button,
          moved: false,
          x: event.clientX,
          y: event.clientY,
        };

        const { modelingPointer, modelingTool } = useUiStore.getState();
        if (modelingTool === "lasso") {
          lassoPoints = [getCanvasPoint(event)];
          setModelingLassoSelection({
            phase: "dragging",
            points: lassoPoints,
          });
        } else if (modelingTool === "line") {
          lineDragStartPosition = [...modelingPointer.position];
          lineDragStartEdgeTarget = modelingPointer.snappedEdgeTarget;
          lineDragStartVertexId = findVertexIdByPosition(
            modelingPointer.snappedVertexTarget,
          );
          lineDragStartSnapped =
            lineDragStartVertexId !== null ||
            modelingPointer.snappedEdgeTarget !== null;
        }
      }

      if (
        effectiveTool === "camera" &&
        (event.button === 0 || event.button === 2)
      ) {
        cameraDragButton = event.button;
        setModelingCameraDragging(true);
      }

      updatePointerFromEvent(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (cameraDragButton === event.button) {
        cameraDragButton = null;
        setModelingCameraDragging(false);
      }

      if (
        clickCandidate &&
        clickCandidate.button === event.button &&
        event.button === 0
      ) {
        const { modelingPointer, modelingTool } = useUiStore.getState();

        if (modelingTool === "lasso") {
          if (clickCandidate.moved) {
            const finalizedLassoPoints = appendLassoPoint(
              lassoPoints,
              getCanvasPoint(event),
            );
            const rect = element.getBoundingClientRect();
            const selectedVertexIds = activeVertices.flatMap((vertex) => {
              const projectedVertex = projectVertexToScreenPoint(
                vertex.position,
                camera,
                {
                  height: rect.height,
                  width: rect.width,
                },
              );

              return projectedVertex &&
                isPointInsideLasso(projectedVertex.point, finalizedLassoPoints)
                ? [vertex.id]
                : [];
            });

            setModelingLassoSelection({
              phase: "settled",
              points: finalizedLassoPoints,
            });
            selectVertices(selectedVertexIds, event.shiftKey);
          }
        } else if (modelingTool === "line") {
          if (clickCandidate.moved && lineDragStartPosition) {
            const lineDragEndVertexId = findVertexIdByPosition(
              modelingPointer.snappedVertexTarget,
            );
            createEdgeFromPositions(
              lineDragStartPosition,
              [...modelingPointer.position],
              {
                endEdgeTarget: modelingPointer.snappedEdgeTarget,
                endVertexId: lineDragEndVertexId,
                snapDistance: 0,
                startEdgeTarget:
                  lineDragStartVertexId === null
                    ? lineDragStartEdgeTarget
                    : null,
                startVertexId: lineDragStartVertexId,
              },
            );
          }
        } else if (!clickCandidate.moved && modelingTool === "vertex") {
          addVertex([...modelingPointer.position], {
            edgeTarget: modelingPointer.snappedEdgeTarget,
          });
        }
      }

      clickCandidate = null;
      lineDragStartPosition = null;
      lineDragStartEdgeTarget = null;
      lineDragStartVertexId = null;
      lineDragStartSnapped = false;
      lassoPoints = [];
      clearModelingLinePreview();
    };

    const handleWheel = (event: WheelEvent) => {
      updatePointerFromEvent(event);
      event.preventDefault();

      if (getEffectiveModelingTool(useUiStore.getState()) === "camera") {
        const forward = new Vector3();
        camera.getWorldDirection(forward);
        const nextStep =
          event.deltaY < 0 ? CAMERA_DOLLY_STEP : -CAMERA_DOLLY_STEP;
        const controls = controlsRef.current;
        const target = controls?.target.clone() ?? new Vector3();
        const cameraOffset = forward.clone().multiplyScalar(nextStep);
        const nextCameraPosition = camera.position.clone().add(cameraOffset);

        if (
          nextCameraPosition.distanceTo(target) <= CAMERA_DOLLY_MIN_DISTANCE
        ) {
          return;
        }

        camera.position.copy(nextCameraPosition);
        controls?.target.add(cameraOffset);
        controls?.update();
        updatePointerPosition();
        return;
      }

      if (useUiStore.getState().modelingTool === "lasso") {
        return;
      }

      const direction = event.deltaY < 0 ? 1 : -1;
      const depthStep =
        CURSOR_DEPTH_STEP *
        (event.shiftKey ? modelingPointerDepthPrecisionScale : 1);
      const nextDepth =
        useUiStore.getState().modelingPointer.depth + direction * depthStep;
      setModelingPointerDepth(nextDepth);
      updatePointerPosition({
        depth: nextDepth,
        directionSnapMode: event.ctrlKey,
        precisionMode: event.shiftKey,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "1") {
        setModelingPointerPlane("none");
      } else if (event.key === "2") {
        setModelingPointerPlane("horizontal");
      } else if (event.key === "3") {
        setModelingPointerPlane("vertical");
      } else if (event.key === "Escape") {
        clearModelingLassoSelection();
        clearVertexSelection();
      } else if (event.key === "Shift") {
        updatePointerPosition({ precisionMode: true });
      } else if (event.key === "Control") {
        updatePointerPosition({ directionSnapMode: true });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "Shift") {
        updatePointerPosition({ precisionMode: false });
      } else if (event.key === "Control") {
        updatePointerPosition({ directionSnapMode: false });
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    element.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("wheel", handleWheel, { passive: false });
    element.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      element.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("wheel", handleWheel);
      element.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      setModelingCameraDragging(false);
      clearModelingLinePreview();
      clearModelingLassoSelection();
      setModelingPointerHovered(false);
      setModelingPointerSnappedAxes([false, false, false]);
      setModelingPointerSnappedAxisTargets([null, null, null]);
      setModelingPointerSnappedEdgeTarget(null);
      setModelingPointerSnappedVertexTarget(null);
      clearVertexSelection();
    };
  }, [
    addVertex,
    camera,
    clearVertexSelection,
    clearModelingLinePreview,
    controlsRef,
    createEdgeFromPositions,
    currentModelId,
    gl,
    modelingPointerAxisSnapEnabled,
    modelingPointerAxisSnapDistance,
    modelingPointerDepthPrecisionScale,
    modelingPointerEdgeSnapDistance,
    modelingPointerEdgeSnapEnabled,
    modelingPointerGridSnapEnabled,
    modelingPointerGridSnapStep,
    modelingPointerVertexSnapDistance,
    modelingPointerVertexSnapEnabled,
    modelingLineAngleSnapStepDeg,
    modelsById,
    selectVertices,
    setModelingCameraDragging,
    setModelingLassoSelection,
    setModelingLinePreview,
    setModelingPointerDepth,
    setModelingPointerHovered,
    setModelingPointerPlane,
    setModelingPointerPosition,
    setModelingPointerSnappedAxes,
    setModelingPointerSnappedAxisTargets,
    setModelingPointerSnappedEdgeTarget,
    setModelingPointerSnappedVertexTarget,
    clearModelingLassoSelection,
  ]);

  return null;
}
