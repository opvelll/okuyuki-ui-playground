import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MOUSE,
  Plane,
  PointsMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelingStore } from "../store/modelingStore";
import type {
  ModelingBelowFloorDisplay,
  MoveOverlayOrientationMode,
} from "../store/uiStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";
import { ModelingInputController } from "./scene/ModelingInputController";
import { calculateDragPlaneOverlayGeometry } from "./scene/dragPlaneOverlay";
import {
  type ModelingPointerDepthHint,
  getModelingPointerDepthHint,
  modelingPointerPositionsMatch,
} from "./scene/modelingPointerUtils";

const POINTER_AXIS_LENGTH = 1.25;
const POINTER_AXIS_DASH_EXTENT = 120;
const POINTER_AXIS_DASH_SIZE = 0.18;
const POINTER_AXIS_GAP_SIZE = 0.08;
const MODEL_VERTEX_PIXEL_SIZE = 4;
const DEFAULT_OVERLAY_NORMAL = new Vector3(0, 0, 1);
const MODELING_LINE_PREVIEW_DEFAULT_VERTEX_COLOR = "#ffffff";
const MODELING_LINE_PREVIEW_SNAPPED_VERTEX_COLOR = "#22c55e";
const MODELING_LINE_PREVIEW_DEFAULT_LINE_COLOR = "#bfdbfe";
const MODELING_LINE_PREVIEW_AXIS_SNAPPED_LINE_COLOR = "#fde047";
const MODELING_POINTER_DEPTH_HINT_SCREEN_DISTANCE_PX = 10;
const MODELING_POINTER_DEPTH_HINT_OFFSET_X_PX = 12;
const MODELING_POINTER_DEPTH_HINT_OFFSET_Y_PX = -16;
const MODELING_LINE_PREVIEW_COLORS = {
  "camera-facing": "#fdba74",
  "screen-horizontal": "#facc15",
  "screen-vertical": "#fb923c",
} as const;
const MODELING_LINE_OVERLAY_FILL_OPACITY = 0.18;
const MODELING_LINE_OVERLAY_BELOW_FLOOR_OPACITY = 0.045;
const MODELING_LINE_OVERLAY_GHOST_OPACITY = 0.13;
const MODELING_LINE_OVERLAY_RING_SEGMENTS = 96;
const AXIS_KEYS = ["x", "y", "z"] as const;
const HORIZONTAL_AXIS_FADED_OPACITY = 0.18;
const HORIZONTAL_AXIS_DASH_FADED_OPACITY = 0.12;

export function shouldShowModelingPointerHorizontalAxes(
  pointerY: number,
  verticalAxisFloorY: number,
) {
  return pointerY >= verticalAxisFloorY;
}

export function getModelingLineOverlayOpacity(
  centerY: number,
  floorY: number,
  belowFloorDisplay: ModelingBelowFloorDisplay,
) {
  if (centerY >= floorY || belowFloorDisplay === "visible") {
    return MODELING_LINE_OVERLAY_FILL_OPACITY;
  }

  return belowFloorDisplay === "faded"
    ? MODELING_LINE_OVERLAY_BELOW_FLOOR_OPACITY
    : 0;
}

export function getModelingLineOverlayBelowFloorOpacity(
  belowFloorDisplay: ModelingBelowFloorDisplay,
) {
  if (belowFloorDisplay === "hidden") {
    return 0;
  }

  return belowFloorDisplay === "faded"
    ? MODELING_LINE_OVERLAY_BELOW_FLOOR_OPACITY
    : MODELING_LINE_OVERLAY_FILL_OPACITY;
}

function createUnitCircleLinePoints(segments: number) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    return new Vector3(Math.cos(angle), Math.sin(angle), 0);
  });
}

function createUnitCircleSegmentPositions(segments: number) {
  const points = createUnitCircleLinePoints(segments);
  return new Float32Array(
    points.slice(0, -1).flatMap((point, index) => {
      const nextPoint = points[index + 1];
      return [point.x, point.y, point.z, nextPoint.x, nextPoint.y, nextPoint.z];
    }),
  );
}

