import { useThree } from "@react-three/fiber";
import { type RefObject, useEffect } from "react";
import { Raycaster, Vector2, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { isEditableTarget } from "../../lib/isEditableTarget";
import { triangulateFaceItems } from "../../lib/modelingFaceGeometry";
import { compareVector3Tuple } from "../../lib/vector3Tuple";
import { type ModelingFace, useModelingStore } from "../../store/modelingStore";
import {
  DEFAULT_PEN_STROKE_PARAMS,
  getEffectiveModelingTool,
  useUiStore,
} from "../../store/uiStore";
import {
  getBoxVerticesFromDiagonal,
  getEffectiveModelingPointerGridStep,
  getEffectiveModelingPointerSnapValue,
  getLineDirectionSnapPosition,
  getModelingPointerSnapResult,
  getRectangleDragPosition,
  getRectangleVerticesFromDiagonal,
} from "./modelingPointerUtils";
import {
  appendLassoPoint,
  isPointInsideLasso,
  projectVertexToScreenPoint,
} from "./modelingSelectionUtils";

const CAMERA_DOLLY_MIN_DISTANCE = 2.4;
const CAMERA_DOLLY_STEP = 0.55;
const CURSOR_DEPTH_STEP = 0.45;
const SCREEN_EDGE_HIT_RADIUS_PX = 8;
const SCREEN_VERTEX_HIT_RADIUS_PX = 10;

function getFaceCenter(face: {
  positions: Array<[number, number, number]>;
}): [number, number, number] {
  const sum = face.positions.reduce(
    (total, position) =>
      [
        total[0] + position[0],
        total[1] + position[1],
        total[2] + position[2],
      ] as [number, number, number],
    [0, 0, 0] as [number, number, number],
  );

  return [
    sum[0] / face.positions.length,
    sum[1] / face.positions.length,
    sum[2] / face.positions.length,
  ];
}

export function ModelingInputController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, gl } = useThree();
  const addVertex = useModelingStore((state) => state.addVertex);
  const beginVertexMoveDrag = useModelingStore(
    (state) => state.beginVertexMoveDrag,
  );
  const cancelVertexMoveDrag = useModelingStore(
    (state) => state.cancelVertexMoveDrag,
  );
  const clearVertexSelection = useModelingStore(
    (state) => state.clearVertexSelection,
  );
  const commitVertexMoveDrag = useModelingStore(
    (state) => state.commitVertexMoveDrag,
  );
  const createEdgeFromPositions = useModelingStore(
    (state) => state.createEdgeFromPositions,
  );
  const createRectangleFromDiagonal = useModelingStore(
    (state) => state.createRectangleFromDiagonal,
  );
  const createBoxFromDiagonal = useModelingStore(
    (state) => state.createBoxFromDiagonal,
  );
  const createPenStrokeFromPositions = useModelingStore(
    (state) => state.createPenStrokeFromPositions,
  );
  const selectModelingElements = useModelingStore(
    (state) => state.selectModelingElements,
  );
  const updateVertexMoveDrag = useModelingStore(
    (state) => state.updateVertexMoveDrag,
  );
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
  const modelingPointerScreenEdgeSnapEnabled = useUiStore(
    (state) => state.modelingPointerScreenEdgeSnapEnabled,
  );
  const modelingPointerScreenFaceSnapEnabled = useUiStore(
    (state) => state.modelingPointerScreenFaceSnapEnabled,
  );
  const modelingPointerScreenVertexSnapEnabled = useUiStore(
    (state) => state.modelingPointerScreenVertexSnapEnabled,
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
  const modelingLassoSelectEdgesEnabled = useUiStore(
    (state) => state.modelingLassoSelectEdgesEnabled,
  );
  const modelingLassoSelectFacesEnabled = useUiStore(
    (state) => state.modelingLassoSelectFacesEnabled,
  );
  const modelingLassoSelectVerticesEnabled = useUiStore(
    (state) => state.modelingLassoSelectVerticesEnabled,
  );
  const modelingRectangleMode = useUiStore(
    (state) => state.modelingRectangleMode,
  );
  const modelingRectangleFaceMode = useUiStore(
    (state) => state.modelingRectangleFaceMode,
  );
  const modelingBoxFaceMode = useUiStore((state) => state.modelingBoxFaceMode);
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
  const setModelingPointerSnappedFaceTarget = useUiStore(
    (state) => state.setModelingPointerSnappedFaceTarget,
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
  const setModelingPenPreview = useUiStore(
    (state) => state.setModelingPenPreview,
  );
  const clearModelingPenPreview = useUiStore(
    (state) => state.clearModelingPenPreview,
  );
  const setActivePenStroke = useUiStore((state) => state.setActivePenStroke);
  const clearActivePenStroke = useUiStore(
    (state) => state.clearActivePenStroke,
  );

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const ndc = new Vector2(0, 0);
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
    let penStrokePoints: Array<[number, number, number]> = [];
    let penStrokeScreenPoints: Array<[number, number]> = [];
    let moveDragActive = false;

    const getActiveModel = () => {
      const modelingState = useModelingStore.getState();
      return modelingState.modelsById[modelingState.currentModelId];
    };

    const getActiveVertices = (excludedVertexIds = new Set<string>()) => {
      const activeModel = getActiveModel();
      return activeModel
        ? activeModel.vertexOrder
            .filter((vertexId) => !excludedVertexIds.has(vertexId))
            .map((vertexId) => activeModel.verticesById[vertexId])
        : [];
    };

    const getActiveVertexPositions = (excludedVertexIds = new Set<string>()) =>
      getActiveVertices(excludedVertexIds).map((vertex) => vertex.position);

    const getActiveEdgeTargets = (excludedVertexIds = new Set<string>()) => {
      const activeModel = getActiveModel();
      return activeModel
        ? activeModel.edgeOrder.flatMap((edgeId) => {
            const edge = activeModel.edgesById[edgeId];

            if (
              edge.vertexIds.some((vertexId) => excludedVertexIds.has(vertexId))
            ) {
              return [];
            }

            return [
              {
                edgeId,
                end: activeModel.verticesById[edge.vertexIds[1]].position,
                start: activeModel.verticesById[edge.vertexIds[0]].position,
                vertexIds: [...edge.vertexIds] as [string, string],
              },
            ];
          })
        : [];
    };

    const getActiveFaceTargets = (excludedVertexIds = new Set<string>()) => {
      const activeModel = getActiveModel();
      return activeModel
        ? activeModel.faceOrder.flatMap((faceId) => {
            const face = activeModel.facesById[faceId];

            if (
              face.vertexIds.some((vertexId) => excludedVertexIds.has(vertexId))
            ) {
              return [];
            }

            const vertices = face.vertexIds.map(
              (vertexId) => activeModel.verticesById[vertexId],
            );

            if (vertices.some((vertex) => vertex === undefined)) {
              return [];
            }

            return [
              {
                faceId,
                positions: vertices.map((vertex) => [...vertex.position]) as [
                  [number, number, number],
                  [number, number, number],
                  [number, number, number],
                  ...[number, number, number][],
                ],
                vertexIds: [...face.vertexIds] as ModelingFace["vertexIds"],
              },
            ];
          })
        : [];
    };

    const getEdgeCenter = (edge: {
      end: [number, number, number];
      start: [number, number, number];
    }): [number, number, number] => [
      (edge.start[0] + edge.end[0]) / 2,
      (edge.start[1] + edge.end[1]) / 2,
      (edge.start[2] + edge.end[2]) / 2,
    ];

    const getMoveDragVertexIds = () => {
      const activeMoveDrag = useModelingStore.getState().activeVertexMoveDrag;
      return activeMoveDrag
        ? new Set(activeMoveDrag.vertexIds)
        : new Set<string>();
    };

    const hasActiveMoveDrag = () =>
      useModelingStore.getState().activeVertexMoveDrag !== null;

    const getRectangleDragPreview = (
      currentPosition: [number, number, number],
    ) => {
      if (!lineDragStartPosition) {
        return null;
      }

      return getRectangleVerticesFromDiagonal(
        lineDragStartPosition,
        currentPosition,
        modelingRectangleMode,
      );
    };

    const findVertexIdByPosition = (
      position: [number, number, number] | null,
    ) => {
      if (!position) {
        return null;
      }

      return (
        getActiveVertices().find((vertex) =>
          compareVector3Tuple(vertex.position, position),
        )?.id ?? null
      );
    };

    const getLineDragAxisSnapPositions = () => {
      const activeVertexPositions = getActiveVertexPositions();
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

    const findHoveredVertexAtScreenPoint = (
      event: PointerEvent | WheelEvent,
      options: { excludedVertexIds?: Set<string> } = {},
    ) => {
      const rect = element.getBoundingClientRect();
      let nearestMatch: {
        id: string;
        position: [number, number, number];
        projectedZ: number;
        screenDistance: number;
      } | null = null;

      for (const vertex of getActiveVertices(options.excludedVertexIds)) {
        const projectedVertex = projectVertexToScreenPoint(
          vertex.position,
          camera,
          {
            height: rect.height,
            width: rect.width,
          },
        );

        if (!projectedVertex) {
          continue;
        }

        const screenDistance = Math.hypot(
          projectedVertex.point[0] - (event.clientX - rect.left),
          projectedVertex.point[1] - (event.clientY - rect.top),
        );

        if (screenDistance > SCREEN_VERTEX_HIT_RADIUS_PX) {
          continue;
        }

        if (
          nearestMatch === null ||
          screenDistance < nearestMatch.screenDistance ||
          (Math.abs(screenDistance - nearestMatch.screenDistance) < 0.001 &&
            projectedVertex.projectedZ < nearestMatch.projectedZ)
        ) {
          nearestMatch = {
            id: vertex.id,
            position: [...vertex.position],
            projectedZ: projectedVertex.projectedZ,
            screenDistance,
          };
        }
      }

      return nearestMatch;
    };

    const findLassoElementAtScreenPoint = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const pointerScreen = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const viewport = {
        height: rect.height,
        width: rect.width,
      };
      const candidates: Array<{
        distance: number;
        projectedZ: number;
        selection: {
          edgeIds?: string[];
          faceIds?: string[];
          vertexIds?: string[];
        };
      }> = [];

      if (modelingLassoSelectVerticesEnabled) {
        const hoveredVertex = findHoveredVertexAtScreenPoint(event);
        if (hoveredVertex) {
          candidates.push({
            distance: hoveredVertex.screenDistance,
            projectedZ: hoveredVertex.projectedZ,
            selection: { vertexIds: [hoveredVertex.id] },
          });
        }
      }

      if (modelingLassoSelectEdgesEnabled) {
        for (const edge of getActiveEdgeTargets()) {
          const projectedCenter = projectVertexToScreenPoint(
            getEdgeCenter(edge),
            camera,
            viewport,
          );
          if (!projectedCenter) {
            continue;
          }

          const distance = Math.hypot(
            projectedCenter.point[0] - pointerScreen.x,
            projectedCenter.point[1] - pointerScreen.y,
          );
          if (distance <= SCREEN_VERTEX_HIT_RADIUS_PX) {
            candidates.push({
              distance,
              projectedZ: projectedCenter.projectedZ,
              selection: { edgeIds: [edge.edgeId] },
            });
          }
        }
      }

      if (modelingLassoSelectFacesEnabled) {
        for (const face of getActiveFaceTargets()) {
          const projectedCenter = projectVertexToScreenPoint(
            getFaceCenter(face),
            camera,
            viewport,
          );
          if (!projectedCenter) {
            continue;
          }

          const distance = Math.hypot(
            projectedCenter.point[0] - pointerScreen.x,
            projectedCenter.point[1] - pointerScreen.y,
          );
          if (distance <= SCREEN_VERTEX_HIT_RADIUS_PX) {
            candidates.push({
              distance,
              projectedZ: projectedCenter.projectedZ,
              selection: { faceIds: [face.faceId] },
            });
          }
        }
      }

      return (
        candidates.sort(
          (a, b) => a.distance - b.distance || a.projectedZ - b.projectedZ,
        )[0]?.selection ?? null
      );
    };

    const findHoveredSurfaceAtScreenPoint = (
      event: PointerEvent | WheelEvent,
      options: {
        edgeEnabled: boolean;
        excludedVertexIds?: Set<string>;
        faceEnabled: boolean;
      },
    ) => {
      if (!options.edgeEnabled && !options.faceEnabled) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const pointerScreen = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const viewport = {
        height: rect.height,
        width: rect.width,
      };

      if (options.edgeEnabled) {
        let nearestEdgeMatch: {
          edgeId: string;
          position: [number, number, number];
          projectedZ: number;
          screenDistance: number;
          vertexIds: [string, string];
        } | null = null;

        for (const edge of getActiveEdgeTargets(
          options.excludedVertexIds ?? new Set<string>(),
        )) {
          const projectedStart = projectVertexToScreenPoint(
            edge.start,
            camera,
            viewport,
          );
          const projectedEnd = projectVertexToScreenPoint(
            edge.end,
            camera,
            viewport,
          );

          if (!projectedStart || !projectedEnd) {
            continue;
          }

          const segmentX = projectedEnd.point[0] - projectedStart.point[0];
          const segmentY = projectedEnd.point[1] - projectedStart.point[1];
          const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

          if (segmentLengthSquared <= 0) {
            continue;
          }

          const t = Math.max(
            0,
            Math.min(
              1,
              ((pointerScreen.x - projectedStart.point[0]) * segmentX +
                (pointerScreen.y - projectedStart.point[1]) * segmentY) /
                segmentLengthSquared,
            ),
          );
          const closestScreenX = projectedStart.point[0] + segmentX * t;
          const closestScreenY = projectedStart.point[1] + segmentY * t;
          const screenDistance = Math.hypot(
            pointerScreen.x - closestScreenX,
            pointerScreen.y - closestScreenY,
          );

          if (screenDistance > SCREEN_EDGE_HIT_RADIUS_PX) {
            continue;
          }

          const start = new Vector3(...edge.start);
          const end = new Vector3(...edge.end);
          const position = start.lerp(end, t);
          const projectedZ =
            projectedStart.projectedZ +
            (projectedEnd.projectedZ - projectedStart.projectedZ) * t;

          if (
            nearestEdgeMatch === null ||
            screenDistance < nearestEdgeMatch.screenDistance ||
            (Math.abs(screenDistance - nearestEdgeMatch.screenDistance) <
              0.001 &&
              projectedZ < nearestEdgeMatch.projectedZ)
          ) {
            nearestEdgeMatch = {
              edgeId: edge.edgeId,
              position: [position.x, position.y, position.z],
              projectedZ,
              screenDistance,
              vertexIds: edge.vertexIds,
            };
          }
        }

        if (nearestEdgeMatch) {
          return {
            type: "edge" as const,
            edgeId: nearestEdgeMatch.edgeId,
            position: nearestEdgeMatch.position,
            vertexIds: nearestEdgeMatch.vertexIds,
          };
        }
      }

      if (!options.faceEnabled) {
        return null;
      }

      let nearestFaceMatch: {
        faceId: string;
        position: [number, number, number];
        projectedZ: number;
        vertexIds: ModelingFace["vertexIds"];
      } | null = null;

      for (const face of getActiveFaceTargets(
        options.excludedVertexIds ?? new Set<string>(),
      )) {
        for (const trianglePositions of triangulateFaceItems(face.positions)) {
          const projectedVertices = trianglePositions.map((position) =>
            projectVertexToScreenPoint(position, camera, viewport),
          );

          if (projectedVertices.some((projected) => projected === null)) {
            continue;
          }

          const [a, b, c] = projectedVertices as [
            NonNullable<(typeof projectedVertices)[number]>,
            NonNullable<(typeof projectedVertices)[number]>,
            NonNullable<(typeof projectedVertices)[number]>,
          ];
          const denominator =
            (b.point[1] - c.point[1]) * (a.point[0] - c.point[0]) +
            (c.point[0] - b.point[0]) * (a.point[1] - c.point[1]);

          if (Math.abs(denominator) <= 1e-8) {
            continue;
          }

          const weightA =
            ((b.point[1] - c.point[1]) * (pointerScreen.x - c.point[0]) +
              (c.point[0] - b.point[0]) * (pointerScreen.y - c.point[1])) /
            denominator;
          const weightB =
            ((c.point[1] - a.point[1]) * (pointerScreen.x - c.point[0]) +
              (a.point[0] - c.point[0]) * (pointerScreen.y - c.point[1])) /
            denominator;
          const weightC = 1 - weightA - weightB;
          const inside =
            weightA >= -0.001 && weightB >= -0.001 && weightC >= -0.001;

          if (!inside) {
            continue;
          }

          const intersection = raycaster.ray.intersectTriangle(
            new Vector3(...trianglePositions[0]),
            new Vector3(...trianglePositions[1]),
            new Vector3(...trianglePositions[2]),
            false,
            new Vector3(),
          );

          if (!intersection) {
            continue;
          }

          const projectedZ =
            a.projectedZ * weightA +
            b.projectedZ * weightB +
            c.projectedZ * weightC;

          if (
            nearestFaceMatch === null ||
            projectedZ < nearestFaceMatch.projectedZ
          ) {
            nearestFaceMatch = {
              faceId: face.faceId,
              position: [intersection.x, intersection.y, intersection.z],
              projectedZ,
              vertexIds: face.vertexIds,
            };
          }
        }
      }

      return nearestFaceMatch
        ? {
            type: "face" as const,
            faceId: nearestFaceMatch.faceId,
            position: nearestFaceMatch.position,
            vertexIds: nearestFaceMatch.vertexIds,
          }
        : null;
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
      const effectiveAxisSnapDistance = getEffectiveModelingPointerSnapValue(
        modelingPointerAxisSnapDistance,
        modelingPointerDepthPrecisionScale,
        precisionMode,
      );
      const effectiveEdgeSnapDistance = getEffectiveModelingPointerSnapValue(
        modelingPointerEdgeSnapDistance,
        modelingPointerDepthPrecisionScale,
        precisionMode,
      );
      const effectiveLineAngleSnapStepDeg =
        getEffectiveModelingPointerSnapValue(
          modelingLineAngleSnapStepDeg,
          modelingPointerDepthPrecisionScale,
          precisionMode,
          1,
        );
      const effectiveVertexSnapDistance = getEffectiveModelingPointerSnapValue(
        modelingPointerVertexSnapDistance,
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
              effectiveLineAngleSnapStepDeg,
            )
          : ([nextPosition.x, nextPosition.y, nextPosition.z] as [
              number,
              number,
              number,
            ]);
      const modelingTool = useUiStore.getState().modelingTool;
      const moveDragVertexIds =
        modelingTool === "move" && hasActiveMoveDrag()
          ? getMoveDragVertexIds()
          : new Set<string>();
      const screenVertexSnapEnabled =
        modelingTool === "move" || modelingPointerScreenVertexSnapEnabled;
      const screenHoverSnapAllowed =
        modelingTool !== "lasso" &&
        modelingTool !== "rotate" &&
        modelingTool !== "camera" &&
        (!moveDragActive || modelingTool === "move") &&
        (!hasActiveMoveDrag() || modelingTool === "move");
      const hoveredScreenVertex =
        screenVertexSnapEnabled && screenHoverSnapAllowed
          ? findHoveredVertexAtScreenPoint(
              {
                clientX:
                  ((ndc.x + 1) / 2) * element.getBoundingClientRect().width +
                  element.getBoundingClientRect().left,
                clientY:
                  ((1 - ndc.y) / 2) * element.getBoundingClientRect().height +
                  element.getBoundingClientRect().top,
              } as PointerEvent,
              { excludedVertexIds: moveDragVertexIds },
            )
          : null;

      if (hoveredScreenVertex) {
        const hoveredPosition = new Vector3(...hoveredScreenVertex.position);
        const nextDepth = hoveredPosition
          .sub(raycaster.ray.origin)
          .dot(raycaster.ray.direction);

        if (Number.isFinite(nextDepth)) {
          setModelingPointerDepth(nextDepth);
        }

        setModelingPointerPosition(hoveredScreenVertex.position);
        setModelingPointerSnappedAxes([false, false, false]);
        setModelingPointerSnappedAxisTargets([null, null, null]);
        setModelingPointerSnappedEdgeTarget(null);
        setModelingPointerSnappedFaceTarget(null);
        setModelingPointerSnappedVertexTarget(hoveredScreenVertex.position);
        return;
      }

      const hoveredScreenSurface = screenHoverSnapAllowed
        ? findHoveredSurfaceAtScreenPoint(
            {
              clientX:
                ((ndc.x + 1) / 2) * element.getBoundingClientRect().width +
                element.getBoundingClientRect().left,
              clientY:
                ((1 - ndc.y) / 2) * element.getBoundingClientRect().height +
                element.getBoundingClientRect().top,
            } as PointerEvent,
            {
              edgeEnabled: modelingPointerScreenEdgeSnapEnabled,
              excludedVertexIds: moveDragVertexIds,
              faceEnabled: modelingPointerScreenFaceSnapEnabled,
            },
          )
        : null;

      if (hoveredScreenSurface) {
        const hoveredPosition = new Vector3(...hoveredScreenSurface.position);
        const nextDepth = hoveredPosition
          .sub(raycaster.ray.origin)
          .dot(raycaster.ray.direction);

        if (Number.isFinite(nextDepth)) {
          setModelingPointerDepth(nextDepth);
        }

        setModelingPointerPosition(hoveredScreenSurface.position);
        setModelingPointerSnappedAxes([false, false, false]);
        setModelingPointerSnappedAxisTargets([null, null, null]);
        setModelingPointerSnappedVertexTarget(null);

        if (hoveredScreenSurface.type === "edge") {
          setModelingPointerSnappedEdgeTarget({
            edgeId: hoveredScreenSurface.edgeId,
            position: hoveredScreenSurface.position,
            vertexIds: hoveredScreenSurface.vertexIds,
          });
          setModelingPointerSnappedFaceTarget(null);
          return;
        }

        setModelingPointerSnappedEdgeTarget(null);
        setModelingPointerSnappedFaceTarget({
          faceId: hoveredScreenSurface.faceId,
          position: hoveredScreenSurface.position,
          vertexIds: hoveredScreenSurface.vertexIds,
        });
        return;
      }

      const activeVertexPositions = getActiveVertexPositions(moveDragVertexIds);
      const snapResult = getModelingPointerSnapResult(
        pointerPosition,
        activeVertexPositions,
        {
          axisSnapPositions:
            lineDragStartPosition &&
            modelingTool === "line" &&
            clickCandidate?.button === 0
              ? getLineDragAxisSnapPositions()
              : undefined,
          axisDistance: effectiveAxisSnapDistance,
          axisEnabled: modelingPointerAxisSnapEnabled,
          edgeDistance: effectiveEdgeSnapDistance,
          edgeEnabled: modelingPointerEdgeSnapEnabled,
          edgeSnapTargets: getActiveEdgeTargets(moveDragVertexIds),
          gridEnabled: modelingPointerGridSnapEnabled,
          gridStep: effectiveGridStep,
          vertexDistance: effectiveVertexSnapDistance,
          vertexEnabled: modelingPointerVertexSnapEnabled,
        },
      );

      setModelingPointerPosition(snapResult.position);
      setModelingPointerSnappedAxes(snapResult.snappedAxes);
      setModelingPointerSnappedAxisTargets(snapResult.snappedAxisTargets);
      setModelingPointerSnappedEdgeTarget(snapResult.snappedEdgeTarget);
      setModelingPointerSnappedFaceTarget(null);
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

    const updateMoveDragFromCurrentPointer = () => {
      const { modelingPointer, modelingTool } = useUiStore.getState();

      if (modelingTool === "move" && hasActiveMoveDrag()) {
        moveDragActive = true;
        updateVertexMoveDrag([...modelingPointer.position]);
        return true;
      }

      return false;
    };

    const updateLineDragPreviewFromCurrentPointer = () => {
      if (!clickCandidate?.moved || !lineDragStartPosition) {
        return false;
      }

      const { modelingPointer, modelingTool } = useUiStore.getState();

      if (modelingTool === "line") {
        const planeNormal = new Vector3();
        camera.getWorldDirection(planeNormal);

        setModelingLinePreview({
          currentPosition: [...modelingPointer.position],
          currentSnapped:
            modelingPointer.snappedVertexTarget !== null ||
            modelingPointer.snappedEdgeTarget !== null ||
            modelingPointer.snappedFaceTarget !== null,
          planeNormal: [planeNormal.x, planeNormal.y, planeNormal.z],
          polygonPoints: [],
          startSnapped: lineDragStartSnapped,
          startPosition: lineDragStartPosition,
          tool: "line",
          wireframeEdges: [],
        });
        return true;
      }

      if (modelingTool === "rectangle") {
        const rectanglePreview = getRectangleDragPreview(
          modelingPointer.position,
        );

        if (!rectanglePreview) {
          clearModelingLinePreview();
          return false;
        }

        setModelingLinePreview({
          currentPosition: rectanglePreview.corners[2],
          currentSnapped: compareVector3Tuple(
            rectanglePreview.corners[2],
            modelingPointer.position,
          )
            ? modelingPointer.snappedVertexTarget !== null ||
              modelingPointer.snappedEdgeTarget !== null ||
              modelingPointer.snappedFaceTarget !== null
            : false,
          planeNormal: rectanglePreview.planeNormal,
          polygonPoints: rectanglePreview.corners,
          startSnapped: lineDragStartSnapped,
          startPosition: lineDragStartPosition,
          tool: "rectangle",
          wireframeEdges: [],
        });
        return true;
      }

      if (modelingTool === "box") {
        const boxPreview = getBoxVerticesFromDiagonal(
          lineDragStartPosition,
          modelingPointer.position,
        );
        const planeNormal = new Vector3();
        camera.getWorldDirection(planeNormal);

        if (!boxPreview) {
          clearModelingLinePreview();
          return false;
        }

        setModelingLinePreview({
          currentPosition: [...modelingPointer.position],
          currentSnapped:
            modelingPointer.snappedVertexTarget !== null ||
            modelingPointer.snappedEdgeTarget !== null ||
            modelingPointer.snappedFaceTarget !== null,
          planeNormal: [planeNormal.x, planeNormal.y, planeNormal.z],
          polygonPoints: boxPreview.corners.map((corner) => [...corner]),
          startSnapped: lineDragStartSnapped,
          startPosition: lineDragStartPosition,
          tool: "box",
          wireframeEdges: boxPreview.edges,
        });
        return true;
      }

      return false;
    };

    const updateActiveDragFromCurrentPointer = () => {
      if (updateMoveDragFromCurrentPointer()) {
        return true;
      }

      return updateLineDragPreviewFromCurrentPointer();
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

      const { modelingTool } = useUiStore.getState();
      if (clickCandidate?.moved && modelingTool === "lasso") {
        lassoPoints = appendLassoPoint(lassoPoints, getCanvasPoint(event));
        setModelingLassoSelection({
          phase: "dragging",
          points: lassoPoints,
        });
      } else if (clickCandidate?.moved && modelingTool === "move") {
        updateMoveDragFromCurrentPointer();
      } else if (clickCandidate?.moved && modelingTool === "pen") {
        penStrokePoints = [
          ...penStrokePoints,
          [...useUiStore.getState().modelingPointer.position],
        ];
        penStrokeScreenPoints = [
          ...penStrokeScreenPoints,
          getCanvasPoint(event),
        ];
        setModelingPenPreview(penStrokeScreenPoints);
      } else if (clickCandidate?.moved && lineDragStartPosition) {
        updateLineDragPreviewFromCurrentPointer();
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
      penStrokePoints = [];
      penStrokeScreenPoints = [];
      moveDragActive = false;
      clearModelingLassoSelection();
      clearModelingLinePreview();
      clearModelingPenPreview();
      cancelVertexMoveDrag();
      setModelingPointerHovered(false);
      setModelingPointerSnappedAxes([false, false, false]);
      setModelingPointerSnappedAxisTargets([null, null, null]);
      setModelingPointerSnappedEdgeTarget(null);
      setModelingPointerSnappedFaceTarget(null);
      setModelingPointerSnappedVertexTarget(null);
    };

    const handlePointerDown = (event: PointerEvent) => {
      clearActivePenStroke();
      updatePointerFromEvent(event);
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
        } else if (
          modelingTool === "move" &&
          modelingPointer.snappedVertexTarget !== null
        ) {
          const hoveredVertexId = findVertexIdByPosition(
            modelingPointer.snappedVertexTarget,
          );

          if (hoveredVertexId) {
            const currentSelectedVertexIds =
              useModelingStore.getState().selectedVertexIds;
            const appendToSelection = event.shiftKey;
            const nextSelectedVertexIds = appendToSelection
              ? currentSelectedVertexIds.includes(hoveredVertexId)
                ? [...currentSelectedVertexIds]
                : [...currentSelectedVertexIds, hoveredVertexId]
              : [hoveredVertexId];

            useModelingStore
              .getState()
              .selectVertex(hoveredVertexId, appendToSelection);

            beginVertexMoveDrag(hoveredVertexId, nextSelectedVertexIds);
          }
        } else if (modelingTool === "move") {
          clearVertexSelection();
        } else if (
          modelingTool === "line" ||
          modelingTool === "pen" ||
          modelingTool === "rectangle" ||
          modelingTool === "box"
        ) {
          lineDragStartPosition = [...modelingPointer.position];
          if (modelingTool === "pen") {
            penStrokePoints = [[...modelingPointer.position]];
            penStrokeScreenPoints = [getCanvasPoint(event)];
            clearModelingPenPreview();
          }
          lineDragStartEdgeTarget = modelingPointer.snappedEdgeTarget;
          lineDragStartVertexId = findVertexIdByPosition(
            modelingPointer.snappedVertexTarget,
          );
          lineDragStartSnapped =
            lineDragStartVertexId !== null ||
            modelingPointer.snappedEdgeTarget !== null ||
            modelingPointer.snappedFaceTarget !== null;
        }
      }

      if (
        effectiveTool === "camera" &&
        (event.button === 0 || event.button === 2)
      ) {
        cameraDragButton = event.button;
        setModelingCameraDragging(true);
      }
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
            const viewport = {
              height: rect.height,
              width: rect.width,
            };
            const selectedVertexIds = modelingLassoSelectVerticesEnabled
              ? getActiveVertices().flatMap((vertex) => {
                  const projectedVertex = projectVertexToScreenPoint(
                    vertex.position,
                    camera,
                    viewport,
                  );

                  return projectedVertex &&
                    isPointInsideLasso(
                      projectedVertex.point,
                      finalizedLassoPoints,
                    )
                    ? [vertex.id]
                    : [];
                })
              : [];
            const selectedEdgeIds = modelingLassoSelectEdgesEnabled
              ? getActiveEdgeTargets().flatMap((edge) => {
                  const projectedEdgeCenter = projectVertexToScreenPoint(
                    getEdgeCenter(edge),
                    camera,
                    viewport,
                  );

                  return projectedEdgeCenter &&
                    isPointInsideLasso(
                      projectedEdgeCenter.point,
                      finalizedLassoPoints,
                    )
                    ? [edge.edgeId]
                    : [];
                })
              : [];
            const selectedFaceIds = modelingLassoSelectFacesEnabled
              ? getActiveFaceTargets().flatMap((face) => {
                  const projectedFaceCenter = projectVertexToScreenPoint(
                    getFaceCenter(face),
                    camera,
                    viewport,
                  );

                  return projectedFaceCenter &&
                    isPointInsideLasso(
                      projectedFaceCenter.point,
                      finalizedLassoPoints,
                    )
                    ? [face.faceId]
                    : [];
                })
              : [];

            setModelingLassoSelection({
              phase: "settled",
              points: finalizedLassoPoints,
            });
            selectModelingElements(
              {
                edgeIds: selectedEdgeIds,
                faceIds: selectedFaceIds,
                vertexIds: selectedVertexIds,
              },
              event.shiftKey,
            );
          } else {
            const clickedSelection = findLassoElementAtScreenPoint(event);
            if (clickedSelection) {
              selectModelingElements(clickedSelection, event.shiftKey);
            } else {
              selectModelingElements({}, false);
            }
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
        } else if (modelingTool === "pen") {
          if (clickCandidate.moved) {
            const rawPoints = [
              ...penStrokePoints,
              [...modelingPointer.position] as [number, number, number],
            ];
            const created = createPenStrokeFromPositions(
              rawPoints,
              DEFAULT_PEN_STROKE_PARAMS,
            );

            if (created) {
              setActivePenStroke({
                historyIndex: useModelingStore.getState().historyIndex,
                params: DEFAULT_PEN_STROKE_PARAMS,
                rawPoints,
              });
            }
          }
        } else if (modelingTool === "rectangle") {
          if (clickCandidate.moved && lineDragStartPosition) {
            const projectedEndPosition = getRectangleDragPosition(
              lineDragStartPosition,
              modelingPointer.position,
              modelingRectangleMode,
            );
            const lineDragEndVertexId = compareVector3Tuple(
              projectedEndPosition,
              modelingPointer.position,
            )
              ? findVertexIdByPosition(modelingPointer.snappedVertexTarget)
              : null;

            createRectangleFromDiagonal(
              lineDragStartPosition,
              projectedEndPosition,
              {
                endEdgeTarget:
                  lineDragEndVertexId === null &&
                  compareVector3Tuple(
                    projectedEndPosition,
                    modelingPointer.position,
                  )
                    ? modelingPointer.snappedEdgeTarget
                    : null,
                endVertexId: lineDragEndVertexId,
                faceMode: modelingRectangleFaceMode,
                mode: modelingRectangleMode,
                startEdgeTarget:
                  lineDragStartVertexId === null
                    ? lineDragStartEdgeTarget
                    : null,
                startVertexId: lineDragStartVertexId,
              },
            );
          }
        } else if (modelingTool === "box") {
          if (clickCandidate.moved && lineDragStartPosition) {
            const lineDragEndVertexId = findVertexIdByPosition(
              modelingPointer.snappedVertexTarget,
            );

            createBoxFromDiagonal(
              lineDragStartPosition,
              [...modelingPointer.position],
              {
                endEdgeTarget: modelingPointer.snappedEdgeTarget,
                endVertexId: lineDragEndVertexId,
                faceMode: modelingBoxFaceMode,
                startEdgeTarget:
                  lineDragStartVertexId === null
                    ? lineDragStartEdgeTarget
                    : null,
                startVertexId: lineDragStartVertexId,
              },
            );
          }
        } else if (modelingTool === "move") {
          if (clickCandidate.moved) {
            commitVertexMoveDrag();
          } else {
            cancelVertexMoveDrag();
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
      penStrokePoints = [];
      penStrokeScreenPoints = [];
      moveDragActive = false;
      clearModelingLinePreview();
      clearModelingPenPreview();
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
      if (
        useUiStore.getState().modelingTool === "move" &&
        hasActiveMoveDrag()
      ) {
        clickCandidate = clickCandidate
          ? { ...clickCandidate, moved: true }
          : {
              button: 0,
              moved: true,
              x: event.clientX,
              y: event.clientY,
            };
      }
      setModelingPointerDepth(nextDepth);
      updatePointerPosition({
        depth: nextDepth,
        directionSnapMode: event.ctrlKey,
        precisionMode: event.shiftKey,
      });
      updateActiveDragFromCurrentPointer();
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
        updateActiveDragFromCurrentPointer();
      } else if (event.key === "Control") {
        updatePointerPosition({ directionSnapMode: true });
        updateActiveDragFromCurrentPointer();
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
        updateActiveDragFromCurrentPointer();
      } else if (event.key === "Control") {
        updatePointerPosition({ directionSnapMode: false });
        updateActiveDragFromCurrentPointer();
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
      cancelVertexMoveDrag();
      clearModelingLinePreview();
      clearModelingLassoSelection();
      clearModelingPenPreview();
      setModelingPointerHovered(false);
      setModelingPointerSnappedAxes([false, false, false]);
      setModelingPointerSnappedAxisTargets([null, null, null]);
      setModelingPointerSnappedEdgeTarget(null);
      setModelingPointerSnappedFaceTarget(null);
      setModelingPointerSnappedVertexTarget(null);
      clearVertexSelection();
    };
  }, [
    addVertex,
    beginVertexMoveDrag,
    camera,
    cancelVertexMoveDrag,
    clearActivePenStroke,
    clearVertexSelection,
    clearModelingLinePreview,
    clearModelingPenPreview,
    commitVertexMoveDrag,
    controlsRef,
    createBoxFromDiagonal,
    createEdgeFromPositions,
    createPenStrokeFromPositions,
    createRectangleFromDiagonal,
    gl,
    modelingPointerAxisSnapEnabled,
    modelingPointerAxisSnapDistance,
    modelingPointerDepthPrecisionScale,
    modelingPointerEdgeSnapDistance,
    modelingPointerEdgeSnapEnabled,
    modelingPointerGridSnapEnabled,
    modelingPointerGridSnapStep,
    modelingPointerScreenEdgeSnapEnabled,
    modelingPointerScreenFaceSnapEnabled,
    modelingPointerScreenVertexSnapEnabled,
    modelingPointerVertexSnapDistance,
    modelingPointerVertexSnapEnabled,
    modelingLassoSelectEdgesEnabled,
    modelingLassoSelectFacesEnabled,
    modelingLassoSelectVerticesEnabled,
    modelingLineAngleSnapStepDeg,
    modelingBoxFaceMode,
    modelingRectangleFaceMode,
    modelingRectangleMode,
    selectModelingElements,
    setActivePenStroke,
    setModelingCameraDragging,
    setModelingLassoSelection,
    setModelingLinePreview,
    setModelingPenPreview,
    setModelingPointerDepth,
    setModelingPointerHovered,
    setModelingPointerPlane,
    setModelingPointerPosition,
    setModelingPointerSnappedAxes,
    setModelingPointerSnappedAxisTargets,
    setModelingPointerSnappedEdgeTarget,
    setModelingPointerSnappedFaceTarget,
    setModelingPointerSnappedVertexTarget,
    clearModelingLassoSelection,
    updateVertexMoveDrag,
  ]);

  return null;
}
