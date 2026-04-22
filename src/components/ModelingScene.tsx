import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
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
  PointsMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelingStore } from "../store/modelingStore";
import type { MoveOverlayOrientationMode } from "../store/uiStore";
import { getEffectiveModelingTool, useUiStore } from "../store/uiStore";
import { ModelingInputController } from "./scene/ModelingInputController";
import { calculateDragPlaneOverlayGeometry } from "./scene/dragPlaneOverlay";
import { modelingPointerPositionsMatch } from "./scene/modelingPointerUtils";

const POINTER_AXIS_LENGTH = 1.25;
const POINTER_AXIS_DASH_EXTENT = 120;
const POINTER_AXIS_DASH_SIZE = 0.18;
const POINTER_AXIS_GAP_SIZE = 0.08;
const MODEL_VERTEX_PIXEL_SIZE = 4;
const DEFAULT_OVERLAY_NORMAL = new Vector3(0, 0, 1);
const MODELING_LINE_PREVIEW_DEFAULT_VERTEX_COLOR = "#ffffff";
const MODELING_LINE_PREVIEW_SNAPPED_VERTEX_COLOR = "#22c55e";
const MODELING_LINE_PREVIEW_COLORS = {
  "camera-facing": "#fdba74",
  "screen-horizontal": "#facc15",
  "screen-vertical": "#fb923c",
} as const;

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
  const panelRadius = useUiStore((state) => state.modelingPointerPanelRadius);
  const verticalAxisFloorY = useUiStore(
    (state) => state.modelingPointerVerticalAxisFloorY,
  );
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
  const xAxisLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [-POINTER_AXIS_LENGTH, 0, 0, POINTER_AXIS_LENGTH, 0, 0],
        3,
      ),
    );
    const material = new LineBasicMaterial({ color: "#f87171" });
    return new LineSegments(geometry, material);
  }, []);
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
    const material = new LineBasicMaterial({ color: "#60a5fa" });
    return new LineSegments(geometry, material);
  }, []);
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
      opacity: 0.7,
      transparent: true,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, []);
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
      opacity: 0.7,
      transparent: true,
    });
    const line = new LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
  }, []);
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
    (effectiveTool === "camera" && !modelingPointerVisibleInCameraTool)
  ) {
    return null;
  }

  return (
    <group position={position}>
      <primitive object={xAxisDashLine} renderOrder={8} />
      <primitive object={yAxisDashLine} renderOrder={8} />
      <primitive object={zAxisDashLine} renderOrder={8} />
      <primitive object={xAxisLine} renderOrder={10} />
      <primitive object={yAxisLine} renderOrder={10} />
      <primitive object={zAxisLine} renderOrder={10} />
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

function ModelingLinePreviewOverlay() {
  const modelingLineOverlayDisplayMode = useUiStore(
    (state) => state.modelingLineOverlayDisplayMode,
  );
  const modelingLinePreview = useUiStore((state) => state.modelingLinePreview);
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
          radiusMultiplier: 1.15,
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
        orientationMode,
        planeQuaternion,
      };
    });
  }, [modelingLinePreview, overlayModes]);

  if (!modelingLinePreview.active || overlayGeometries.length === 0) {
    return null;
  }

  const showCurrentPoint = !modelingPointerPositionsMatch(
    modelingLinePreview.startPosition,
    modelingLinePreview.currentPosition,
  );

  return (
    <group raycast={() => null}>
      {overlayGeometries.map((geometry) => (
        <mesh
          key={geometry.orientationMode}
          position={geometry.center}
          quaternion={geometry.planeQuaternion}
        >
          <circleGeometry args={[geometry.radius, 96]} />
          <meshBasicMaterial
            color={geometry.color}
            depthTest={true}
            depthWrite={false}
            opacity={0.16}
            side={DoubleSide}
            transparent
          />
        </mesh>
      ))}
      <Line
        color="#bfdbfe"
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
    <group>
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
  const modelingTool = useUiStore((state) => state.modelingTool);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const effectiveTool = getEffectiveModelingTool({
    modelingCameraDragging,
    modelingCameraOverride,
    modelingTool,
  });
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
      className="h-full min-h-0 w-full overflow-hidden border border-white/12 shadow-[0_18px_40px_rgba(3,10,20,0.22)]"
      style={{ background: sceneShellBackground }}
    >
      <Canvas
        camera={{ fov: 42, position: [8.8, 6.4, 9.4] }}
        dpr={[1, 1.8]}
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
    </div>
  );
}