function renderModelingAxisSnapGuides(
  position: [number, number, number],
  snappedAxes: [boolean, boolean, boolean],
  snappedAxisTargets: [
    [number, number, number] | null,
    [number, number, number] | null,
    [number, number, number] | null,
  ],
  renderOrder: number,
) {
  return snappedAxisTargets.map((target, axisIndex) =>
    snappedAxes[axisIndex] && target ? (
      <Line
        color="#fde047"
        dashScale={1.1}
        dashed
        depthTest={false}
        depthWrite={false}
        gapSize={0.12}
        key={`snap-guide-${AXIS_KEYS[axisIndex]}`}
        lineWidth={1.5}
        opacity={0.95}
        points={[
          new Vector3(
            target[0] - position[0],
            target[1] - position[1],
            target[2] - position[2],
          ),
          new Vector3(0, 0, 0),
        ]}
        renderOrder={renderOrder}
        transparent
      />
    ) : null,
  );
}

function createLineSegments(points: number[], material: LineBasicMaterial) {
  const geometry = new BufferGeometry();
  if (points.length > 0) {
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  }

  return new LineSegments(geometry, material);
}

function createDashedLineSegments(
  points: number[],
  material: LineDashedMaterial,
) {
  const line = createLineSegments(points, material);
  line.computeLineDistances();
  return line;
}

function ModelingPointer() {
  const hovered = useUiStore((state) => state.modelingPointer.hovered);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingPointerVisibleInCameraTool = useUiStore(
    (state) => state.modelingPointerVisibleInCameraTool,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const plane = useUiStore((state) => state.modelingPointer.plane);
  const position = useUiStore((state) => state.modelingPointer.position);
  const snappedAxes = useUiStore((state) => state.modelingPointer.snappedAxes);
  const snappedAxisTargets = useUiStore(
    (state) => state.modelingPointer.snappedAxisTargets,
  );
  const panelRadius = useUiStore((state) => state.modelingPointerPanelRadius);
  const verticalAxisFloorY = useUiStore(
    (state) => state.modelingPointerVerticalAxisFloorY,
  );
  const horizontalAxisBelowFloorDisplay = useUiStore(
    (state) => state.modelingPointerAxisBelowFloorDisplay,
  );
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const showHorizontalAxes = shouldShowModelingPointerHorizontalAxes(
    position[1],
    verticalAxisFloorY,
  );
  const renderHorizontalAxes =
    showHorizontalAxes || horizontalAxisBelowFloorDisplay === "faded";
  const horizontalAxisOpacity = showHorizontalAxes
    ? 1
    : HORIZONTAL_AXIS_FADED_OPACITY;
  const horizontalAxisDashOpacity = showHorizontalAxes
    ? 0.7
    : HORIZONTAL_AXIS_DASH_FADED_OPACITY;
  const xAxisLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [-POINTER_AXIS_LENGTH, 0, 0, POINTER_AXIS_LENGTH, 0, 0],
        3,
      ),
    );
    const material = new LineBasicMaterial({
      color: "#f87171",
      opacity: horizontalAxisOpacity,
      transparent: horizontalAxisOpacity < 1,
    });
    return new LineSegments(geometry, material);
  }, [horizontalAxisOpacity]);
  const yAxisLine = useMemo(() => {
    const clipLocalY = verticalAxisFloorY - position[1];
    const visibleStart = Math.max(-POINTER_AXIS_LENGTH, clipLocalY);
    const points =
      visibleStart < POINTER_AXIS_LENGTH
        ? [0, visibleStart, 0, 0, POINTER_AXIS_LENGTH, 0]
        : [];
    const material = new LineBasicMaterial({ color: "#84cc16" });
    return createLineSegments(points, material);
  }, [position, verticalAxisFloorY]);
  const zAxisLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [0, 0, -POINTER_AXIS_LENGTH, 0, 0, POINTER_AXIS_LENGTH],
        3,
      ),
    );
    const material = new LineBasicMaterial({
      color: "#60a5fa",
      opacity: horizontalAxisOpacity,
      transparent: horizontalAxisOpacity < 1,
    });
    return new LineSegments(geometry, material);
  }, [horizontalAxisOpacity]);
  const xAxisDashLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          -POINTER_AXIS_DASH_EXTENT,
          0,
          0,
          -POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_DASH_EXTENT,
          0,
          0,
        ],
        3,
      ),
    );
    const material = new LineDashedMaterial({
      color: "#fca5a5",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: horizontalAxisDashOpacity,
      transparent: horizontalAxisDashOpacity < 1,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, [horizontalAxisDashOpacity]);
  const yAxisDashLine = useMemo(() => {
    const clipLocalY = verticalAxisFloorY - position[1];
    const points: number[] = [];
    const lowerDashStart = Math.max(-POINTER_AXIS_DASH_EXTENT, clipLocalY);
    if (lowerDashStart < -POINTER_AXIS_LENGTH) {
      points.push(0, lowerDashStart, 0, 0, -POINTER_AXIS_LENGTH, 0);
    }

    const upperDashStart = Math.max(POINTER_AXIS_LENGTH, clipLocalY);
    if (upperDashStart < POINTER_AXIS_DASH_EXTENT) {
      points.push(0, upperDashStart, 0, 0, POINTER_AXIS_DASH_EXTENT, 0);
    }

    const material = new LineDashedMaterial({
      color: "#bef264",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: 0.7,
      transparent: true,
    });
    return createDashedLineSegments(points, material);
  }, [position, verticalAxisFloorY]);
  const zAxisDashLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          0,
          0,
          -POINTER_AXIS_DASH_EXTENT,
          0,
          0,
          -POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_LENGTH,
          0,
          0,
          POINTER_AXIS_DASH_EXTENT,
        ],
        3,
      ),
    );
    const material = new LineDashedMaterial({
      color: "#93c5fd",
      dashSize: POINTER_AXIS_DASH_SIZE,
      gapSize: POINTER_AXIS_GAP_SIZE,
      opacity: horizontalAxisDashOpacity,
      transparent: horizontalAxisDashOpacity < 1,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, [horizontalAxisDashOpacity]);
  const panelGeometry = useMemo(
    () => new CircleGeometry(panelRadius, 48),
    [panelRadius],
  );
  useEffect(() => {
    return () => {
      xAxisLine.geometry.dispose();
      xAxisLine.material.dispose();
      yAxisLine.geometry.dispose();
      yAxisLine.material.dispose();
      zAxisLine.geometry.dispose();
      zAxisLine.material.dispose();
      xAxisDashLine.geometry.dispose();
      xAxisDashLine.material.dispose();
      yAxisDashLine.geometry.dispose();
      yAxisDashLine.material.dispose();
      zAxisDashLine.geometry.dispose();
      zAxisDashLine.material.dispose();
      panelGeometry.dispose();
    };
  }, [
    panelGeometry,
    xAxisDashLine,
    xAxisLine,
    yAxisDashLine,
    yAxisLine,
    zAxisDashLine,
    zAxisLine,
  ]);

  if (
    !hovered ||
    modelingTool === "lasso" ||
    (effectiveTool === "camera" && !modelingPointerVisibleInCameraTool)
  ) {
    return null;
  }

  return (
    <group position={position}>
      {renderModelingAxisSnapGuides(
        position,
        snappedAxes,
        snappedAxisTargets,
        7,
      )}
      {renderHorizontalAxes ? (
        <primitive object={xAxisDashLine} renderOrder={8} />
      ) : null}
      <primitive object={yAxisDashLine} renderOrder={8} />
      {renderHorizontalAxes ? (
        <primitive object={zAxisDashLine} renderOrder={8} />
      ) : null}
      {renderHorizontalAxes ? (
        <primitive object={xAxisLine} renderOrder={10} />
      ) : null}
      <primitive object={yAxisLine} renderOrder={10} />
      {renderHorizontalAxes ? (
        <primitive object={zAxisLine} renderOrder={10} />
      ) : null}
      {plane === "horizontal" ? (
        <mesh
          geometry={panelGeometry}
          position={[0, 0.001, 0]}
          renderOrder={9}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="#7dd3fc"
            depthTest={false}
            opacity={0.3}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
      {plane === "vertical" ? (
        <mesh geometry={panelGeometry} renderOrder={9}>
          <meshBasicMaterial
            color="#fbbf24"
            depthTest={false}
            opacity={0.28}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
    </group>
  );
}

function ModelingPointerDepthHintController({
  setDepthHint,
}: {
  setDepthHint: Dispatch<SetStateAction<ModelingPointerDepthHint | null>>;
}) {
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const hovered = useUiStore((state) => state.modelingPointer.hovered);
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const modelingPointerVisibleInCameraTool = useUiStore(
    (state) => state.modelingPointerVisibleInCameraTool,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const pointerPosition = useUiStore((state) => state.modelingPointer.position);
  const vertexSnapDistance = useUiStore(
    (state) => state.modelingPointerVertexSnapDistance,
  );
  const { camera, size } = useThree();
  const activeModel = modelsById[currentModelId];
  const vertexPositions = useMemo(
    () =>
      activeModel
        ? activeModel.vertexOrder.map(
            (vertexId) => activeModel.verticesById[vertexId].position,
          )
        : [],
    [activeModel],
  );
  const lastSignatureRef = useRef<string | null>(null);
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });

  useFrame(() => {
    const shouldHide =
      !hovered ||
      modelingTool === "lasso" ||
      vertexPositions.length === 0 ||
      (effectiveTool === "camera" && !modelingPointerVisibleInCameraTool);
    if (shouldHide) {
      if (lastSignatureRef.current !== null) {
        lastSignatureRef.current = null;
        setDepthHint(null);
      }
      return;
    }

    const nextHint = getModelingPointerDepthHint(
      pointerPosition,
      vertexPositions,
      camera,
      size,
      {
        depthDistance: vertexSnapDistance,
        screenDistancePx: MODELING_POINTER_DEPTH_HINT_SCREEN_DISTANCE_PX,
      },
    );
    const nextSignature = nextHint
      ? [
          nextHint.pointerScreenPosition.x.toFixed(1),
          nextHint.pointerScreenPosition.y.toFixed(1),
          nextHint.nearCount,
          nextHint.farCount,
        ].join(":")
      : null;

    if (nextSignature === lastSignatureRef.current) {
      return;
    }

    lastSignatureRef.current = nextSignature;
    setDepthHint(nextHint);
  });

  return null;
}

function ModelingLassoOverlay() {
  const modelingLassoSelection = useUiStore(
    (state) => state.modelingLassoSelection,
  );

  if (modelingLassoSelection.phase === "idle") {
    return null;
  }

  const pathPoints = modelingLassoSelection.points
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  if (!pathPoints) {
    return null;
  }

  const fillOpacity = modelingLassoSelection.phase === "dragging" ? 0.08 : 0.14;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    >
      <polygon
        fill={`rgba(125, 211, 252, ${fillOpacity})`}
        points={pathPoints}
        stroke="#e0f2fe"
        strokeDasharray="7 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ModelingLineOverlayRing({
  clippingPlanes,
  color,
  depthTest,
  opacity,
  renderOrder,
  ringSegmentPositions,
}: {
  clippingPlanes: Plane[];
  color: string;
  depthTest: boolean;
  opacity: number;
  renderOrder: number;
  ringSegmentPositions: Float32Array;
}) {
  return (
    <lineSegments renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute
          args={[ringSegmentPositions, 3]}
          attach="attributes-position"
          count={ringSegmentPositions.length / 3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        clippingPlanes={clippingPlanes}
        color={color}
        depthTest={depthTest}
        depthWrite={false}
        opacity={opacity}
        transparent
      />
    </lineSegments>
  );
}

function ModelingLinePreviewOverlay() {
  const modelingLineOverlayDisplayMode = useUiStore(
    (state) => state.modelingLineOverlayDisplayMode,
  );
  const modelingLineOverlayBelowFloorDisplay = useUiStore(
    (state) => state.modelingLineOverlayBelowFloorDisplay,
  );
  const modelingLineOverlayRadiusMultiplier = useUiStore(
    (state) => state.modelingLineOverlayRadiusMultiplier,
  );
  const modelingLinePreview = useUiStore((state) => state.modelingLinePreview);
  const modelingPointerPosition = useUiStore(
    (state) => state.modelingPointer.position,
  );
  const modelingPointerSnappedAxes = useUiStore(
    (state) => state.modelingPointer.snappedAxes,
  );
  const modelingPointerSnappedAxisTargets = useUiStore(
    (state) => state.modelingPointer.snappedAxisTargets,
  );
  const verticalAxisFloorY = useUiStore(
    (state) => state.modelingPointerVerticalAxisFloorY,
  );
  const ringSegmentPositions = useMemo(
    () => createUnitCircleSegmentPositions(MODELING_LINE_OVERLAY_RING_SEGMENTS),
    [],
  );
  const aboveFloorClippingPlanes = useMemo(
    () => [new Plane(new Vector3(0, 1, 0), -verticalAxisFloorY)],
    [verticalAxisFloorY],
  );
  const belowFloorClippingPlanes = useMemo(
    () => [new Plane(new Vector3(0, -1, 0), verticalAxisFloorY)],
    [verticalAxisFloorY],
  );
  const overlayModes = useMemo(() => {
    switch (modelingLineOverlayDisplayMode) {
      case "mode-2":
        return ["screen-vertical"] as const;
      case "mode-3":
        return ["screen-horizontal"] as const;
      case "modes-2-3":
        return ["screen-vertical", "screen-horizontal"] as const;
      case "modes-1-2-3":
        return [
          "camera-facing",
          "screen-vertical",
          "screen-horizontal",
        ] as const;
      default:
        return ["camera-facing"] as const;
    }
  }, [modelingLineOverlayDisplayMode]);
  const overlayGeometries = useMemo(() => {
    if (!modelingLinePreview.active) {
      return [];
    }

    return overlayModes.map((orientationMode) => {
      const geometry = calculateDragPlaneOverlayGeometry(
        {
          currentPoint: new Vector3(...modelingLinePreview.currentPosition),
          orientationMode: orientationMode as MoveOverlayOrientationMode,
          planeNormal: new Vector3(...modelingLinePreview.planeNormal),
          previousSurfaceNormal: null,
          startPoint: new Vector3(...modelingLinePreview.startPosition),
        },
        {
          minRadius: 0,
          radiusMultiplier: modelingLineOverlayRadiusMultiplier,
        },
      );

      const planeQuaternion = new Quaternion();
      planeQuaternion.setFromUnitVectors(
        DEFAULT_OVERLAY_NORMAL,
        geometry.surfaceNormal.clone().normalize(),
      );

      return {
        color: MODELING_LINE_PREVIEW_COLORS[orientationMode],
        ...geometry,
        belowFloorOpacity: getModelingLineOverlayBelowFloorOpacity(
          modelingLineOverlayBelowFloorDisplay,
        ),
        orientationMode,
        opacity: MODELING_LINE_OVERLAY_FILL_OPACITY,
        planeQuaternion,
      };
    });
  }, [
    modelingLineOverlayBelowFloorDisplay,
    modelingLineOverlayRadiusMultiplier,
    modelingLinePreview,
    overlayModes,
  ]);

  if (!modelingLinePreview.active || overlayGeometries.length === 0) {
    return null;
  }

  const showCurrentPoint = !modelingPointerPositionsMatch(
    modelingLinePreview.startPosition,
    modelingLinePreview.currentPosition,
  );
  const showRectangleOutline =
    modelingLinePreview.tool === "rectangle" &&
    modelingLinePreview.polygonPoints.length === 4;
  const showBoxWireframe =
    modelingLinePreview.tool === "box" &&
    modelingLinePreview.wireframeEdges.length > 0;
  const showCurrentAxisSnapGuides =
    showCurrentPoint &&
    modelingPointerPositionsMatch(
      modelingLinePreview.currentPosition,
      modelingPointerPosition,
    );
  const linePreviewAxisSnapped =
    showCurrentAxisSnapGuides &&
    modelingPointerSnappedAxisTargets.some(
      (target, axisIndex) =>
        modelingPointerSnappedAxes[axisIndex] &&
        target !== null &&
        modelingPointerPositionsMatch(
          target,
          modelingLinePreview.startPosition,
        ),
    );

  return (
    <group raycast={() => null}>
      {overlayGeometries.map((geometry) => (
        <group
          key={geometry.orientationMode}
          position={geometry.center}
          quaternion={geometry.planeQuaternion}
          scale={[geometry.radius, geometry.radius, 1]}
        >
          {geometry.opacity > 0 ? (
            <>
              <mesh renderOrder={5}>
                <circleGeometry
                  args={[1, MODELING_LINE_OVERLAY_RING_SEGMENTS]}
                />
                <meshBasicMaterial
                  clippingPlanes={
                    modelingLineOverlayBelowFloorDisplay === "visible"
                      ? []
                      : aboveFloorClippingPlanes
                  }
                  color={geometry.color}
                  depthTest={true}
                  depthWrite={false}
                  opacity={geometry.opacity}
                  side={DoubleSide}
                  transparent
                />
              </mesh>
              <ModelingLineOverlayRing
                clippingPlanes={
                  modelingLineOverlayBelowFloorDisplay === "visible"
                    ? []
                    : aboveFloorClippingPlanes
                }
                color={geometry.color}
                depthTest={true}
                opacity={Math.min(0.96, geometry.opacity * 5.1)}
                renderOrder={11}
                ringSegmentPositions={ringSegmentPositions}
              />
              <ModelingLineOverlayRing
                clippingPlanes={
                  modelingLineOverlayBelowFloorDisplay === "visible"
                    ? []
                    : aboveFloorClippingPlanes
                }
                color={geometry.color}
                depthTest={false}
                opacity={Math.min(
                  MODELING_LINE_OVERLAY_GHOST_OPACITY,
                  geometry.opacity * 2.2,
                )}
                renderOrder={2}
                ringSegmentPositions={ringSegmentPositions}
              />
              {geometry.belowFloorOpacity > 0 &&
              modelingLineOverlayBelowFloorDisplay !== "visible" ? (
                <>
                  <mesh renderOrder={5}>
                    <circleGeometry
                      args={[1, MODELING_LINE_OVERLAY_RING_SEGMENTS]}
                    />
                    <meshBasicMaterial
                      clippingPlanes={belowFloorClippingPlanes}
                      color={geometry.color}
                      depthTest={true}
                      depthWrite={false}
                      opacity={geometry.belowFloorOpacity}
                      side={DoubleSide}
                      transparent
                    />
                  </mesh>
                  <ModelingLineOverlayRing
                    clippingPlanes={belowFloorClippingPlanes}
                    color={geometry.color}
                    depthTest={true}
                    opacity={Math.min(0.3, geometry.belowFloorOpacity * 4.2)}
                    renderOrder={11}
                    ringSegmentPositions={ringSegmentPositions}
                  />
                  <ModelingLineOverlayRing
                    clippingPlanes={belowFloorClippingPlanes}
                    color={geometry.color}
                    depthTest={false}
                    opacity={Math.min(
                      MODELING_LINE_OVERLAY_GHOST_OPACITY,
                      geometry.belowFloorOpacity * 2.2,
                    )}
                    renderOrder={2}
                    ringSegmentPositions={ringSegmentPositions}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </group>
      ))}
      {showRectangleOutline ? (
        <Line
          color={MODELING_LINE_PREVIEW_DEFAULT_LINE_COLOR}
          depthTest={false}
          depthWrite={false}
          lineWidth={1.6}
          opacity={0.92}
          points={[
            ...modelingLinePreview.polygonPoints.map(
              (point) => new Vector3(...point),
            ),
            new Vector3(...modelingLinePreview.polygonPoints[0]),
          ]}
          renderOrder={12}
          transparent
        />
      ) : null}
      {showBoxWireframe
        ? modelingLinePreview.wireframeEdges.map(([startPoint, endPoint]) => (
            <Line
              color={MODELING_LINE_PREVIEW_DEFAULT_LINE_COLOR}
              depthTest={false}
              depthWrite={false}
              key={`${startPoint.join(":")}-${endPoint.join(":")}`}
              lineWidth={1.4}
              opacity={0.88}
              points={[new Vector3(...startPoint), new Vector3(...endPoint)]}
              renderOrder={12}
              transparent
            />
          ))
        : null}
      <Line
        color={
          linePreviewAxisSnapped
            ? MODELING_LINE_PREVIEW_AXIS_SNAPPED_LINE_COLOR
            : MODELING_LINE_PREVIEW_DEFAULT_LINE_COLOR
        }
        dashed
        dashScale={1.4}
        depthTest={false}
        depthWrite={false}
        gapSize={0.12}
        lineWidth={1.8}
        opacity={0.98}
        points={[
          new Vector3(...modelingLinePreview.startPosition),
          new Vector3(...modelingLinePreview.currentPosition),
        ]}
        renderOrder={12}
        transparent
      />
      {showCurrentAxisSnapGuides ? (
        <group position={modelingLinePreview.currentPosition}>
          {renderModelingAxisSnapGuides(
            modelingLinePreview.currentPosition,
            modelingPointerSnappedAxes,
            modelingPointerSnappedAxisTargets,
            11,
          )}
        </group>
      ) : null}
      <points renderOrder={13} position={modelingLinePreview.startPosition}>
        <bufferGeometry>
          <bufferAttribute
            args={[new Float32Array([0, 0, 0]), 3]}
            attach="attributes-position"
            count={1}
          />
        </bufferGeometry>
        <pointsMaterial
          color={
            modelingLinePreview.startSnapped
              ? MODELING_LINE_PREVIEW_SNAPPED_VERTEX_COLOR
              : MODELING_LINE_PREVIEW_DEFAULT_VERTEX_COLOR
          }
          size={MODEL_VERTEX_PIXEL_SIZE}
          sizeAttenuation={false}
        />
      </points>
      {showCurrentPoint ? (
        <points renderOrder={13} position={modelingLinePreview.currentPosition}>
          <bufferGeometry>
            <bufferAttribute
              args={[new Float32Array([0, 0, 0]), 3]}
              attach="attributes-position"
              count={1}
            />
          </bufferGeometry>
          <pointsMaterial
            color={
              modelingLinePreview.currentSnapped
                ? MODELING_LINE_PREVIEW_SNAPPED_VERTEX_COLOR
                : MODELING_LINE_PREVIEW_DEFAULT_VERTEX_COLOR
            }
            size={MODEL_VERTEX_PIXEL_SIZE}
            sizeAttenuation={false}
          />
        </points>
      ) : null}
    </group>
  );
}

function ModelingMesh() {
  const currentModelId = useModelingStore((state) => state.currentModelId);
  const modelsById = useModelingStore((state) => state.modelsById);
  const selectRoot = useModelingStore((state) => state.selectRoot);
  const selectedRoot = useModelingStore((state) => state.selectedRoot);
  const selectedVertexIds = useModelingStore(
    (state) => state.selectedVertexIds,
  );
  const activeModel = modelsById[currentModelId];
  const selectedVertexSet = useMemo(
    () => new Set(selectedVertexIds),
    [selectedVertexIds],
  );
  const edgeGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel || activeModel.edgeOrder.length === 0) {
      return geometry;
    }

    const positions = activeModel.edgeOrder.flatMap((edgeId) => {
      const edge = activeModel.edgesById[edgeId];
      return edge.vertexIds.flatMap(
        (vertexId) => activeModel.verticesById[vertexId].position,
      );
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel]);
  const faceGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel || activeModel.faceOrder.length === 0) {
      return geometry;
    }

    const positions = activeModel.faceOrder.flatMap((faceId) => {
      const face = activeModel.facesById[faceId];
      return face.vertexIds.flatMap(
        (vertexId) => activeModel.verticesById[vertexId].position,
      );
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [activeModel]);
  const vertexGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel) {
      return geometry;
    }

    const positions = activeModel.vertexOrder.flatMap((vertexId) => {
      if (selectedVertexSet.has(vertexId)) {
        return [];
      }

      return activeModel.verticesById[vertexId].position;
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel, selectedVertexSet]);
  const selectedVertexGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    if (!activeModel) {
      return geometry;
    }

    const positions = activeModel.vertexOrder.flatMap((vertexId) =>
      selectedVertexSet.has(vertexId)
        ? activeModel.verticesById[vertexId].position
        : [],
    );

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [activeModel, selectedVertexSet]);
  const vertexMaterial = useMemo(
    () =>
      new PointsMaterial({
        color: "#000000",
        size: MODEL_VERTEX_PIXEL_SIZE,
        sizeAttenuation: false,
      }),
    [],
  );
  const selectedVertexMaterial = useMemo(
    () =>
      new PointsMaterial({
        color: "#ffffff",
        size: MODEL_VERTEX_PIXEL_SIZE,
        sizeAttenuation: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      edgeGeometry.dispose();
      faceGeometry.dispose();
      vertexGeometry.dispose();
      selectedVertexGeometry.dispose();
      vertexMaterial.dispose();
      selectedVertexMaterial.dispose();
    };
  }, [
    edgeGeometry,
    faceGeometry,
    selectedVertexGeometry,
    selectedVertexMaterial,
    vertexGeometry,
    vertexMaterial,
  ]);

  if (!activeModel) {
    return null;
  }

  return (
    <group
      position={activeModel.rootPosition}
      rotation={activeModel.rootRotation}
    >
      {selectedRoot ? (
        <points renderOrder={8}>
          <bufferGeometry>
            <bufferAttribute
              args={[new Float32Array([0, 0, 0]), 3]}
              attach="attributes-position"
              count={1}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffffff"
            depthTest={false}
            size={8}
            sizeAttenuation={false}
          />
        </points>
      ) : null}
      <points
        onPointerDown={(event) => {
          event.stopPropagation();
          selectRoot();
        }}
        renderOrder={9}
      >
        <bufferGeometry>
          <bufferAttribute
            args={[new Float32Array([0, 0, 0]), 3]}
            attach="attributes-position"
            count={1}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ef4444"
          depthTest={false}
          size={5}
          sizeAttenuation={false}
        />
      </points>
      {activeModel.faceOrder.length > 0 ? (
        <mesh geometry={faceGeometry} renderOrder={3}>
          <meshStandardMaterial
            color="#2563eb"
            opacity={0.42}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ) : null}
      {activeModel.edgeOrder.length > 0 ? (
        <lineSegments geometry={edgeGeometry} renderOrder={4}>
          <lineBasicMaterial color="#bfdbfe" />
        </lineSegments>
      ) : null}
      <points
        geometry={vertexGeometry}
        material={vertexMaterial}
        renderOrder={6}
      />
      <points
        geometry={selectedVertexGeometry}
        material={selectedVertexMaterial}
        renderOrder={7}
      />
    </group>
  );
}

function ModelingCameraController({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const setModelingCamera = useUiStore((state) => state.setModelingCamera);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const { modelingCamera } = useUiStore.getState();

    camera.position.set(...modelingCamera.position);
    controls.target.set(...modelingCamera.target);
    controls.update();

    const syncCamera = () => {
      setModelingCamera({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
      });
    };

    syncCamera();
    controls.addEventListener("change", syncCamera);

    return () => {
      syncCamera();
      controls.removeEventListener("change", syncCamera);
    };
  }, [camera, controlsRef, setModelingCamera]);

  return null;
}

export function ModelingScene() {
  const modelingCameraDragging = useUiStore(
    (state) => state.modelingCameraDragging,
  );
  const modelingCameraOverride = useUiStore(
    (state) => state.modelingCameraOverride,
  );
  const clearModelingLassoSelection = useUiStore(
    (state) => state.clearModelingLassoSelection,
  );
  const modelingLassoSelectionPhase = useUiStore(
    (state) => state.modelingLassoSelection.phase,
  );
  const modelingTool = useUiStore((state) => state.modelingTool);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [depthHint, setDepthHint] = useState<ModelingPointerDepthHint | null>(
    null,
  );
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });

  useEffect(() => {
    if (modelingLassoSelectionPhase !== "settled") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearModelingLassoSelection();
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearModelingLassoSelection, modelingLassoSelectionPhase]);
  const sceneShellBackground = useMemo(() => {
    const base = new Color("#b5bec8");
    const upper = base.clone().lerp(new Color("#c7d0da"), 0.18);
    const lower = base.clone().lerp(new Color("#596473"), 0.74);

    return `radial-gradient(circle at top, rgba(${Math.round(
      upper.r * 255,
    )}, ${Math.round(upper.g * 255)}, ${Math.round(
      upper.b * 255,
    )}, 0.22), transparent 42%), linear-gradient(180deg, #9ba7b3 0%, #7f8c99 42%, #${lower.getHexString()} 100%)`;
  }, []);

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden border border-white/12 shadow-[0_18px_40px_rgba(3,10,20,0.22)]"
      style={{ background: sceneShellBackground }}
    >
      <Canvas
        camera={{ fov: 42, position: [8.8, 6.4, 9.4] }}
        dpr={[1, 1.8]}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
        shadows
      >
        <color attach="background" args={["#74808d"]} />
        <ambientLight intensity={0.96} />
        <hemisphereLight
          args={["#e8edf3", "#47515f", 1.14]}
          position={[0, 12, 0]}
        />
        <directionalLight
          castShadow
          color="#eef3f8"
          intensity={1.8}
          position={[10, 14, 6]}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <Grid
          args={[200, 200]}
          cellColor="#d7dee7"
          cellSize={1}
          cellThickness={0.85}
          fadeDistance={160}
          fadeStrength={1.4}
          followCamera
          infiniteGrid
          position={[0, 0, 0]}
          sectionColor="#ffffff"
          sectionSize={5}
          sectionThickness={1.35}
        />
        <ModelingMesh />
        <ModelingPointer />
        <ModelingPointerDepthHintController setDepthHint={setDepthHint} />
        <ModelingLinePreviewOverlay />
        <ModelingInputController controlsRef={controlsRef} />
        <ModelingCameraController controlsRef={controlsRef} />
        <OrbitControls
          enableDamping={false}
          enabled={effectiveTool === "camera"}
          enablePan={effectiveTool === "camera"}
          enableRotate={effectiveTool === "camera"}
          enableZoom={false}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.PAN,
          }}
          ref={controlsRef}
          target={[0, 1.1, 0]}
        />
      </Canvas>
      <ModelingLassoOverlay />
      {depthHint ? (
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-slate-50/72"
          style={{
            transform: `translate(${depthHint.pointerScreenPosition.x + MODELING_POINTER_DEPTH_HINT_OFFSET_X_PX}px, ${
              depthHint.pointerScreenPosition.y +
              MODELING_POINTER_DEPTH_HINT_OFFSET_Y_PX
            }px)`,
          }}
        >
          {depthHint.nearCount > 0 ? (
            <span>{`near ${depthHint.nearCount}`}</span>
          ) : null}
          {depthHint.farCount > 0 ? (
            <span>{`far ${depthHint.farCount}`}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
